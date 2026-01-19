const BasePlugin = require('./base-plugin');
const axios = require('axios');

/**
 * Weather Plugin
 * Fetches weather data from OpenWeatherMap API
 */
class WeatherPlugin extends BasePlugin {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey || process.env.OPENWEATHER_API_KEY;
    this.location = config.location || 'Melbourne,AU';
    this.units = config.units || 'metric';
    
    if (!this.apiKey) {
      console.warn('[WeatherPlugin] No API key provided. Plugin disabled.');
      this.enabled = false;
    }
  }

  async fetchData() {
    if (!this.apiKey) {
      throw new Error('OpenWeather API key not configured');
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${this.location}&units=${this.units}&appid=${this.apiKey}`;
    
    const response = await axios.get(url);
    const data = response.data;

    return {
      location: data.name,
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      temp_min: Math.round(data.main.temp_min),
      temp_max: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      wind_speed: data.wind.speed,
      clouds: data.clouds.all,
      timestamp: new Date().toISOString()
    };
  }

  validate(data) {
    return data && 
           typeof data.temp === 'number' && 
           typeof data.location === 'string';
  }
}

module.exports = WeatherPlugin;
