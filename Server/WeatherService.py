import numpy as np
import pandas as pd
import openmeteo_requests
import requests_cache
from retry_requests import retry
from datetime import datetime, timedelta

class WeatherService():
    def __init__(self):
        self.cache_session = requests_cache.CachedSession('.cache', expire_after = -1)
        self.retry_session = retry(self.cache_session, retries = 5, backoff_factor = 0.2)
        self.openmeteo = openmeteo_requests.Client(session = self.retry_session)
        self.url = "https://archive-api.open-meteo.com/v1/archive"

        self.data_fetched = ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "precipitation"]
        self.column_names = ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "precipitation"]

    def getAverageTemperature(self, latiutude, longitude):
        params = {
        "latitude": latiutude,
        "longitude": longitude,
        "start_date": "1980-01-02",
        "end_date": "2009-12-31",
        "daily": "temperature_2m_mean",
        "timezone": "auto"
        }
        responses = self.openmeteo.weather_api(self.url, params=params)

        response = responses[0]
        daily = response.Daily()
        daily_temperature_2m = daily.Variables(0).ValuesAsNumpy()
        date = pd.date_range(
            start = pd.to_datetime(daily.Time(), unit = "s", utc = True),
            end = pd.to_datetime(daily.TimeEnd(), unit = "s", utc = True),
            freq = pd.Timedelta(seconds = daily.Interval()),
            inclusive = "left"
            )
        daily_data = {
            "year": date.year,
            "month": date.month,
            "temperature": daily_temperature_2m
            }

        hourly_dataframe = pd.DataFrame(data = daily_data)
        hourly_dataframe = hourly_dataframe.groupby(["year", "month"])["temperature"].mean().reset_index()
        return hourly_dataframe.to_json(orient='records', date_format='iso')
    
    def getStatistics1(self, latiutude, longitude, startDate, endDate):
        params = {
        "latitude": latiutude,
        "longitude": longitude,
        "start_date": startDate,
        "end_date": endDate,
        "timezone": "auto",
        "daily": ["temperature_2m_mean", "rain_sum"]
        }
        responses = self.openmeteo.weather_api(self.url, params=params)
        response = responses[0]
        daily = response.Daily()
        daily_temperature_2m_mean = daily.Variables(0).ValuesAsNumpy()
        daily_rain_sum = daily.Variables(1).ValuesAsNumpy()
        date = pd.date_range(
            start = pd.to_datetime(daily.Time(), unit = "s", utc = True),
            end = pd.to_datetime(daily.TimeEnd(), unit = "s", utc = True),
            freq = pd.Timedelta(seconds = daily.Interval()),
            inclusive = "left"
        )
        daily_data = {"date": date}
        daily_data["temperature_2m_mean"] = daily_temperature_2m_mean
        daily_data["rain_sum"] = daily_rain_sum
        daily_data["prev_day"] = daily_data["date"] - pd.Timedelta(days = 1)
        daily_dataframe = pd.DataFrame(data = daily_data)

        result = pd.merge(daily_dataframe, daily_dataframe, left_on='date', right_on='prev_day', how='inner')
        result = result.dropna()
        result = result.drop(columns=['prev_day_x', 'prev_day_y', 'date_x'])
        result = result.rename(columns={
            'date_y': 'date', 
            'rain_sum_x': 'rain_sum_prev_day', 
            'temperature_2m_mean_x': 'temperature_prev_day', 
            'rain_sum_y': 'rain_sum',
            'temperature_2m_mean_y': 'temperature'})
        result["temp_differerence"] = np.round(result["temperature"] - result["temperature_prev_day"])
        result["rain_difference"] = result["rain_sum"] - result["rain_sum_prev_day"]
        result.drop(columns= ["temperature", "temperature_prev_day", "rain_sum_prev_day", "rain_sum"], inplace=True)
        result = result.groupby(["temp_differerence"]).agg({"date": 'size', 'rain_difference': 'mean'}).reset_index()
        result = result.rename(columns={"date": "count", "rain_difference": "mean_rain_difference"})
        result = result.where(result["count"] > 100).dropna()
        result = result.sort_values(by="temp_differerence")

        return result.to_json(orient='records', date_format='iso')

    # Fetch past forecasts
    def fetchForecast(self, latitude, longitude, past_days, model):
        url = "https://previous-runs-api.open-meteo.com/v1/forecast"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "past_days": past_days,
            "forecast_days": 1,
            "hourly": self.data_fetched,
            "models": model
        }
        responses = self.openmeteo.weather_api(url, params=params)
        # Process hourly data. The order of variables needs to be the same as requested.
        response = responses[0]
        hourly = response.Hourly()

        hourly_data = {"date": pd.date_range(
            start = pd.to_datetime(hourly.Time(), unit = "s", utc = True),
            end = pd.to_datetime(hourly.TimeEnd(), unit = "s", utc = True),
            freq = pd.Timedelta(seconds = hourly.Interval()),
            inclusive = "left"
        )}
        for i, col_name in enumerate(self.column_names):
            hourly_data[col_name] = hourly.Variables(i).ValuesAsNumpy()
            
        hourly_dataframe = pd.DataFrame(data = hourly_data)
        return hourly_dataframe.dropna()
    # Fetch archived meto data
    def fetchArchive(self, latitude, longitude, start_date, end_date):
        url = "https://archive-api.open-meteo.com/v1/archive"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date,
            "end_date": end_date,
            "hourly": self.data_fetched
        }
        responses = self.openmeteo.weather_api(url, params=params)
        # Process hourly data. The order of variables needs to be the same as requested.
        response = responses[0]
        hourly = response.Hourly()

        hourly_data = {"date": pd.date_range(
            start = pd.to_datetime(hourly.Time(), unit = "s", utc = True),
            end = pd.to_datetime(hourly.TimeEnd(), unit = "s", utc = True),
            freq = pd.Timedelta(seconds = hourly.Interval()),
            inclusive = "left"
        )}
        for i, col_name in enumerate(self.column_names):
            hourly_data[col_name] = hourly.Variables(i).ValuesAsNumpy()

        hourly_dataframe = pd.DataFrame(data = hourly_data)
        return hourly_dataframe.dropna()
    # Fetch past forecast and archived meteo data
    def getForecastAndArchive(self, latitude, longitude, pastDays, model):
        startDate = (datetime.now() - timedelta(days=pastDays)).strftime('%Y-%m-%d')
        endDate = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        forecast = self.fetchForecast(latitude, longitude, pastDays, model)
        archive = self.fetchArchive(latitude, longitude, startDate, endDate)
        forecast = forecast[:len(archive)]
        return forecast, archive
    # Calucate difference between forecast and actual data
    def calulateDiff(self, forecast, archive):
        diff = forecast.drop(columns=["date"]) - archive.drop(columns=["date"])
        diff = diff.abs()
        relative_diff = diff / archive.drop(columns=["date"])
        relative_diff = relative_diff.abs()
        diff["date"] = forecast["date"]
        relative_diff["date"] = forecast["date"]
        return diff, relative_diff
    # Get avereage difference for data grouped by hours
    def getAvgDiffByHour(self, diff):
        return diff.groupby(diff["date"].dt.hour)[[col for col in diff.columns if col != 'date']].mean().reset_index()
    # Get avereage difference for data grouped by hour, each column is soft-maxed so 1 means highest difference
    def getSoftMaxDiffByHour(self, diff):	  
        def soft_max(col):
            return (col - np.min(col)) / (np.max(col) - np.min(col))
        result = self.getAvgDiffByHour(diff).drop(columns=["date"]).apply(soft_max)
        result["date"] = range(0, 24)
        return result
    
    # Forecast and archived meteo data as JSON
    def getForecastArchiveJson(self, latitude, longitude, pastDays, model):
        forecast, archive = self.getForecastAndArchive(latitude, longitude, pastDays, model)
        fjson = forecast.to_json(orient='records', date_format='iso')
        ajson = archive.to_json(orient='records', date_format='iso')
        return f'{{"archive":{ajson},"forecast":{fjson}}}' 
    # Difference between forecast and actual data as JSON
    def getDiffJson(self, latitude, longitude, pastDays, model):
        forecast, archive = self.getForecastAndArchive(latitude, longitude, pastDays, model)
        diff, _ = self.calulateDiff(forecast, archive)
        return diff.to_json(orient='records', date_format='iso')
    # Difference between forecast and actual data grouped by hours as JSON
    def getAvgDiffByHourJson(self, latitude, longitude, pastDays, model):
        forecast, archive = self.getForecastAndArchive(latitude, longitude, pastDays, model)
        diff, _ = self.calulateDiff(forecast, archive)
        avg_diff = self.getAvgDiffByHour(diff)
        return avg_diff.to_json(orient='records', date_format='iso')
    # Soft-maxed difference between forecast and actual data grouped by hours as JSON
    def getSoftMaxDiffByHourJson(self, latitude, longitude, pastDays, model):
        forecast, archive = self.getForecastAndArchive(latitude, longitude, pastDays, model)
        diff, _ = self.calulateDiff(forecast, archive)
        avg_softmax_diff = self.getSoftMaxDiffByHour(diff)
        return avg_softmax_diff.to_json(orient='records', date_format='iso')
