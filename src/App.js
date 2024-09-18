import { useEffect, useState } from "react";
import "./App.css";

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

// function getFlagEmoji(countryCode) {
//   return [...countryCode.toUpperCase()]
//     .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
//     .reduce((a, b) => `${a}${b}`);
// }

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function App() {
  const [location, setLocation] = useState(
    localStorage.getItem("location") || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState([]);
  const [weather, setWeather] = useState("");

  const fetchWeather = async (location) => {
    if (location.length < 2) return;
    try {
      // 1) Getting location (geocoding)
      setIsLoading(true);
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
      );
      const geoData = await geoRes.json();
      // console.log(geoData);

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);

      // setDisplayLocation([name, getFlagEmoji(country_code)]);
      setDisplayLocation([name, country_code]);

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();
      setWeather(weatherData.daily);

      // console.log(weatherData.daily);
    } catch (err) {
      // console.log(err);
    } finally {
      setIsLoading(false);
    }

    return { isLoading, location };
  };

  useEffect(() => {
    fetchWeather(location);
    localStorage.setItem("location", location);
  }, [location]);

  const handleClick = () => {
    fetchWeather(location);
    localStorage.setItem("location", location);
  };
  return (
    <div className="app">
      <h1>Get your weather</h1>
      <input
        type="text"
        placeholder="Get weather for city"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />

      {/* <button onClick={handleClick}>Get location</button> */}
      {isLoading && <p className="loader">Loading...</p>}
      {weather.weathercode && (
        <Weather weather={weather} location={displayLocation} />
      )}
    </div>
  );
}

const Weather = ({ weather, location }) => {
  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: codes,
  } = weather;
  return (
    <div>
      <p style={{ textAlign: "center" }}>
        Weather in {location[0]} - {location[1]}
      </p>
      <ul className="weather">
        {dates.map((date, i) => (
          <Day
            date={date}
            max={max.at(i)}
            min={min.at(i)}
            code={codes.at(i)}
            key={date}
            isToday={i === 0}
          />
          // <li>{date}</li>
        ))}
      </ul>
    </div>
  );
};

const Day = ({ date, max, min, isToday, code }) => {
  return (
    <div className="day">
      <p>
        <span>{getWeatherIcon(code)}</span>
      </p>
      <p>{isToday ? "Today" : formatDay(date)}</p>
      <p>
        {Math.floor(min)}&deg; &mdash; <strong>{Math.ceil(max)}&deg;</strong>
      </p>
    </div>
  );
};

export default App;
