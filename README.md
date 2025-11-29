# ☁️ pogoda.city - Nowoczesna Aplikacja Pogodowa

![Status Projektu](https://img.shields.io/badge/Status-Completed-success)
![Tech Stack](https://img.shields.io/badge/Tech-HTML%20%7C%20CSS%20%7C%20JS-blue)

Nowoczesna, w pełni responsywna aplikacja pogodowa wykorzystująca **OpenWeatherMap API**. Projekt wyróżnia się stylem **Glassmorphism** (efekt mrożonego szkła) oraz dynamicznymi tłami, które zmieniają się w zależności od pory dnia i warunków atmosferycznych.

👉 **[ZOBACZ DEMO ONLINE (LIVE PREVIEW)](http://pogoda.city/)**

---

## 📸 Podgląd (Screenshots)

<img width="984" height="913" alt="Zrzut ekranu 2025-11-29 172759" src="https://github.com/user-attachments/assets/981829dc-cbe5-46e6-8068-06967ac6489b" />



---

## 🚀 Główne Funkcje

* **📍 Automatyczna Geolokalizacja:** Aplikacja wykrywa położenie użytkownika przy starcie i ładuje lokalną pogodę.
* **Fallback (Zabezpieczenie):** W przypadku braku zgody na lokalizację, domyślnie ładuje pogodę dla Warszawy.
* **🎨 Dynamiczne Tła:** Tło strony zmienia się automatycznie (Dzień/Noc, Deszcz, Śnieg, Słońce).
* **🧊 Glassmorphism UI:** Nowoczesny interfejs z efektem rozmycia tła (`backdrop-filter`).
* **✨ Mikro-interakcje:** Animowane ikony pogodowe (pływające chmury, obracające się słońce) stworzone w czystym CSS.
* **📅 Data i Czas:** Wyświetla aktualny dzień tygodnia i pełną datę w języku polskim.
* **🌡️ Szczegółowe Dane:** Temperatura rzeczywista, odczuwalna ("Feels like"), wilgotność oraz prędkość wiatru.

---

## 🛠️ Użyte Technologie

Projekt został zrealizowany w czystym kodzie (Vanilla JS), bez użycia zewnętrznych frameworków, aby pokazać solidne podstawy front-endowe.

* **HTML5** (Semantyczna struktura)
* **CSS3** (Flexbox, CSS Variables, Keyframes Animations, Media Queries, Glassmorphism effect)
* **JavaScript (ES6+)**
    * `Fetch API` & `Async/Await` (Asynchroniczne pobieranie danych)
    * `Geolocation API` (Obsługa GPS)
    * DOM Manipulation
* **API:** [OpenWeatherMap](https://openweathermap.org/) (Darmowy plan)
* **Ikony:** Phosphor Icons & Flaticon

---

## ⚙️ Jak uruchomić lokalnie?

Jeśli chcesz pobrać ten projekt na swój komputer:

1.  Sklonuj repozytorium:
    ```bash
    git clone [https://github.com/hsr88/flat-weather-app.git](https://github.com/hsr88/flat-weather-app.git)
    ```
2.  Otwórz folder w edytorze kodu (np. VS Code).
3.  **Ważne:** Aby działała geolokalizacja, użyj rozszerzenia **Live Server** (lub innego lokalnego serwera), ponieważ przeglądarki blokują GPS dla plików otwieranych bezpośrednio z dysku (`file://`).
4.  W pliku `script.js` podmień klucz API na własny (opcjonalnie, obecny jest wersją demonstracyjną).

---

## 🔮 Plany na rozwój (To-Do)

* [ ] Dodanie prognozy na kolejne 5 dni.
* [ ] Możliwość zmiany jednostek (Celsjusz / Fahrenheit).
* [ ] Tryb ciemny (Dark Mode) przełączany ręcznie.

---

## 📄 Licencja

Ten projekt jest dostępny na licencji MIT - możesz go swobodnie używać i modyfikować w celach edukacyjnych i komercyjnych.

---
Stworzone przez [hsr88]
