import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const LAT = 10.2371;
const LON = 77.4895;
const OWM_KEY = process.env.OWM_API_KEY;

router.get('/alerts', async (req, res) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${OWM_KEY}&units=metric`;
    const resp = await fetch(url);
    const data = await resp.json();

    const clouds = data.clouds?.all ?? 0;
    const sunVisibility = Math.max(0, 100 - clouds);

    res.json({
      location: 'Kodaikanal Solar Observatory',
      sunVisibility,
      clouds,
      weather: data.weather[0]?.description || 'unknown',
      tempC: data.main?.temp ?? null,
      humidity: data.main?.humidity ?? null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
