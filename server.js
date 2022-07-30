require('dotenv').config();

const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 3000;

const axios = require('axios');
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.post('/location', (req, res) => {
  let options;

  switch (true) {
    case !req.body.query:
      options = {
        method: 'GET',
        url: 'https://spott.p.rapidapi.com/places/ip/me',
        headers: {
          'X-RapidAPI-Key': API_KEY,
          'X-RapidAPI-Host': 'spott.p.rapidapi.com'
        }
      };
      break;
    
    default:
      options = {
        method: 'GET',
        url: 'https://spott.p.rapidapi.com/places',
        params: {q: req.body.query},
        headers: {
          'X-RapidAPI-Key': API_KEY,
          'X-RapidAPI-Host': 'spott.p.rapidapi.com'
        }
      };
      break;
  }

  axios.request(options)
    .then(data => res.json(data.data))
    .catch(error => console.error(error));

});

app.post('/search', (req, res) => {
  const options = {
    method: 'GET',
    url: 'https://spott.p.rapidapi.com/places/autocomplete',
    params: {limit: '5', skip: '0', q: req.body.query, type: 'CITY'},
    headers: {
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': 'spott.p.rapidapi.com'
    }
  };

  axios.request(options)
    .then(data => res.json(data.data))
    .catch(error => console.error(error));
});

app.post('/weather-forecast', (req, res) => {
  const options = {
    method: 'GET',
    url: 'https://weatherapi-com.p.rapidapi.com/forecast.json',
    params: {q: req.body.query.coordinates.latitude + " " + req.body.query.coordinates.longitude, days: '3'},
    headers: {
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': 'weatherapi-com.p.rapidapi.com'
    }
  };

  axios.request(options)
    .then(data => res.json(data.data))
    .catch(error => console.error(error));

});

app.listen(PORT, () => {
  console.log("Server started at port: " + PORT);
});