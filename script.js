// ============================================================
//  KONFIGURACJA
// ============================================================
const apiKey = "XXXXXXXXXXX"; 
const apiUrlBase = "https://api.openweathermap.org/data/2.5/weather?lang=pl";
const apiPollutionBase = "https://api.openweathermap.org/data/2.5/air_pollution";
const apiForecastBase = "https://api.openweathermap.org/data/2.5/forecast?lang=pl";

// ============================================================
// STAN APLIKACJI
// ============================================================
let currentUnit = localStorage.getItem("units") || "metric";
let isDarkModeForced = localStorage.getItem("darkMode") === "true";
let isAQIEnabled = localStorage.getItem("aqiEnabled") === "true";
let isForecastEnabled = localStorage.getItem("forecastEnabled") === "true"; // 5 dni
let isHourlyEnabled = localStorage.getItem("hourlyEnabled") === "true";     // 24h (NOWOŚĆ)
let isAstroEnabled = localStorage.getItem("astroEnabled") === "true";
let lastCity = localStorage.getItem("lastCity") || "Warszawa";
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

let currentLat = null;
let currentLon = null;

// ============================================================
// ELEMENTY DOM
// ============================================================
const searchBox = document.querySelector("#city-input");
const searchBtn = document.querySelector("#search-btn");
const locationBtn = document.querySelector("#location-btn");
const refreshBtn = document.querySelector("#refresh-btn");
const starBtn = document.querySelector("#star-btn");
const weatherIcon = document.querySelector("#weather-icon");
const weatherContent = document.querySelector("#weather-content");
const errorMsg = document.querySelector("#error-msg");

// Sekcje dodatkowe
const astroBox = document.querySelector("#astro-box");
const aqiBox = document.querySelector("#aqi-box");
const aqiValueEl = document.querySelector("#aqi-value");
const aqiIcon = document.querySelector("#aqi-icon");

// Prognozy
const forecastContainer = document.querySelector("#forecast-container"); // 5 dni
const forecastSection = document.querySelector("#forecast-section");
const hourlyContainer = document.querySelector("#hourly-container"); // 24h (NOWOŚĆ)
const hourlySection = document.querySelector("#hourly-section");

// Menu
const hamburgerBtn = document.querySelector("#hamburger-btn");
const closeBtn = document.querySelector("#close-btn");
const sidebar = document.querySelector("#sidebar");
const overlay = document.querySelector("#overlay");
const favoritesList = document.querySelector("#favorites-list");
const btnC = document.querySelector("#btn-c");
const btnF = document.querySelector("#btn-f");
const shareBtnMenu = document.querySelector("#share-btn-menu");

// Przełączniki
const darkModeToggle = document.querySelector("#dark-mode-toggle");
const aqiToggle = document.querySelector("#aqi-toggle");
const forecastToggle = document.querySelector("#forecast-toggle");
const hourlyToggle = document.querySelector("#hourly-toggle"); // NOWOŚĆ
const astroToggle = document.querySelector("#astro-toggle");

// ============================================================
// 1. INICJALIZACJA
// ============================================================
function initApp() {
    updateDate();
    applySettingsUI();
    renderFavoritesList();

    if (navigator.geolocation && !localStorage.getItem("lastCity")) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            fetchWeather(`${apiUrlBase}&lat=${latitude}&lon=${longitude}&units=${currentUnit}&appid=${apiKey}`);
        }, () => {
            checkWeatherByCity(lastCity);
        });
    } else {
        checkWeatherByCity(lastCity);
    }
}

// ============================================================
// 2. LOGIKA POGODY
// ============================================================
async function fetchWeather(url) {
    try {
        const response = await fetch(url);
        if (response.status === 404) return showError("Nie znaleziono miasta.");
        if (response.status === 401) return showError("Błąd autoryzacji API.");

        const data = await response.json();
        lastCity = data.name;
        localStorage.setItem("lastCity", lastCity);
        
        currentLat = data.coord.lat;
        currentLon = data.coord.lon;

        updateUI(data);

        // AQI
        if (isAQIEnabled) fetchPollution(currentLat, currentLon);
        else aqiBox.style.display = "none";

        // PROGNOZY (Jedna funkcja obsługuje obie sekcje, bo to ten sam endpoint)
        handleForecasts(currentLat, currentLon);

    } catch (error) {
        showError("Błąd połączenia.");
        console.error(error);
    }
}

// Funkcja zarządzająca pobieraniem prognoz
function handleForecasts(lat, lon) {
    // Ukryj/Pokaż kontenery
    hourlySection.style.display = isHourlyEnabled ? "block" : "none";
    forecastSection.style.display = isForecastEnabled ? "block" : "none";

    // Jeśli którakolwiek prognoza jest włączona, pobierz dane
    if (isHourlyEnabled || isForecastEnabled) {
        fetchForecastData(lat, lon);
    }
}

async function fetchForecastData(lat, lon) {
    try {
        const url = `${apiForecastBase}&lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        
        // Renderuj to, co jest włączone
        if (isHourlyEnabled) renderHourly(data.list);
        if (isForecastEnabled) renderDaily(data.list);

    } catch (e) {
        console.log("Błąd prognozy", e);
    }
}

// --- RENDEROWANIE PROGNOZY GODZINOWEJ (24H) ---
function renderHourly(list) {
    hourlyContainer.innerHTML = "";
    // Bierzemy pierwsze 8 elementów (8 * 3h = 24h)
    const next24h = list.slice(0, 8);

    next24h.forEach(item => {
        const date = new Date(item.dt * 1000);
        // Formatowanie godziny (np. 15:00)
        const timeStr = date.getHours().toString().padStart(2, '0') + ":00";
        const temp = Math.round(item.main.temp);
        const iconCode = item.weather[0].icon;
        
        const el = document.createElement("div");
        el.className = "forecast-item";
        el.innerHTML = `
            <span class="forecast-day">${timeStr}</span>
            <img src="${getIconUrl(iconCode)}" class="forecast-icon">
            <span class="forecast-temp">${temp}°</span>
        `;
        hourlyContainer.appendChild(el);
    });
}

// --- RENDEROWANIE PROGNOZY 5-DNIOWEJ ---
function renderDaily(list) {
    forecastContainer.innerHTML = "";
    const dailyData = [];
    const usedDates = new Set();
    const todayStr = new Date().toLocaleDateString();

    list.forEach(item => {
        const dateObj = new Date(item.dt * 1000);
        const dateStr = dateObj.toLocaleDateString();
        
        if (dateStr !== todayStr && !usedDates.has(dateStr)) {
            if (item.dt_txt.includes("12:00:00")) {
                dailyData.push(item);
                usedDates.add(dateStr);
            }
        }
    });

    // Fallback
    if (dailyData.length < 4) {
        for (let i = 7; i < list.length; i += 8) {
             const item = list[i];
             if(item) {
                const dStr = new Date(item.dt*1000).toLocaleDateString();
                if(!usedDates.has(dStr)){
                    dailyData.push(item);
                    usedDates.add(dStr);
                }
             }
             if(dailyData.length === 5) break;
        }
    }

    dailyData.slice(0, 5).forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('pl-PL', { weekday: 'short' });
        const temp = Math.round(day.main.temp);
        const iconCode = day.weather[0].icon;

        const el = document.createElement("div");
        el.className = "forecast-item";
        el.innerHTML = `
            <span class="forecast-day">${dayName}</span>
            <img src="${getIconUrl(iconCode)}" class="forecast-icon">
            <span class="forecast-temp">${temp}°</span>
        `;
        forecastContainer.appendChild(el);
    });
}

// Pomocnicza funkcja do ikon (żeby nie powtarzać kodu)
function getIconUrl(code) {
    if(code.includes("01")) return "https://cdn-icons-png.flaticon.com/512/869/869869.png";
    if(code.includes("02")) return "https://cdn-icons-png.flaticon.com/512/1163/1163624.png";
    if(code.includes("03") || code.includes("04")) return "https://cdn-icons-png.flaticon.com/512/1163/1163624.png";
    if(code.includes("09") || code.includes("10")) return "https://cdn-icons-png.flaticon.com/512/1163/1163657.png";
    if(code.includes("13")) return "https://cdn-icons-png.flaticon.com/512/2315/2315309.png";
    if(code.includes("11")) return "https://cdn-icons-png.flaticon.com/512/1163/1163657.png";
    return "https://cdn-icons-png.flaticon.com/512/1163/1163624.png";
}

async function fetchPollution(lat, lon) {
    try {
        const url = `${apiPollutionBase}?lat=${lat}&lon=${lon}&appid=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        if(data.list && data.list.length > 0) {
            updateAQIUI(data.list[0].main.aqi);
        }
    } catch (e) { console.log("Błąd AQI", e); }
}

function updateAQIUI(aqi) {
    aqiBox.style.display = "flex";
    const descriptions = { 1: "Dobra", 2: "Średnia", 3: "Umiark.", 4: "Zła", 5: "V. Zła" };
    const cssClass = `aqi-${aqi}`;
    aqiValueEl.innerText = descriptions[aqi] || "--";
    aqiIcon.className = "ph ph-leaf"; aqiValueEl.className = "aqi-value";
    aqiIcon.classList.add(cssClass); aqiValueEl.classList.add(cssClass);
}

function checkWeatherByCity(city) {
    fetchWeather(`${apiUrlBase}&q=${city}&units=${currentUnit}&appid=${apiKey}`);
}

function updateUI(data) {
    const tempUnit = currentUnit === "metric" ? "°C" : "°F";
    const speedUnit = currentUnit === "metric" ? " km/h" : " mph";

    document.querySelector("#city").innerText = data.name;
    document.querySelector("#temp").innerText = Math.round(data.main.temp) + tempUnit;
    document.querySelector("#feels-like").innerText = Math.round(data.main.feels_like) + tempUnit;
    document.querySelector("#humidity").innerText = data.main.humidity + "%";
    document.querySelector("#wind").innerText = Math.round(data.wind.speed) + speedUnit;

    const weatherCondition = data.weather[0].main;
    weatherIcon.className = "weather-icon"; 
    
    // Używamy nowej funkcji pomocniczej, ale musimy dodać animacje
    // Tutaj zostawiam starą logikę z animacjami, bo getIconUrl zwraca tylko URL
    const icons = {
        "Clouds": ["https://cdn-icons-png.flaticon.com/512/1163/1163624.png", "anim-float"],
        "Clear": ["https://cdn-icons-png.flaticon.com/512/869/869869.png", "anim-spin"],
        "Rain": ["https://cdn-icons-png.flaticon.com/512/1163/1163657.png", "anim-rain"],
        "Thunderstorm": ["https://cdn-icons-png.flaticon.com/512/1163/1163657.png", "anim-rain"],
        "Drizzle": ["https://cdn-icons-png.flaticon.com/512/3076/3076129.png", "anim-rain"],
        "Snow": ["https://cdn-icons-png.flaticon.com/512/2315/2315309.png", "anim-float"],
        "Mist": ["https://cdn-icons-png.flaticon.com/512/4005/4005901.png", "anim-float"],
        "Fog": ["https://cdn-icons-png.flaticon.com/512/4005/4005901.png", "anim-float"]
    };
    const [src, anim] = icons[weatherCondition] || icons["Clouds"];
    weatherIcon.src = src;
    weatherIcon.classList.add(anim);

    applyBackground(data.weather[0].icon.includes("n"), weatherCondition);
    updateStarUI(data.name);

    // Astro Time
    document.querySelector("#sunrise").innerText = formatTime(data.sys.sunrise);
    document.querySelector("#sunset").innerText = formatTime(data.sys.sunset);
    // Pokaż/Ukryj Astro w zależności od ustawień
    astroBox.style.display = isAstroEnabled ? "flex" : "none";

    weatherContent.style.display = "block";
    errorMsg.style.display = "none";
}

function applyBackground(isNight, condition) {
    if (isDarkModeForced) return;
    document.body.className = "";
    if (isNight) document.body.classList.add("night");
    else {
        if (condition === "Clear") document.body.classList.add("sunny");
        else if (["Rain", "Drizzle", "Thunderstorm"].includes(condition)) document.body.classList.add("rainy");
        else if (condition === "Snow") document.body.classList.add("snowy");
    }
}

function showError(msg) {
    errorMsg.innerText = msg;
    errorMsg.style.display = "block";
    weatherContent.style.display = "none";
}

function formatTime(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// ============================================================
// 3. OBSŁUGA PRZYCISKÓW
// ============================================================

if(locationBtn) {
    locationBtn.onclick = () => {
        locationBtn.classList.add("spin-animation");
        setTimeout(() => locationBtn.classList.remove("spin-animation"), 1000);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                fetchWeather(`${apiUrlBase}&lat=${latitude}&lon=${longitude}&units=${currentUnit}&appid=${apiKey}`);
            }, (error) => {
                let msg = "Błąd lokalizacji.";
                if (error.code === 1) msg = "Brak zgody na GPS.";
                showError(msg);
            });
        } else {
            showError("Brak wsparcia GPS.");
        }
    };
}

searchBtn.onclick = () => checkWeatherByCity(searchBox.value);
searchBox.onkeypress = (e) => { if (e.key === 'Enter') checkWeatherByCity(searchBox.value); };
refreshBtn.onclick = () => {
    refreshBtn.classList.add("spin-animation");
    setTimeout(() => refreshBtn.classList.remove("spin-animation"), 1000);
    checkWeatherByCity(lastCity);
};

// UDOSTĘPNIANIE
async function shareWeather() {
    const city = document.querySelector("#city").innerText;
    const temp = document.querySelector("#temp").innerText;
    const text = `W mieście ${city} jest teraz ${temp}. Sprawdź na Pogoda.city! 🌦️`;
    const url = "https://pogoda.city";
    if (navigator.share) { try { await navigator.share({ title: 'Pogoda.city', text: text, url: url }); } catch (err) {} }
    else { alert("Skopiowano do schowka: " + text); navigator.clipboard.writeText(text + " " + url); }
}
shareBtnMenu.onclick = shareWeather;

// ============================================================
// 4. MENU I USTAWIENIA
// ============================================================
function toggleSidebar() { sidebar.classList.toggle("active"); overlay.classList.toggle("active"); }
hamburgerBtn.onclick = toggleSidebar; closeBtn.onclick = toggleSidebar; overlay.onclick = toggleSidebar;

function setUnit(unit) {
    if (currentUnit === unit) return;
    currentUnit = unit; localStorage.setItem("units", unit);
    applySettingsUI(); checkWeatherByCity(lastCity);
}

function applySettingsUI() {
    if (currentUnit === "metric") { btnC.classList.add("active"); btnF.classList.remove("active"); }
    else { btnF.classList.add("active"); btnC.classList.remove("active"); }
    
    darkModeToggle.checked = isDarkModeForced;
    if (isDarkModeForced) document.body.classList.add("forced-dark-mode");
    else { document.body.classList.remove("forced-dark-mode"); if (lastCity) checkWeatherByCity(lastCity); }
    
    aqiToggle.checked = isAQIEnabled;
    if (isAQIEnabled) aqiBox.style.display = "flex"; else aqiBox.style.display = "none";

    astroToggle.checked = isAstroEnabled;
    astroBox.style.display = isAstroEnabled ? "flex" : "none";

    forecastToggle.checked = isForecastEnabled;
    hourlyToggle.checked = isHourlyEnabled;
    
    // Zarządzanie widocznością sekcji prognoz
    forecastSection.style.display = isForecastEnabled ? "block" : "none";
    hourlySection.style.display = isHourlyEnabled ? "block" : "none";

    // Jeśli któraś włączona, a brak danych, pobierz
    if ((isForecastEnabled || isHourlyEnabled) && currentLat && currentLon && forecastContainer.children.length === 0) {
        fetchForecastData(currentLat, currentLon);
    }
}

btnC.onclick = () => setUnit("metric"); btnF.onclick = () => setUnit("imperial");
darkModeToggle.onchange = (e) => { isDarkModeForced = e.target.checked; localStorage.setItem("darkMode", isDarkModeForced); applySettingsUI(); };
aqiToggle.onchange = (e) => { isAQIEnabled = e.target.checked; localStorage.setItem("aqiEnabled", isAQIEnabled); applySettingsUI(); if(isAQIEnabled) checkWeatherByCity(lastCity); };
astroToggle.onchange = (e) => { isAstroEnabled = e.target.checked; localStorage.setItem("astroEnabled", isAstroEnabled); applySettingsUI(); };

forecastToggle.onchange = (e) => { 
    isForecastEnabled = e.target.checked; 
    localStorage.setItem("forecastEnabled", isForecastEnabled); 
    applySettingsUI(); 
};

hourlyToggle.onchange = (e) => {
    isHourlyEnabled = e.target.checked;
    localStorage.setItem("hourlyEnabled", isHourlyEnabled);
    applySettingsUI();
};


// ============================================================
// 5. ULUBIONE
// ============================================================
function toggleFavorite() {
    const cityName = document.querySelector("#city").innerText;
    if (favorites.includes(cityName)) favorites = favorites.filter(c => c !== cityName);
    else favorites.push(cityName);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    updateStarUI(cityName); renderFavoritesList();
}
function updateStarUI(cityName) {
    if (favorites.includes(cityName)) { starBtn.classList.add("favorite-active"); starBtn.innerHTML = '<i class="ph-fill ph-star"></i>'; }
    else { starBtn.classList.remove("favorite-active"); starBtn.innerHTML = '<i class="ph ph-star"></i>'; }
}
function renderFavoritesList() {
    favoritesList.innerHTML = "";
    if (favorites.length === 0) { favoritesList.innerHTML = '<li class="empty-msg">Brak zapisanych miast</li>'; return; }
    favorites.forEach(city => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${city}</span> <i class="ph ph-trash remove-fav"></i>`;
        li.querySelector("span").onclick = () => { checkWeatherByCity(city); toggleSidebar(); };
        li.querySelector(".remove-fav").onclick = (e) => { e.stopPropagation(); removeFavorite(city); };
        favoritesList.appendChild(li);
    });
}
function removeFavorite(city) {
    favorites = favorites.filter(c => c !== city); localStorage.setItem("favorites", JSON.stringify(favorites));
    renderFavoritesList(); if (document.querySelector("#city").innerText === city) updateStarUI(city);
}
starBtn.onclick = toggleFavorite;

// ============================================================
// 6. OBSŁUGA BANERA COOKIES
// ============================================================
const cookieBanner = document.getElementById("cookie-banner");
const acceptCookiesBtn = document.getElementById("accept-cookies");

if (cookieBanner && !localStorage.getItem("cookiesAccepted")) {
    setTimeout(() => { cookieBanner.style.display = "flex"; }, 1000);
}
if(acceptCookiesBtn) {
    acceptCookiesBtn.addEventListener("click", () => {
        localStorage.setItem("cookiesAccepted", "true");
        cookieBanner.style.opacity = "0";
        setTimeout(() => { cookieBanner.style.display = "none"; }, 300);
    });
}

// Data
function updateDate() {
    const now = new Date();
    const d = now.toLocaleDateString('pl-PL', { weekday: 'long' });
    const f = now.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
    document.querySelector("#date-day").innerText = d.charAt(0).toUpperCase() + d.slice(1);
    document.querySelector("#date-full").innerText = f;
}

window.onload = initApp;
