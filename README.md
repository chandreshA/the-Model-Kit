Note: the openWeather and Pexel APIs used in this project require API keys to retrive data for authentication. create free acounts for both at https://openweathermap.org/guide#openweather_api_overview, and https://www.pexels.com/api/ respectively. once you have them, replace the WEATHER_API_KEY and PEXELS_API_KEY with their respective api keys, and the website should work as expected



Start project using nodemon index.js if you have nodemon. Otherwise use node index.js



Objectives
Develop an understanding of how to integrate public APIs into web projects.

Gain practical experience using Express/Node.js for server-side programming.

Enhance understanding of client-server communication using Axios.

Demonstrate ability to manipulate, present, and work with data retrieved from APIs.

Example Ideas
Use the JokeAPI to Create a website that gives the user a joke based on their name.

Use the OpenWeatherMap API to build a website that tells a user if it will rain tomorrow in their location of choice.

Use the Blockchain API to check the price of a cryptocurrency for the user.

Use the CocktailDB API to make a website that gives the user a random cocktail recipe with images of the cocktail.

Use the Open UV API to make a website based on your home location that tells you if you need to apply sunscreen today.

Bonus points for choosing your own API and creating something of your own. Sometimes, you'll decide on an API and then realise that it doesn't work, that's all a part of the process, just move on to the next one and try again!

Requirements
1. API Choice
Browse through the provided list and choose an API of interest. This choice should be guided by the potential to retrieve, manipulate, and present data in a meaningful and interactive way. I recommend choosing an API that does not require authentication and is CORS enabled. (What is CORS?)

2. Project Planning
Think through your project, researching the chosen API, its features, what data it will provide, and how it will be used in your web application.

3. Project Setup
Set up a new Node.js project using Express.js.

Include Axios for making HTTP requests.

Include EJS for templating.

Ensure that the project has a structured directory and file organization.

4. API Integration
Implement at least a GET endpoint to interact with your chosen API.

Use Axios to send HTTP requests to the API and handle responses.

5. Data Presentation
Design the application to present the retrieved data in a user-friendly way. Use appropriate HTML, CSS, and a templating engine like EJS.

6. Error Handling
Ensure that error handling is in place for both your application and any API requests. You can console log any errors, but you can also give users any user-relevant errors.