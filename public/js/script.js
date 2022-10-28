// UI ELEMENTS

const appContainer = document.querySelector("[data-system-type]");

const loader = {
  "body": document.querySelector("[data-loader]"),
  "containers": {
    "icons": document.querySelector(`[data-loader-container="icons"]`),
    "texts": document.querySelector(`[data-loader-container="texts"]`),
  },
  "icons": {
    "pending": document.querySelector(`[data-loader-icon="pending"]`),
    "error": document.querySelector(`[data-loader-icon="error"]`),
    "searchFail": document.querySelector(`[data-loader-icon="search-fail"]`),
    "cacheWarn": document.querySelector(`[data-loader-icon="cache-warn"]`),
  },
  "texts": {
    "pending": document.querySelector(`[data-loader-text="pending"]`),
    "error": document.querySelector(`[data-loader-text="error"]`),
    "searchFail": document.querySelector(`[data-loader-text="search-fail"]`),
    "cacheWarn": document.querySelector(`[data-loader-text="cache-warn"]`),
  }
}

const navBar = document.querySelector("[data-nav]");

const searchField = document.querySelector("[data-search-field]");

const searchSuggestions = document.querySelector("[data-search-suggestions]");

const settingsButtons = {
  "search": document.querySelector(`[data-settings-button="search"]`),
  "radio": document.querySelectorAll("[data-settings-radio]"),
}

const currentFields = {
  "city": document.querySelector("[data-city]"),
  "admin-division": document.querySelector("[data-admin-division]"),
  "country": document.querySelector("[data-country]"),
  "avg-temp": document.querySelector("[data-current-avg-temp]"),
  "min-temp": document.querySelector("[data-current-min-temp]"),
  "max-temp": document.querySelector("[data-current-max-temp]"),
  "current-img": document.querySelector("[data-current-img]"),
  "current-condition": document.querySelector("[data-current-condition]"),
  "feelslike": document.querySelector("[data-feelslike]"),
  "wind": document.querySelector("[data-wind]"),
  "humidity": document.querySelector("[data-humidity]"),
  "rain": document.querySelector("[data-rain]"),
}

const hourlyFields = {
  "hourly-img": document.querySelectorAll("[data-hourly-img]"),
  "avg-temp": document.querySelectorAll("[data-hourly-avg-temp]"),
  "hourly-condition": document.querySelectorAll("[data-hourly-condition]")
}

const dailyFields = {
  "day": document.querySelectorAll("[data-day]"),
  "img": document.querySelectorAll("[data-daily-img]"),
  "condition": document.querySelectorAll("[data-daily-condition]"),
  "avg-temp": document.querySelectorAll("[data-daily-avg-temp]"),
  "min-temp": document.querySelectorAll("[data-daily-min-temp]"),
  "max-temp": document.querySelectorAll("[data-daily-max-temp]"),
  "rain": document.querySelectorAll("[data-daily-rain]"),
  "wind": document.querySelectorAll("[data-daily-wind]"),
  "humidity": document.querySelectorAll("[data-daily-humidity]")
}

const units = {
  "temperature": document.querySelectorAll("[data-unit-temp]"),
  "speed": document.querySelectorAll("[data-unit-speed]"),
}

// GET DATA FROM API (with server-side code)

let coords = null;
let forecast = null;
let search = null;
let dataIsCached = false;

getData();

async function getData(query = false) {

  loader.body.dataset.loaderStatus = "pending";

  if (isFake) {
    //badData coordsFake forecastFake
    coords = await getFakeData(coordsFake, 1000).catch(err => console.log(err));
    if (checkIsValidCoords(coords) === false) return;
    forecast = await getFakeData(forecastFake, 2000).catch(err => console.log(err));
  } else {
    switch (query) {
      case false:
        coords = await JSON.parse(window.localStorage.getItem("LOCATION"));
        if (coords === null) coords = await getPosition(query);
        break;
      default:
        coords = await getPosition(query);
    }
    
    if (query !== false && checkIsValidCoords(coords) === false) return;
    
    forecast = await serverRequest("/weather-forecast", coords).catch(err => console.log(err));
  }

  try {
    if (coords === undefined || forecast === undefined) {
      coords = await JSON.parse(window.localStorage.getItem("LOCATION"));
      forecast = await JSON.parse(window.localStorage.getItem("WEATHER_FORECAST"));
      dataIsCached = true;
    } else {
      dataIsCached = false;
    }

    updateWeather(coords, forecast, "full");
    
    switch (dataIsCached) {
      case true:
        loader.body.dataset.loaderStatus = "cache-warn";
        
        setTimeout(() => {
          loader.body.dataset.loaderStatus = "success";
        }, 5000)
        
        break;
      default:
        loader.body.dataset.loaderStatus = "success";
    }
    
  } catch(err) {
    loader.body.dataset.loaderStatus = "error";
  }

  async function getPosition(query) {
    let result = null;

    if (query) {
      result = await serverRequest("/location", query).catch(err => console.log(err));
      return result;
    }
    
    let coords = null;
    let location = null;
    
    try {
      coords = await new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej);
      });

      location = await (await fetch('https://api.db-ip.com/v2/free/self')).json();
      
      result = {
        coordinates: {
          latitude: coords.coords.latitude,
          longitude: coords.coords.longitude
        },
        name: location.city,
        adminDivision1: {
          name: location.stateProv
        },
        country: {
          id: location.countryCode,
        }
      };

      if (result.name.indexOf("(") > 0) {
        result.name = result.name.slice(0, (result.name.indexOf("(") - 1));
      }

      cachingData("LOCATION", result);

    } catch(err) {
      console.log(err);
      result = await serverRequest("/location", query).catch(err => console.log(err));
    }

    return result;
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
    } catch (err) {
      console.log(err)
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
    .then(data => result = data)
    .catch(err => {
      return null;
    });

  //if (type !== "/search" && result.length > 1) result = result[0];
  
  if (type !== "/search") {
    switch (true) {
      case result.length >= 1:
        result = result[0];
        break;
      case result.length === 0:
        return null;
    }
  }

  // caching result to localStorage of the app
  switch (type) {
    case "/location":
      cachingData("LOCATION", result);
      break;
    case "/weather-forecast":
      cachingData("WEATHER_FORECAST", result);
      break;
  }

  console.log(result);

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

function cachingData(key, data) {
  window.localStorage.setItem(key, JSON.stringify(data));
}

// UI LOGIC

document.documentElement.onselectstart = () => false;

navBar.addEventListener("pointerup", tabsNavigation, {passive: true});

loader.body.addEventListener("pointerup", retryFetching, {passive: true});

let isTyping = false;
let isTimer = false;
let prevString = searchField.value;

searchField.addEventListener("keydown", e => {
  if (e.code === "Space" && searchField.value.length === 0) e.preventDefault();
  if (e.code === "Space" && searchField.value[searchField.value.length - 1] === " ") e.preventDefault();
  
  if (e.code === "Enter") {
    searchCity();
    return;
  }
  
  if (isTimer && isTyping) clearTimeout(isTimer);
  isTimer = getCitiesSuggestions(e);
});

searchField.addEventListener("blur", removeCitiesSuggestions, {passive: true});

searchField.addEventListener("focus", e => {
  if (searchField.value.length === 0) return;
  if (searchSuggestions.children.length === 0) return;

  searchSuggestions.classList.add("cities-array--rolled");
}, {passive: true});

searchSuggestions.addEventListener("pointerup", e => {
  if (!e.target.hasAttribute("data-search-item") || e.target.dataset.locationId === "unknown") return;

  let index = Array.from(searchSuggestions.children).indexOf(e.target)

  searchField.value = search[index].name;

  searchCity(search[index].name);

}, {passive: true});

settingsButtons["search"].addEventListener("pointerup", e => searchCity(), {passive: true});

settingsButtons["radio"][0].addEventListener("change", () => appContainer.dataset.systemType = "metric", {passive: true});
settingsButtons["radio"][1].addEventListener("change", () => appContainer.dataset.systemType = "eng", {passive: true});

setMeasures();
setUnits();
setHours();

let weatherObserver = new MutationObserver(rec => {
  console.log(rec)
  cachingData("MEASURES", appContainer.dataset.systemType);
  setUnits();
  if (rec[0].oldValue !== "pending") updateWeather(coords, forecast, "short");
});

weatherObserver.observe(appContainer, {
  attributes: true,
  attributeFilter: ["data-system-type"],
  attributeOldValue: true
});

let loaderObserver = new MutationObserver(rec => {
  switch (true) {
    case (rec[0].target.dataset.loaderStatus === "success"):
      loader.body.classList.add("loader--hidden");
      break;

    case (rec[0].target.dataset.loaderStatus === "cache-warn"):
      loader.containers.icons.classList.add("loader__container-icons--cache-warn");

      loader.icons.pending.classList.add("loader__icon--hidden");
      loader.texts.pending.classList.add("loader__text--hidden");

      loader.icons.searchFail.classList.add("loader__icon--hidden");
      loader.texts.searchFail.classList.add("loader__text--hidden");

      loader.icons.error.classList.add("loader__icon--hidden");
      loader.texts.error.classList.add("loader__text--hidden");
      
      loader.icons.cacheWarn.classList.remove("loader__icon--hidden");
      loader.texts.cacheWarn.classList.remove("loader__text--hidden");
      break;
    
    case (rec[0].target.dataset.loaderStatus === "error"):
      loader.containers.icons.classList.add("loader__container-icons--error");

      loader.icons.pending.classList.add("loader__icon--hidden");
      loader.texts.pending.classList.add("loader__text--hidden");

      loader.icons.searchFail.classList.add("loader__icon--hidden");
      loader.texts.searchFail.classList.add("loader__text--hidden");

      loader.icons.cacheWarn.classList.add("loader__icon--hidden");
      loader.texts.cacheWarn.classList.add("loader__text--hidden");

      loader.icons.error.classList.remove("loader__icon--hidden");
      loader.texts.error.classList.remove("loader__text--hidden");
      break;

    case (rec[0].target.dataset.loaderStatus === "search-fail"):
      loader.containers.icons.classList.add("loader__container-icons--search-fail");

      loader.icons.pending.classList.add("loader__icon--hidden");
      loader.texts.pending.classList.add("loader__text--hidden");

      loader.icons.error.classList.add("loader__icon--hidden");
      loader.texts.error.classList.add("loader__text--hidden");

      loader.icons.cacheWarn.classList.add("loader__icon--hidden");
      loader.texts.cacheWarn.classList.add("loader__text--hidden");

      loader.icons.searchFail.classList.remove("loader__icon--hidden");
      loader.texts.searchFail.classList.remove("loader__text--hidden");
      break;
      
    case (rec[0].target.dataset.loaderStatus === "pending"):
      loader.body.classList.remove("loader--hidden");

      loader.containers.icons.classList.remove("loader__container-icons--error");
      loader.containers.icons.classList.remove("loader__container-icons--search-fail");
      loader.containers.icons.classList.remove("loader__container-icons--cache-warn");

      loader.icons.pending.classList.remove("loader__icon--hidden");
      loader.texts.pending.classList.remove("loader__text--hidden");

      loader.icons.searchFail.classList.add("loader__icon--hidden");
      loader.texts.searchFail.classList.add("loader__text--hidden");

      loader.icons.error.classList.add("loader__icon--hidden");
      loader.texts.error.classList.add("loader__text--hidden");

      loader.icons.cacheWarn.classList.add("loader__icon--hidden");
      loader.texts.cacheWarn.classList.add("loader__text--hidden");
      break;
  }
});

loaderObserver.observe(loader.body, {
  attributes: true,
  attributeFilter: ["data-loader-status"]
});

function tabsNavigation(e, target) {
  if (target === undefined) target = e.target.closest("[data-nav-item]");
  
  if (target.classList.contains("main-nav__item--active")) return;
  
  document.querySelector(".main-nav__item--active").classList.remove("main-nav__item--active");
  target.classList.add("main-nav__item--active");

  let targetTab = document.querySelector(`[data-tab=${target.dataset.navItem}`);
  document.querySelector(".tabs-container__tab--active").classList.remove("tabs-container__tab--active");
  targetTab.classList.add("tabs-container__tab--active");
}

function setHours() {
  let currentDate = new Date();
  let initialHour = currentDate.getHours() + 1;

  let hours = document.querySelectorAll("[data-hours]");

  for (let hour of hours) {
    let modStringCur = "";
    let modStringNext = "";

    let nextHour = initialHour + 1;
    if (nextHour === 24) nextHour = "00";
    
    if (`${initialHour}`.length === 1) modStringCur = "0";
    if (`${nextHour}`.length === 1) modStringNext = "0";

    hour.textContent = `${modStringCur}${initialHour}:00 - ${modStringNext}${nextHour}:00`;
    
    initialHour++;
    if (initialHour === 24) initialHour = 0;
  }
}

async function setMeasures() {
  let cachedSystem = await JSON.parse(window.localStorage.getItem("MEASURES"));
  
  switch (cachedSystem) {
    case "metric":
      settingsButtons["radio"][0].checked = "true";
      break;
    case "eng":
      settingsButtons["radio"][1].checked = "true";
      break;
    default:
      cachingData("MEASURES", "metric");
      appContainer.dataset.systemType = "metric";
      settingsButtons["radio"][0].checked = "true";
      return;
  }

  appContainer.dataset.systemType = cachedSystem;
}

function setUnits() {
  switch (true) {
    case appContainer.dataset.systemType === "metric":
      for (let item of units.temperature) {
        item.textContent = "°C";
      }
      for (let item of units.speed) {
        item.textContent = "km/h";
      }
      break;

    case appContainer.dataset.systemType === "eng":
      for (let item of units.temperature) {
        item.textContent = "°F";
      }
      for (let item of units.speed) {
        item.textContent = "m/h";
      }
      break;
  }
}

function searchCity(useID = false) {
  if (searchField.value.length === 0) return;

  if (searchSuggestions.firstElementChild.dataset.locationId === "unknown") {
    searchField.parentElement.classList.add("weather-settings__wrapper--animated");
    searchField.classList.add("weather-settings__search-field--animated");
    settingsButtons.search.classList.add("weather-settings__search-button--animated");
    
    setTimeout(() => {
      searchField.parentElement.classList.remove("weather-settings__wrapper--animated")
      searchField.classList.remove("weather-settings__search-field--animated");
      settingsButtons.search.classList.remove("weather-settings__search-button--animated");
    }, 400);

    return;
  }
  
  if (searchField.value.toLowerCase() === searchField.dataset.prevValue.toLowerCase()) {
    searchField.setAttribute("placeholder", searchField.dataset.prevValue);
    searchField.value = "";
    return;
  }

  searchField.blur();

  if (isTimer) clearTimeout(isTimer);
  isReady = true;

  let arrFromStr = searchField.value.split(" ");
  let cleanArr = [];
  let cleanStr = "";
  
  for (let item of arrFromStr) {
    if (item.length > 0) cleanArr.push(item.toLowerCase());
  }

  for (let item of cleanArr) {
    if (cleanArr.indexOf(item) > 0) cleanStr += " ";
    cleanStr += item.replace(item[0], item[0].toUpperCase());
  }

  searchField.dataset.prevValue = cleanStr;
  searchField.setAttribute("placeholder", cleanStr);
  searchField.value = "";

  tabsNavigation(undefined, document.querySelector(`[data-nav-item="hourly"]`));

  if (useID) {
    getData(useID);
  } else {
    getData(cleanStr);
  }
}

function getCitiesSuggestions(e) {
  isTyping = true;

  searchSuggestions.classList.remove("cities-array--rolled");

  return setTimeout(async () => {
    if (searchField.value.length === 0 || searchField.value === prevString) {
      if (searchField.value.length === 0) removeCitiesSuggestions(e, true);

      if (searchField.value === prevString && searchField.value.length > 0) searchSuggestions.classList.add("cities-array--rolled");

      isTyping = false;
      isTimer = false;
      return;
    }

    prevString = searchField.value;
    
    if (isFake) {
      search = searchFake;
    } else {
      search = await serverRequest("/search", searchField.value);
    }
    
    searchSuggestions.innerHTML = ``;
    searchSuggestions.classList.add("cities-array--rolled");

    switch (true) {
      case search.length === 0:
        let html = `<p data-search-item data-location-id="unknown" class="cities-array__item">No results :(</p>`;
        searchSuggestions.insertAdjacentHTML("beforeend", html);
        break;

      case search.length > 0:
        for (let item of search) {
          let html = `<p data-search-item data-location-id=${item.id} class="cities-array__item">${item.name}, ${item.country.id}</p>`;
          searchSuggestions.insertAdjacentHTML("beforeend", html);
        }
        break;
    }

    isTyping = false;
    isTimer = false;
  }, 1500);
}

function removeCitiesSuggestions(evt = e, isHard = false) {
  searchSuggestions.classList.remove("cities-array--rolled");

  if (isTimer) clearTimeout(isTimer);
  isReady = true;

  if (isHard) {
    setTimeout(() => {
      searchSuggestions.innerHTML = "<div></div>";
    }, 400);
  }
}

function retryFetching(e) {

  if (e.target.closest(".loader").dataset.loaderStatus === "pending") return;

  switch (true) {
    case e.target.closest(".loader").dataset.loaderStatus === "error":
      loader.body.dataset.loaderStatus = "pending";
      getData();
      break;
    
    case e.target.closest(".loader").dataset.loaderStatus === "search-fail":
      loader.body.dataset.loaderStatus = "success";
      tabsNavigation(e, document.querySelector(`[data-nav-item="settings"]`));
      setTimeout(() => searchField.focus(), 1000);
      break;
    case e.target.closest(".loader").dataset.loaderStatus === "cache-warn":
      loader.body.dataset.loaderStatus = "success";
      break;
  }
}

console.log("Fake data: " + isFake);