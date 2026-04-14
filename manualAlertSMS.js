// manualAlertSMS_KSO.js
import dotenv from 'dotenv';
dotenv.config();

import Twilio from 'twilio';
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import Alert from './models/alert.js';  // Make sure your Alert schema has alertId, message, status, time

// --- Twilio Setup ---
const accountSid = 'YOUR_TWILIO_ACCOUNT_SID';
const authToken = 'YOUR_TWILIO_AUTH_TOKEN';
const twilioNumber = 'YOUR_TWILIO_PHONE';
const alertPhone = 'YOUR_ALERT_PHONE';

const client = new Twilio(accountSid, authToken);

// --- OpenWeatherMap Setup ---
const LAT = 10.2371;  // Kodaikanal latitude
const LON = 77.4895;  // Kodaikanal longitude
const OWM_KEY = 'CITY_OWM_KEY';

// Fetch current weather from OpenWeatherMap
async function fetchWeather() {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${OWM_KEY}&units=metric`;
    const resp = await fetch(url);
    const data = await resp.json();
    return {
      tempC: data.main?.temp ?? null,
      humidity: data.main?.humidity ?? null,
      clouds: data.clouds?.all ?? 0,
      weatherDesc: data.weather?.[0]?.description ?? 'unknown'
    };
  } catch (err) {
    console.error('❌ Weather fetch failed:', err);
    return { tempC: 0, humidity: 0, clouds: 0, weatherDesc: 'unknown' };
  }
}


function computeSunVisibility(clouds) {
  return Math.max(0, 100 - clouds);
}

function composeMessage(weather) {
  const sunVisibility = computeSunVisibility(weather.clouds);
  return `KSO SUN ALERT — Kodaikanal Solar Observatory\n🌞 Sun Visibility: ${sunVisibility}%\n☁ Clouds: ${weather.clouds}%\n🌦 Weather: ${weather.weatherDesc}\n🌡 Temperature: ${Math.round(weather.tempC)}°C\n💧 Humidity: ${weather.humidity}%`;
}

async function sendAlertSMS() {
  try {
  
    const weather = await fetchWeather();
    const sunVisibility = computeSunVisibility(weather.clouds);
    const messageBody = composeMessage(weather);


    await mongoose.connect(process.env.MONGO_URI);

    await Alert.create({
      alertId: Date.now(),          
      location: 'Kodaikanal Solar Observatory',
      time: new Date(),              
      status: 'active',              
      message: messageBody,          
      sunVisibility,
      clouds: weather.clouds,
      weather: weather.weatherDesc,
      tempC: weather.tempC,
      humidity: weather.humidity,
    });

    console.log('✅ Weather saved to MongoDB');

    const message = await client.messages.create({
      from: twilioNumber,
      to: alertPhone,
      body: messageBody
    });

    console.log('✅ SMS sent! SID:', message.sid);
    console.log('Message content:\n', messageBody);

  } catch (err) {
    console.error('❌ Failed:', err);
  } finally {
    mongoose.connection.close();
  }
}

sendAlertSMS();
