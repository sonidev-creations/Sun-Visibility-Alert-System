import fetch from "node-fetch";

export async function getWeatherData(city) {
  const apiKey = "YOUR_OWM_API_KEY";
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.main) throw new Error("Could not fetch weather data");

  return {
    temperature: data.main.temp,
    condition: data.weather[0].description,
    humidity: data.main.humidity, // ✅ This is required
  };
}
