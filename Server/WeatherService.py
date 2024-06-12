import numpy as np
import pandas as pd
import openmeteo_requests
import requests_cache
from retry_requests import retry

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

    def fetchForecast(self, latitude = 52.52, longitude = 13.41, past_days = 92, forecast_days = 1, model = "ecmwf_ifs04"):
        url = "https://previous-runs-api.open-meteo.com/v1/forecast"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "past_days": past_days,
            "forecast_days": forecast_days,
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