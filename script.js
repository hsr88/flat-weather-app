const apiKey = "08420062c0807181ff8fb08245276187"; 
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&lang=pl";

// ============================================================
// ELEMENTY DOM (Pobieramy elementy z HTML)
// ============================================================
const searchBox = document.querySelector("#city-input");
const searchBtn = document.querySelector("#search-btn");
const refreshBtn = document.querySelector("#refresh-btn");
const weatherIcon = document.querySelector("#weather-icon");
const weatherContent = document.querySelector("#weather-content");
const errorMsg = document.querySelector("#error-msg");

// ============================================================
// 1. GŁÓWNA FUNKCJA POBIERAJĄCA DANE (FETCH)
// ============================================================
async function fetchWeather(url) {
    try {
        const response = await fetch(url);

        // Obsługa błędów HTTP
        if (response.status == 404) {
            showError("Nie znaleziono takiego miasta.");
            return;
        }
        if (response.status == 401) {
            showError("Błąd klucza API (sprawdź klucz lub poczekaj na aktywację).");
            return;
        }

        const data = await response.json();
        
        // Jeśli wszystko ok -> aktualizujemy ekran
        updateUI(data);

    } catch (error) {
        console.error("Błąd połączenia:", error);
        showError("Wystąpił błąd połączenia.");
    }
}

function checkWeatherByCity(city) {
    const url = `${apiUrl}&q=${city}&appid=${apiKey}`;
    fetchWeather(url);
}

// ============================================================
// 2. AKTUALIZACJA WYGLĄDU (UI)
// ============================================================
function updateUI(data) {
    // Wstawianie tekstów
    document.querySelector("#city").innerHTML = data.name;
    document.querySelector("#temp").innerHTML = Math.round(data.main.temp) + "°c";
    document.querySelector("#feels-like").innerHTML = Math.round(data.main.feels_like);
    document.querySelector("#humidity").innerHTML = data.main.humidity + "%";
    document.querySelector("#wind").innerHTML = Math.round(data.wind.speed) + " km/h";

    // --- LOGIKA IKON I ANIMACJI ---
    const weatherCondition = data.weather[0].main;
    
    // Resetujemy klasę ikony (usuwamy stare animacje)
    weatherIcon.className = "weather-icon"; 

    // Dobieramy ikonę i animację
    if(weatherCondition == "Clouds"){
        weatherIcon.src = "https://cdn-icons-png.flaticon.com/512/1163/1163624.png";
        weatherIcon.classList.add("anim-float");
    }
    else if(weatherCondition == "Clear"){
        weatherIcon.src = "https://cdn-icons-png.flaticon.com/512/869/869869.png";
        weatherIcon.classList.add("anim-spin");
    }
    else if(weatherCondition == "Rain" || weatherCondition == "Thunderstorm"){
        weatherIcon.src = "https://cdn-icons-png.flaticon.com/512/1163/1163657.png";
        weatherIcon.classList.add("anim-rain");
    }
    else if(weatherCondition == "Drizzle"){
        weatherIcon.src = "https://cdn-icons-png.flaticon.com/512/3076/3076129.png";
        weatherIcon.classList.add("anim-rain");
    }
    else if(weatherCondition == "Mist" || weatherCondition == "Fog"){
        weatherIcon.src = "https://cdn-icons-png.flaticon.com/512/4005/4005901.png";
        weatherIcon.classList.add("anim-float");
    }
    else if(weatherCondition == "Snow"){
        weatherIcon.src = "https://cdn-icons-png.flaticon.com/512/2315/2315309.png";
        weatherIcon.classList.add("anim-float");
    }
    else {
        weatherIcon.src = "https://cdn-icons-png.flaticon.com/512/1163/1163624.png";
        weatherIcon.classList.add("anim-float");
    }

    // --- LOGIKA TŁA (DYNAMIC BACKGROUND) ---
    const isNight = data.weather[0].icon.includes("n");
    document.body.className = ""; // Czyścimy stare tło

    if (isNight) {
        document.body.classList.add("night");
    } else {
        // Dzień - sprawdzamy warunki
        if (weatherCondition === "Clear") {
            document.body.classList.add("sunny");
        } 
        else if (["Rain", "Thunderstorm", "Drizzle"].includes(weatherCondition)) {
            document.body.classList.add("rainy");
        }
        else if (weatherCondition === "Snow") {
            document.body.classList.add("snowy");
        }
        // Jeśli Clouds -> zostaje domyślne body
    }

    // Pokaż treść, ukryj błąd
    weatherContent.style.display = "block";
    errorMsg.style.display = "none";
}

function showError(message) {
    errorMsg.style.display = "block";
    errorMsg.innerText = message;
    weatherContent.style.display = "none";
}

// ============================================================
// 3. DATA I CZAS (PO POLSKU)
// ============================================================
function updateDate() {
    const now = new Date();
    const optionsDay = { weekday: 'long' };
    const optionsFull = { day: 'numeric', month: 'long', year: 'numeric' };

    const dayName = now.toLocaleDateString('pl-PL', optionsDay);
    const fullDate = now.toLocaleDateString('pl-PL', optionsFull);

    // Pierwsza litera dnia duża
    document.querySelector("#date-day").innerText = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    document.querySelector("#date-full").innerText = fullDate;
}

// Wywołaj od razu
updateDate();

// ============================================================
// 4. OBSŁUGA ZDARZEŃ (KLIKNIĘCIA)
// ============================================================

// Szukanie przyciskiem lupy
searchBtn.addEventListener("click", () => {
    checkWeatherByCity(searchBox.value);
});

// Szukanie Enterem
searchBox.addEventListener("keypress", (e) => {
    if (e.key === 'Enter') {
        checkWeatherByCity(searchBox.value);
    }
});

// Przycisk Odświeżania
refreshBtn.addEventListener("click", () => {
    // Animacja ikony
    refreshBtn.classList.add("spin-animation");
    setTimeout(() => refreshBtn.classList.remove("spin-animation"), 1000);

    const currentCity = searchBox.value;

    if (currentCity) {
        checkWeatherByCity(currentCity);
    } else {
        // Jeśli pole puste, spróbuj odświeżyć GPS lub Warszawę
        loadDefaultOrGPS();
    }
});

// ============================================================
// 5. START APLIKACJI (GPS + FALLBACK DO WARSZAWY)
// ============================================================

function loadDefaultOrGPS() {
    const defaultCity = "Warszawa";

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            // SUKCES: Mamy GPS
            console.log("Pobrano lokalizację GPS.");
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const url = `${apiUrl}&lat=${lat}&lon=${lon}&appid=${apiKey}`;
            fetchWeather(url);

        }, (error) => {
            // BŁĄD/ODMOWA: Ładujemy Warszawę
            console.log("Brak zgody na GPS. Ładuję domyślne miasto.");
            checkWeatherByCity(defaultCity);
        });
    } else {
        // BRAK WSPARCIA W PRZEGLĄDARCE: Ładujemy Warszawę
        checkWeatherByCity(defaultCity);
    }
}

// Uruchom przy starcie strony
window.addEventListener("load", loadDefaultOrGPS);