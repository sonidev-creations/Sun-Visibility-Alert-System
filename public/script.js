// ===== DOM Elements =====
const locationInput = document.getElementById('locationInput');
const locationBtn = document.getElementById('locationBtn');
const selectedLocation = document.getElementById('selectedLocation');
const weatherDescription = document.getElementById('weatherDescription');
const cloudInfo = document.getElementById('cloudInfo');
const visibilityInfo = document.getElementById('visibilityInfo');
const tempInfo = document.getElementById('tempInfo');
const refreshBtn = document.getElementById('refreshBtn');
const statusText = document.getElementById('status');

const API_KEY = "0be3328a27a6ce7de22219c7e88263e3";

async function fetchWeather(location) {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`);
    const data = await response.json();

    if (data.cod !== 200) throw new Error(data.message);

    selectedLocation.textContent = `Current Location: ${data.name}, ${data.sys.country}`;

    const mainWeather = data.weather[0].main.toLowerCase();
    const description = data.weather[0].description;
    weatherDescription.textContent = `Weather: ${description}`;
    weatherDescription.className = `weather-text ${mainWeather}`;

    const clouds = data.clouds.all;
    cloudInfo.textContent = `Clouds: ${clouds}%`;
    if (clouds >= 85) cloudInfo.className = 'cloud-text overcast';
    else if (clouds >= 30) cloudInfo.className = 'cloud-text few';
    else cloudInfo.className = 'cloud-text clear';

   

    const tempC = data.main.temp;
    const tempF = (tempC * 9/5 + 32).toFixed(1);
    tempInfo.textContent = `Temperature: ${tempC}°C / ${tempF}°F`;

    // ===== Sun Status =====
    const isSunny = mainWeather === 'clear';
    statusText.textContent = isSunny ? '🌞 Sun is visible!' : '☁️ Sun not fully visible';
  } catch (err) {
    weatherDescription.textContent = '⚠ Could not fetch weather data!';
    cloudInfo.textContent = '';
    visibilityInfo.textContent = '';
    tempInfo.textContent = '';
    statusText.textContent = '⚠ Unable to check sun status!';
    console.error(err);
  }
}


locationBtn.addEventListener('click', () => {
  const location = locationInput.value.trim();
  if (location) fetchWeather(location);
});

refreshBtn.addEventListener('click', () => {
  const currentLocationText = selectedLocation.textContent.replace('Current Location: ', '');
  if (currentLocationText && currentLocationText !== 'Not set') fetchWeather(currentLocationText);
});

document.addEventListener('DOMContentLoaded', () => {
  const defaultLocation = 'Kodaikanal';
  locationInput.value = defaultLocation;
  fetchWeather(defaultLocation);
});
