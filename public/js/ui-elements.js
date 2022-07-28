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
  },
  "texts": {
    "pending": document.querySelector(`[data-loader-text="pending"]`),
    "error": document.querySelector(`[data-loader-text="error"]`),
    "searchFail": document.querySelector(`[data-loader-text="search-fail"]`),
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