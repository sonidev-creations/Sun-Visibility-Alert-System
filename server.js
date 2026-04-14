import dotenv from 'dotenv';
import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Map cloud cover % to label
function getCloudLabel(clouds) {
  if (clouds <= 30) return 'Clear';
  if (clouds <= 70) return 'Partly Cloudy';
  return 'Overcast';
}

// GET /api/status?city=CityName
app.get('/api/status', async (req, res) => {
  const city = req.query.city || 'Kodaikanal';
  const apiKey = process.env.OPENWEATHER_API_KEY || 'YOUR_OWN_API_KEY';
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: 'OpenWeather API key not configured' });
  }

  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    const response = await fetch(weatherUrl);
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ ok: false, error: `OpenWeather error: ${errText}` });
    }
    const data = await response.json();

    const weatherDesc = data.weather?.[0]?.description || 'N/A';
    const clouds = data.clouds?.all ?? 0;
    const cloudLabel = getCloudLabel(clouds);
    const visibilityMeters = data.visibility ?? 'N/A';
    const tempC = data.main?.temp ?? 'N/A';
    const humidity = data.main?.humidity ?? 'N/A';
    const windSpeed = data.wind?.speed ?? 'N/A';

    res.json({
      ok: true,
      city: data.name || city,
      weatherDesc,
      clouds,
      cloudLabel,
      visibilityMeters,
      tempC,
      humidity,
      windSpeed,
    });
  } catch (err) {
    console.error('Error fetching weather:', err);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// POST /api/sms/send
app.post('/api/sms/send', (req, res) => {
  const { city } = req.body || {};
  if (!city) {
    return res.status(400).json({ ok: false, error: 'City is required' });
  }

  const message = `Test SMS Alert from KSO SunAlert: Current monitoring city is ${city}.`;
  console.log('Simulated SMS sent:', message);

  res.json({
    ok: true,
    message,
  });
});

// ✅ Fixed fallback for all other routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`KSO SunAlert server running at http://localhost:${PORT}`);
});
