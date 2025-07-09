// /assets/js/weather.js
const API_KEY = "1c02b03323602402ca922b951c366cc9";
const LAT = -6.3521;
const LON = 107.0577;

const weatherDiv = document.getElementById("weather");
const cuacaDiv = document.getElementById("cuaca");

async function fetchWeather() {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=metric&lang=id&appid=${API_KEY}`);
    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    renderWeather(data);
    
    
  } catch (error) {
    console.error(error);
    weatherDiv.innerHTML = `<p class="text-danger">Gagal mengambil data cuaca.</p>`;
  }
}

function capitalizeWords(str) {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

function renderWeather(data) {
  const temp = data.main.temp;
  const condition = capitalizeWords(data.weather[0].description);
  const humidity = data.main.humidity;
  const wind = data.wind.speed;

  weatherDiv.innerHTML = `
    <tr><td class="text-success align-middle"><i class="fas fa-temperature-high"></i></td>
    <td class="align-middle text-nowrap"><strong>Suhu</strong></td><td class="align-middle text-end px-1">:</td><td class="align-middle">${temp}°C</td></tr>
    <tr><td class="text-success align-middle"><i class="fas fa-cloud"></i></td>
    <td class="align-middle text-nowrap"><strong>Kondisi</strong></td><td class="align-middle text-end px-1">:</td><td class="align-middle">${condition}</td></tr>
    <tr><td class="text-success align-middle"><i class="fas fa-tint"></i></td>
    <td class="align-middle text-nowrap"><strong>Kelembapan</strong></td><td class="align-middle text-end px-1">:</td><td class="align-middle">${humidity}%</td></tr>
    <tr><td class="text-success align-middle"><i class="fas fa-wind"></i></td>
    <td class="align-middle text-nowrap"><strong>Angin</strong></td><td class="align-middle text-end px-1">:</td><td class="align-middle">${wind} m/s</td></tr>`;
}


function updateBackground(condition) {
  let bgUrl = "";

  if (condition.includes("clear")) {
    bgUrl = "url('https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif')"; // cerah
  } else if (condition.includes("cloud")) {
    bgUrl = "url('https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif')"; // berawan
  } else if (condition.includes("rain")) {
    bgUrl = "url('https://media.giphy.com/media/3o7TKz8FyHJ9KpR3HG/giphy.gif')"; // hujan
  } else if (condition.includes("storm")) {
    bgUrl = "url('https://media.giphy.com/media/3o7TKsQ7RS2t5r1a4s/giphy.gif')"; // badai
  } else {
    bgUrl = "url('https://media.giphy.com/media/l0MYN7xEmbQKxJz8w/giphy.gif')"; // default
  }

  cuacaDiv.style.backgroundImage = bgUrl;
}


fetchWeather();
setInterval(fetchWeather, 5 * 60 * 1000);
