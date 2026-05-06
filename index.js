import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import shootSuggestions from './data/shootSuggestions.json' with { type: 'json' };


dotenv.config();

// Initialize Express app and set up constants for API keys and URLs
const app = express();
const port = 3000;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const defaultCity = 'New York';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

let savedImages = [];

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Function to determine the weather category based on description and temperature
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

// function to get weather emoji based on the weather category
function getWeatherEmoji(category) {
  switch (category) {
    case "rain":
      return "🌧️";

    case "snow":
      return "❄️";

    case "mist":
      return "🌫️";

    case "clouds":
      return "☁️";

    case "hot":
      return "☀️";

    case "cold":
      return "🥶";

    case "clear":
      return "☀️";

    default:
      return "🌤️";
  }
}


// function to get shoot suggestion based on the weather category, which includes a title, description, and styling tips for the photoshoot
function getShootSuggestion(description, temp) {
  const category = getWeatherCategory(description, temp);
  const suggestions = shootSuggestions[category] || shootSuggestions.default;
  const randomIndex = Math.floor(Math.random() * suggestions.length);

  // return the shoot suggestion along with the weather category and corresponding emoji to be used in the planner results page
  return {
    category: category,
    emoji: getWeatherEmoji(category),
    ...suggestions[randomIndex]
  };
}

// function to get random model images for the homepage hero section based on different fashion categories
async function getHeroImages() {
  const heroQueries = [
    "editorial fashion model",
    "male fashion model portrait",
    "beauty model portrait",
    "streetwear model",
    "runway fashion model"
  ];

  // make parallel API requests to Pexels for each fashion category to retrieve a random image for the hero section of the homepage
  const imageRequests = heroQueries.map((query) => {
    return axios.get(PEXELS_API_URL, {
      headers: {
        Authorization: process.env.PEXELS_API_KEY
      },
      params: {
        query: query,
        per_page: 1,
        page: Math.floor(Math.random() * 10) + 1,
        orientation: "portrait"
      }
    });
  });

  const responses = await Promise.all(imageRequests);

  return responses.map((response) => {
    return response.data.photos[0];
  });
}

// function to get featured images for different modeling categories on the homepage, with a mix of local images and Pexels API results
async function getFeaturedImages() {
  const featuredDirections = [
    {
      name: "Editorial",
      style: "editorial",
      query: "editorial fashion model"
    },
    {
      name: "Commercial",
      style: "commercial",
      query: "male commercial model portrait",
      type: "local",
      image: "/images/C_Ahir-36.jpeg",
      alt: "Commercial modeling inspiration"
    },
    {
      name: "Runway",
      style: "runway",
      query: "runway fashion model"
    },
    {
      name: "Streetwear",
      style: "streetwear",
      query: "streetwear model"
    },
    {
      name: "Beauty",
      style: "beauty",
      query: "beauty model portrait"
    },
    {
      name: "Fitness",
      style: "fitness",
      query: "fitness model"
    }
  ];
  const featuredImages = await Promise.all(
    featuredDirections.map(async (direction) => {
      if (direction.type === "local") {
        return {
          name: direction.name,
          style: direction.style,
          image: direction.image,
          alt: direction.alt
        };
      }

      const response = await axios.get(PEXELS_API_URL, {
        headers: {
          Authorization: PEXELS_API_KEY
        },
        params: {
          query: direction.query,
          per_page: 1,
          orientation: "portrait"
        }
      });

      const photo = response.data.photos[0];

      return {
        name: direction.name,
        style: direction.style,
        image: photo.src.large,
        alt: photo.alt || `${direction.name} modeling inspiration`
      };
    })
  );

  return featuredImages;
}

// function to determine the best time of day for a photoshoot based on the weather category, which can be used in the planner results page to give users guidance on when to schedule their shoot for optimal lighting conditions
function getShootTime(category) {
  switch (category) {
    case "hot":
    case "clear":
      return {
        time: "6:30 PM - 8:00 PM",
        label: "Golden hour",
        note: "Soft warm light with clean shadows"
      };
    case "clouds":
      return {
        time: "1:00 PM - 5:00 PM",
        label: "Soft daylight",
        note: "Cloud cover gives smooth, even light"
      };
    case "rain":
      return {
        time: "5:00 PM - 7:00 PM",
        label: "Reflective evening",
        note: "Wet streets and covered spots add drama"
      };
    case "mist":
      return {
        time: "7:00 AM - 9:00 AM",
        label: "Cinematic morning",
        note: "Fog and haze create soft atmosphere"
      };
    case "snow":
    case "cold":
      return {
        time: "10:00 AM - 12:00 PM",
        label: "Bright cold light",
        note: "Late morning gives cleaner winter portraits"
      };
    default:
      return {
        time: "2:00 PM - 5:00 PM",
        label: "Flexible window",
        note: "Balanced light for a versatile shoot"
      };
  }
}

// Route handler for the homepage, which fetches current weather data for the default city, gets hero and featured images, determines shoot suggestions based on the weather, and renders the index.ejs template with all the relevant data to display
app.get('/', async (req, res) => {
    try {
        const response = await axios.get(WEATHER_API_URL, {
            params: {
                q: defaultCity,
                units: 'imperial',
                appid: process.env.WEATHER_API_KEY
            }
        });
        const heroResponse = await getHeroImages();
        const featuredResponse = await getFeaturedImages();
        const description = response.data.weather[0].description;
        const temp = response.data.main.temp;
        const shootSuggestion = getShootSuggestion(description, temp);
        console.log("temperature", response.data.main.temp);
        console.log("description", response.data.weather[0].description);
        
        res.render('index.ejs', { weatherData: response.data.weather[0].description, 
            city: response.data.name,
            temp: response.data.main.temp,
            shootSuggestion: shootSuggestion,
            heroImage: heroResponse,
            featuredImages: featuredResponse
        });
    } catch (error) {
        console.error("Failed to fetch weather:", error.message);
        res.status(500).send('Error occurred while fetching data');
    }
});

// Route handler for the inspiration search page, which allows users to search for model photos based on a query and renders the results using the inspirationSearch.ejs template, with error handling to display a user-friendly message if the API request fails or if no search query is provided
app.get('/inspiration-search', async (req, res) => {
  const searchQuery = req.query.search;

  if (!searchQuery) {
    return res.render("inspirationSearch.ejs", {
      searchQuery: null,
      photos: []
    });
  }

  try {
    const response = await axios.get(PEXELS_API_URL, {
      headers: {
        Authorization: process.env.PEXELS_API_KEY
      },
      params: {
        query: searchQuery,
        per_page: 24,
        orientation: "portrait"
      }
    });

    res.render("inspirationSearch.ejs", {
      searchQuery: searchQuery,
      photos: response.data.photos
    });
  } catch (error) {
    console.error("Failed to fetch inspiration images:", error.message);

    res.render("inspirationSearch.ejs", {
      searchQuery: searchQuery,
      photos: [],
      error: "Could not load inspiration images. Please try again."
    });
  }
});

// Route handlers for the shoot planner page, which allows users to input a city and shoot style to receive a personalized photoshoot plan based on current weather conditions, including suggested shoot types, optimal shoot times, and relevant model photos from the Pexels API, with error handling to guide users in case of missing input or API failures
app.get("/planner", (req, res) => {
  res.render("planner.ejs", {
    plan: null,
    photos: [],
    savedImages: savedImages,
    currentUrl: req.originalUrl,
    error: null
  });
});

// Route handler for processing the shoot planner form submission, which validates user input, fetches current weather data for the specified city, determines shoot suggestions and optimal shoot times based on the weather, retrieves relevant model photos from the Pexels API based on the user's chosen shoot style and weather conditions
app.get("/planner/results", async (req, res) => {
  const city = req.query.city;
  const style = req.query.style;

  if (!city || !style) {
    return res.render("planner.ejs", {
      plan: null,
      photos: [],
      error: "Please enter both a city and a shoot style."
    });
  }

  try {
    const weatherResponse = await axios.get(WEATHER_API_URL, {
      params: {
        q: city,
        units: "imperial",
        appid: process.env.WEATHER_API_KEY
      }
    });

    const description = weatherResponse.data.weather[0].description;
    const temp = weatherResponse.data.main.temp;
    const cityName = weatherResponse.data.name;
    const humidity = weatherResponse.data.main.humidity;
    const wind = Math.round(weatherResponse.data.wind.speed);

    const shoot = getShootSuggestion(description, temp);
    const shootTime = getShootTime(shoot.category);

    const pexelsResponse = await axios.get(PEXELS_API_URL, {
      headers: {
        Authorization: process.env.PEXELS_API_KEY
      },
      params: {
        query: `${style} model ${shoot.title}`,
        per_page: 8,
        orientation: "portrait"
      }
    });

    const plan = {
      city: cityName,
      userStyle: style,
      weather: description,
      temp: Math.round(temp),
      humidity,
      wind,
      shoot,
      shootTime
    };

    res.render("planner.ejs", {
      plan,
      photos: pexelsResponse.data.photos,
      savedImages: savedImages,
      currentUrl: req.originalUrl,
      error: null
    });
  } catch (error) {
    console.error("Planner error:", error.message);

    res.render("planner.ejs", {
      plan: null,
      photos: [],
      error: "Could not build your shoot plan. Try another city or style."
    });
  }
});

app.get("/api/saved-images", (req, res) => {
  res.json(savedImages);
});

app.post("/api/saved-images", (req, res) => {
  const image = {
    id: String(req.body.id),
    src: req.body.src,
    alt: req.body.alt
  };

  const exists = savedImages.some((savedImage) => savedImage.id === image.id);

  if (!exists) {
    savedImages.push(image);
  }

  res.json(savedImages);
});

app.delete("/api/saved-images/:id", (req, res) => {
  savedImages = savedImages.filter((image) => image.id !== req.params.id);
  res.json(savedImages);
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});