import cron from 'node-cron';
import twilio from 'twilio';
import fetch from 'node-fetch'; // Ensure you installed node-fetch

// OpenWeatherMap API
const OWM_KEY = 'OWM_API_KE';
const OWM_CITY = 'OWM_CITY';

// Twilio credentials
const TWILIO_SID = 'YOUR_TWILIO_SID';
const TWILIO_TOKEN = 'YOUR_TWILIO_AUTH_TOKEN';
const TWILIO_PHONE = 'YOUR_TWILIO_PHONE';
const ALERT_PHONE = 'YOUR_ALERT_PHONE';
const client = twilio(TWILIO_SID, TWILIO_TOKEN);

/**
 * fetchWeather: calls OpenWeatherMap current weather by city name
 */
export async function fetchWeather() {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(OWM_CITY)}&appid=${OWM_KEY}&units=metric`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`OWM fetch failed: ${resp.status} ${txt}`);
  }
  const data = await resp.json();
  const clouds = data.clouds?.all ?? 0;
  const weatherDesc = (data.weather && data.weather[0]?.description) || 'unknown';
  const tempC = data.main?.temp ?? null;
  const visibilityMeters = data.visibility ?? null;
  const windSpeed = data.wind?.speed ?? null;
  const name = data.name ?? OWM_CITY;
  const timestamp = new Date().toISOString();

  return { clouds, weatherDesc, tempC, visibilityMeters, windSpeed, name, timestamp };
}

/**
 * compute sun visibility from cloud coverage
 */
function computeSunVisibility(clouds) {
  const sunVisiblePercent = Math.max(0, Math.round(100 - clouds));
  let cloudLabel = 'Clear';
  if (clouds >= 80) cloudLabel = 'Overcast';
  else if (clouds >= 60) cloudLabel = 'Mostly Cloudy';
  else if (clouds >= 30) cloudLabel = 'Partly Cloudy';
  else if (clouds > 0) cloudLabel = 'Mostly Clear';
  return { sunVisiblePercent, cloudLabel };
}

/**
 * compose SMS message
 */
function composeMessage(weather) {
  const { clouds, weatherDesc, tempC, visibilityMeters, windSpeed, name, timestamp } = weather;
  const { sunVisiblePercent, cloudLabel } = computeSunVisibility(clouds);

  return [
    `KSO SUN ALERT — ${name}`,
    `Sun Visibility: ${sunVisiblePercent}%`,
    `Clouds: ${cloudLabel} (${clouds}%)`,
    `Weather: ${weatherDesc}${tempC !== null ? `, ${Math.round(tempC)}°C` : ''}`,
    `Visibility: ${visibilityMeters !== null ? `${visibilityMeters}m` : 'unknown'}`,
    `Wind: ${windSpeed !== null ? `${windSpeed} m/s` : 'unknown'}`,
    `Checked: ${new Date(timestamp).toLocaleString()}`
  ].join('\n');
}

/**
 * sendAlerts: fetch weather, compose SMS and send via Twilio
 */
export async function sendAlerts() {
  try {
    console.log('Fetching weather for', OWM_CITY);
    const weather = await fetchWeather();
    const messageBody = composeMessage(weather);

    console.log('Sending SMS to:', ALERT_PHONE);
    const message = await client.messages.create({
      body: messageBody,
      from: TWILIO_PHONE,
      to: ALERT_PHONE
    });

    console.log(`✅ SMS sent! SID: ${message.sid}`);
    return { sid: message.sid, body: messageBody, weather };
  } catch (err) {
    console.error('❌ Failed to send SMS:', err.message || err);
    throw err;
  }
}

/**
 * scheduleAlerts: schedule a cron job
 */
export function scheduleAlerts(cronPattern) {
  cron.schedule(cronPattern, async () => {
    try {
      await sendAlerts();
    } catch (err) {
      console.error('Scheduled alert failed:', err.message || err);
    }
  }, {
    scheduled: true,
    recoverMissedExecutions: false
  });

  console.log(`📅 Alerts scheduled with pattern: ${cronPattern}`);
}
