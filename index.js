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
const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

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

// function to get random model images for the homepage hero section based on different fashion categories
async function getHeroImages() {
  const heroQueries = [
    "editorial fashion model",
    "male fashion model portrait",
    "beauty model portrait",
    "streetwear model",
    "runway fashion model"
  ];

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

// async function getFeaturedImages() {
//   const featuredDirections = [
//     {
//       name: "Editorial",
//       style: "editorial",
//       query: "editorial fashion model"
//     },
//     {
//       name: "Commercial",
//       style: "commercial",
//       query: "male commercial model portrait",
//       type: "local",
//       image: "/images/C_Ahir-36.jpeg",
//       alt: "Commercial modeling inspiration"
//     },
//     {
//       name: "Runway",
//       style: "runway",
//       query: "runway fashion model"
//     },
//     {
//       name: "Streetwear",
//       style: "streetwear",
//       query: "streetwear model"
//     },
//     {
//       name: "Beauty",
//       style: "beauty",
//       query: "beauty model portrait"
//     },
//     {
//       name: "Fitness",
//       style: "fitness",
//       query: "fitness model"
//     }
//   ];

//   const imageRequests = featuredDirections.map((direction) => {
//     return axios.get(PEXELS_API_URL, {
//       headers: {
//         Authorization: process.env.PEXELS_API_KEY
//       },
//       params: {
//         query: direction.query,
//         per_page: 1,
//         orientation: "portrait"
//       }
//     });
//   });

//   const responses = await Promise.all(imageRequests);

//   return responses.map((response, index) => {
//     const photo = response.data.photos[0];
//     const direction = featuredDirections[index];

//     return {
//       name: direction.name,
//       style: direction.style,
//       image: photo.src.large,
//       alt: photo.alt || `${direction.name} modeling inspiration`
//     };
//   });
// }

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
          Authorization: process.env.PEXELS_API_KEY
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});