import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const defaultCity = 'New York';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

app.use(express.static('public'));

app.get('/', async (req, res) => {
    try {
        const response = await axios.get(WEATHER_API_URL, {
            params: {
                q: defaultCity,
                units: 'imperial',
                appid: process.env.WEATHER_API_KEY // Ensure this matches your .env key name
            }
        });
        console.log("temperature", response.data.main.temp);
        console.log("description", response.data.weather[0].description);
        
        res.render('index.ejs', { weatherData: response.data.weather[0].description, 
            city: response.data.name,
            temp: response.data.main.temp
        });
    } catch (error) {
        console.error("Failed to fetch weather:", error.message);
        res.status(500).send('Error occurred while fetching data');
    }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});