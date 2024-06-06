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

        for response in responses:
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
