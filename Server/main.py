from flask import Flask, request, jsonify, g
from flask_cors import CORS, cross_origin
import pandas as pd
from WeatherService import WeatherService

WeatherService = WeatherService()


app = Flask(__name__)
CORS(app)


@app.route('/api', methods=['GET'])
def api():
    return WeatherService.getAverageTemperature(52.52, 13.41)

@app.route('/api/statistics1', methods=['GET'])
def statitics1():
    latitude = request.args.get('latitude')
    longitude = request.args.get('longitude')
    startDate = request.args.get('startDate')
    endDate = request.args.get('endDate')
    return WeatherService.getStatistics1(latitude, longitude, startDate, endDate)

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)