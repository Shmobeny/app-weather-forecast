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

setUnits();
setHours();

let weatherObserver = new MutationObserver(rec => {
  setUnits();
  updateWeather(coords, forecast, "short");
});

weatherObserver.observe(appContainer, {
  attributes: true,
  attributeFilter: ["data-system-type"]
});

let loaderObserver = new MutationObserver(rec => {
  switch (true) {
    case (rec[0].target.dataset.loaderStatus === "success"):
      loader.body.classList.add("loader--hidden");
      break;
    
    case (rec[0].target.dataset.loaderStatus === "error"):
      loader.containers.icons.classList.add("loader__container-icons--error");

      loader.icons.pending.classList.add("loader__icon--hidden");
      loader.texts.pending.classList.add("loader__text--hidden");

      loader.icons.searchFail.classList.add("loader__icon--hidden");
      loader.texts.searchFail.classList.add("loader__text--hidden");

      loader.icons.error.classList.remove("loader__icon--hidden");
      loader.texts.error.classList.remove("loader__text--hidden");
      break;

    case (rec[0].target.dataset.loaderStatus === "search-fail"):
      loader.containers.icons.classList.add("loader__container-icons--search-fail");

      loader.icons.pending.classList.add("loader__icon--hidden");
      loader.texts.pending.classList.add("loader__text--hidden");

      loader.icons.error.classList.add("loader__icon--hidden");
      loader.texts.error.classList.add("loader__text--hidden");

      loader.icons.searchFail.classList.remove("loader__icon--hidden");
      loader.texts.searchFail.classList.remove("loader__text--hidden");
      break;
      
    case (rec[0].target.dataset.loaderStatus === "pending"):
      loader.body.classList.remove("loader--hidden");

      loader.containers.icons.classList.remove("loader__container-icons--error");
      loader.containers.icons.classList.remove("loader__container-icons--search-fail");

      loader.icons.pending.classList.remove("loader__icon--hidden");
      loader.texts.pending.classList.remove("loader__text--hidden");

      loader.icons.searchFail.classList.add("loader__icon--hidden");
      loader.texts.searchFail.classList.add("loader__text--hidden");

      loader.icons.error.classList.add("loader__icon--hidden");
      loader.texts.error.classList.add("loader__text--hidden");
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
      // search = await getSearchSuggestions(searchField.value);
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
  }
}

console.log("Fake data: " + isFake);