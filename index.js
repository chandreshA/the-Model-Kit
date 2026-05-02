import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import shootSuggestions from './data/shootSuggestions.json' with { type: 'json' };


dotenv.config();

const app = express();
const port = 3000;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const defaultCity = 'New York';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

app.use(express.static('public'));

function getWeatherCategory(description, temp) {
    const weather = description.toLowerCase();

  switch (true) {
    case weather.includes("rain"):
    case weather.includes("drizzle"):
    case weather.includes("thunderstorm"):
      return "rain";

    case weather.includes("snow"):
      return "snow";

    case weather.includes("mist"):
    case weather.includes("fog"):
    case weather.includes("haze"):
    case weather.includes("smoke"):
      return "mist";

    case weather.includes("cloud"):
      return "clouds";

    case weather.includes("clear") && temp >= 80:
      return "hot";

    case weather.includes("clear") && temp <= 45:
      return "cold";

    case weather.includes("clear"):
      return "clear";
    case temp >= 85:
      return "hot";

    case temp <= 40:
      return "cold";

      default:
        return 'default';
    }
}

function getShootSuggestion(description, temp) {
  const category = getWeatherCategory(description, temp);
  const suggestions = shootSuggestions[category] || shootSuggestions.default;

  const randomIndex = Math.floor(Math.random() * suggestions.length);

  return {
    category: category,
    ...suggestions[randomIndex]
  };
}


app.get('/', async (req, res) => {
    try {
        const response = await axios.get(WEATHER_API_URL, {
            params: {
                q: defaultCity,
                units: 'imperial',
                appid: process.env.WEATHER_API_KEY
            }
        });
        const description = response.data.weather[0].description;
        const temp = response.data.main.temp;
        const shootSuggestion = getShootSuggestion(description, temp);
        console.log("temperature", response.data.main.temp);
        console.log("description", response.data.weather[0].description);
        
        res.render('index.ejs', { weatherData: response.data.weather[0].description, 
            city: response.data.name,
            temp: response.data.main.temp,
            shootSuggestion: shootSuggestion
        });
    } catch (error) {
        console.error("Failed to fetch weather:", error.message);
        res.status(500).send('Error occurred while fetching data');
    }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});