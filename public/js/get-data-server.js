let coords = null;
let forecast = null;
let search = null;

getData();

async function getData(query = false) {

  loader.body.dataset.loaderStatus = "pending";

  if (isFake) {
    //badData coordsFake forecastFake
    coords = await getFakeData(coordsFake, 1000).catch(err => console.log(err));
    if (checkIsValidCoords(coords) === false) return;
    forecast = await getFakeData(forecastFake, 2000).catch(err => console.log(err));
  } else {
    coords = await serverRequest("/location", query).catch(err => console.log(err));
    if (checkIsValidCoords(coords) === false) return;
    forecast = await serverRequest("/weather-forecast", coords).catch(err => console.log(err));
  }

  try {
    updateWeather(coords, forecast, "full");
    loader.body.dataset.loaderStatus = "success";
  } catch(err) {
    loader.body.dataset.loaderStatus = "error";
  }

  async function getFakeData(fakeData, delay) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (fakeData) resolve(fakeData)
        else reject("Bad data recived");
      }, delay);
    });
  }

  function checkIsValidCoords(coords) {
    try {
      coords.name;
    } catch (e) {
      loader.body.dataset.loaderStatus = "search-fail";
      return false;
    }
  }

}

async function serverRequest(type, query) {
  let result = null;

  let bodyRequest = {"query": query};

  await fetch(type, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(bodyRequest)
  })
    .then(res => res.json())
    .then(data => result = data);

  if (type !== "/search" && result.length > 1) result = result[0];

  return result;
}

function updateWeather(coords, weatherData, type) {
  //CURRENT WEATHER
  //location
  if (type === "full") {
    currentFields["city"].textContent = coords.name;
    currentFields["admin-division"].textContent = coords.adminDivision1.name;
    currentFields["country"].textContent = coords.country.id;
  }

  //temperature
  switch (true) {
    case appContainer.dataset.systemType === "metric":
      currentFields["avg-temp"].textContent = Math.round(weatherData.current.temp_c);
      currentFields["min-temp"].textContent = Math.round(weatherData.forecast.forecastday[0].day.mintemp_c);
      currentFields["max-temp"].textContent = Math.round(weatherData.forecast.forecastday[0].day.maxtemp_c);
      break;

    case appContainer.dataset.systemType === "eng":
      currentFields["avg-temp"].textContent = weatherData.current.temp_f;
      currentFields["min-temp"].textContent = weatherData.forecast.forecastday[0].day.mintemp_f;
      currentFields["max-temp"].textContent = weatherData.forecast.forecastday[0].day.maxtemp_f;
      break;
  }

  //condition
  if (type === "full") {
    currentFields["current-img"].setAttribute("src", "https:"+ weatherData.current.condition.icon);
    currentFields["current-condition"].textContent = weatherData.current.condition.text;
  }

  //details
  switch (true) {
    case appContainer.dataset.systemType === "metric":
      currentFields["feelslike"].textContent = Math.round(weatherData.current.feelslike_c);
      currentFields["wind"].textContent = weatherData.current.wind_kph;
      break;
    
    case appContainer.dataset.systemType === "eng":
      currentFields["feelslike"].textContent = weatherData.current.feelslike_f;
      currentFields["wind"].textContent = weatherData.current.wind_mph;
      break;
  }

  if (type === "full") {
    currentFields["humidity"].textContent = weatherData.current.humidity;
    currentFields["rain"].textContent = weatherData.forecast.forecastday[0].day.daily_chance_of_rain;
  }

  //HOURLY WEATHER
  if (type === "full") {
    updateHourlyField("hourly-img");
    updateHourlyField("hourly-condition");
  }
  updateHourlyField("avg-temp");
  
  //DAILY WEATHER
  updateDailyField(weatherData);

  function updateHourlyField(field) {
    let hourIterator = new Date().getHours();
    let dayIterator = 0;

    for (let hour of hourlyFields[field]) {
      if (hourIterator > 23) {
        dayIterator++;
        hourIterator = 0;
      }

      switch (true) {
        case field === "hourly-img":
          hour.setAttribute("src", "https:"+ weatherData.forecast.forecastday[dayIterator].hour[hourIterator].condition.icon);
          break;

        case field === "avg-temp":
          if (appContainer.dataset.systemType === "metric") {
            hour.textContent = Math.round(weatherData.forecast.forecastday[dayIterator].hour[hourIterator].temp_c);
          } else {
            hour.textContent = weatherData.forecast.forecastday[dayIterator].hour[hourIterator].temp_f;
          }
          break;

        case field === "hourly-condition":
          hour.textContent = weatherData.forecast.forecastday[dayIterator].hour[hourIterator].condition.text;
          break;
      }
      
      hourIterator++;
    }
  }

  function updateDailyField(weatherData) {
    let daysCount = weatherData.forecast.forecastday.length;
    let daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (let i = 1; i <= daysCount - 1; i++) {
      if (type === "full") {
        dailyFields["day"][i - 1].textContent = daysOfWeek[new Date(weatherData.forecast.forecastday[i].date).getDay()];
        dailyFields["img"][i - 1].setAttribute("src", `https:${weatherData.forecast.forecastday[i].day.condition.icon}`);
        dailyFields["condition"][i - 1].textContent = weatherData.forecast.forecastday[i].day.condition.text;
      }

      switch (true) {
        case appContainer.dataset.systemType === "metric":
          dailyFields["avg-temp"][i - 1].textContent = Math.round(weatherData.forecast.forecastday[i].day.avgtemp_c);
          dailyFields["min-temp"][i - 1].textContent = Math.round(weatherData.forecast.forecastday[i].day.mintemp_c);
          dailyFields["max-temp"][i - 1].textContent = Math.round(weatherData.forecast.forecastday[i].day.maxtemp_c);
          dailyFields["wind"][i - 1].textContent = weatherData.forecast.forecastday[i].day.maxwind_kph;
          break;
        
        case appContainer.dataset.systemType === "eng":
          dailyFields["avg-temp"][i - 1].textContent = weatherData.forecast.forecastday[i].day.avgtemp_f;
          dailyFields["min-temp"][i - 1].textContent = weatherData.forecast.forecastday[i].day.mintemp_f;
          dailyFields["max-temp"][i - 1].textContent = weatherData.forecast.forecastday[i].day.maxtemp_f;
          dailyFields["wind"][i - 1].textContent = weatherData.forecast.forecastday[i].day.maxwind_mph;
          break;
      }

      if (type === "full") {
        dailyFields["rain"][i - 1].textContent = weatherData.forecast.forecastday[i].day.daily_chance_of_rain;
        dailyFields["humidity"][i - 1].textContent = weatherData.forecast.forecastday[i].day.avghumidity;
      }
    }
  }
}