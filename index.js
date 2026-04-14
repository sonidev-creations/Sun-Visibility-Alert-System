import express from 'express';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import twilio from 'twilio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static(join(__dirname, 'public')));

// Environment
const PORT = process.env.PORT || 3000;
const OWM_KEY = process.env.OWM_API_KEY;
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE; // Twilio number (from)
const DEFAULT_ALERT_PHONE = process.env.ALERT_PHONE; // default 'to' number if not provided

if (!OWM_KEY) console.warn('Warning: OWM_API_KEY not set in .env (OpenWeatherMap).');
if (!TWILIO_SID || !TWILIO_TOKEN) console.warn('Warning: Twilio credentials missing in .env.');

// --- Helpers ---
async function fetchWeatherForCity(city = 'Kodaikanal') {
  if (!OWM_KEY) throw new Error('OWM_API_KEY not configured on server.');
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`OpenWeatherMap error: ${resp.status} ${txt}`);
  }
  const d = await resp.json();
  const clouds = d.clouds?.all ?? 0;
  const weatherDesc = d.weather?.[0]?.description ?? 'unknown';
  const tempC = d.main?.temp ?? null;
  const humidity = d.main?.humidity ?? null;
  const visibilityMeters = d.visibility ?? null;
  const windSpeedMS = d.wind?.speed ?? null;
  const cityName = d.name ?? city;
  const ts = new Date().toISOString();

  return {
    raw: d,
    name: cityName,
    clouds,
    weatherDesc,
    tempC,
    humidity,
    visibilityMeters,
    windSpeedMS,
    timestamp: ts
  };
}

function computeSunVisibility(cloudsPercent) {
  // simple heuristic: sun visible percent = 100 - cloud%
  const sunVisiblePercent = Math.max(0, Math.round(100 - (cloudsPercent ?? 0)));
  let cloudLabel = 'Clear';
  if (cloudsPercent >= 80) cloudLabel = 'Overcast';
  else if (cloudsPercent >= 60) cloudLabel = 'Mostly Cloudy';
  else if (cloudsPercent >= 30) cloudLabel = 'Partly Cloudy';
  else if (cloudsPercent > 0) cloudLabel = 'Mostly Clear';
  return { sunVisiblePercent, cloudLabel };
}

function composeSmsText(weather) {
  const { clouds, weatherDesc, tempC, visibilityMeters, windSpeedMS, name, timestamp } = weather;
  const { sunVisiblePercent, cloudLabel } = computeSunVisibility(clouds);

  const windKmh = windSpeedMS !== null ? Math.round(windSpeedMS * 3.6) : 'unknown';
  const visibilityText = visibilityMeters !== null ? `${visibilityMeters} m` : 'unknown';
  const tempText = tempC !== null ? `${Math.round(tempC)}°C` : 'unknown';

  const lines = [
    `KSO SUN ALERT — ${name}`,
    `Sun Visibility: ${sunVisiblePercent}%`,
    `Clouds: ${cloudLabel} (${clouds}%)`,
    `Weather: ${weatherDesc}${tempC !== null ? `, ${tempText}` : ''}`,
    `Visibility: ${visibilityText}`,
    `Wind: ${windKmh} km/h`,
    `Checked: ${new Date(timestamp).toLocaleString()}`
  ];
  return lines.join('\n');
}

// --- API Routes ---

// GET /api/weather?city=Chennai
app.get('/api/weather', async (req, res) => {
  const city = req.query.city || 'Kodaikanal';
  try {
    const weather = await fetchWeatherForCity(city);
    res.json({ ok: true, ...weather });
  } catch (err) {
    console.error('/api/weather error:', err.message || err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/status?city=Chennai
// returns computed fields used by the UI
app.get('/api/status', async (req, res) => {
  const city = req.query.city || 'Kodaikanal';
  try {
    const weather = await fetchWeatherForCity(city);
    const { sunVisiblePercent, cloudLabel } = computeSunVisibility(weather.clouds);
    res.json({
      ok: true,
      city: weather.name,
      sunVisiblePercent,
      clouds: weather.clouds,
      cloudLabel,
      weatherDesc: weather.weatherDesc,
      tempC: weather.tempC,
      visibilityMeters: weather.visibilityMeters,
      windSpeed: weather.windSpeedMS !== null ? Math.round(weather.windSpeedMS * 3.6) : null,
      humidity: weather.humidity,
      checkedAt: weather.timestamp
    });
  } catch (err) {
    console.error('/api/status error:', err.message || err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/sms/send  { "city": "Chennai", "to": "+91..." }
// sends SMS composed from the current weather for the given city
app.post('/api/sms/send', async (req, res) => {
  const city = (req.body && req.body.city) || req.query.city || 'Kodaikanal';
  const toNumber = (req.body && req.body.to) || DEFAULT_ALERT_PHONE;

  if (!toNumber) return res.status(400).json({ ok: false, error: 'Recipient phone number not set (to or ALERT_PHONE missing).' });

  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_PHONE) {
    return res.status(500).json({ ok: false, error: 'Twilio not configured on server (TWILIO_* missing).' });
  }

  try {
    const weather = await fetchWeatherForCity(city);
    const messageBody = composeSmsText(weather);

    const client = twilio(TWILIO_SID, TWILIO_TOKEN);
    const message = await client.messages.create({
      body: messageBody,
      from: TWILIO_PHONE,
      to: toNumber
    });

    console.log('SMS sent to', toNumber, 'SID:', message.sid);
    res.json({ ok: true, sid: message.sid, message: messageBody });
  } catch (err) {
    console.error('/api/sms/send error:', err.message || err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// default serve index for all other routes (keeps UI working with client-side routing if any)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
