import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle, ArrowUpRight, CalendarDays, CloudSun, Droplets, MapPin,
  Navigation, Search, ShieldCheck, Sparkles, ThermometerSun, Wind, X, Zap
} from 'lucide-react';
import './index.css';

const API_BASE = 'https://api.openweathermap.org/data/2.5';
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const ICON_BASE = 'https://openweathermap.org/img/wn';

function getTemp(celsius, unit) {
  const value = unit === 'C' ? celsius : (celsius * 9) / 5 + 32;
  return `${Math.round(value)}°${unit}`;
}

function selectDailyForecast(list) {
  const daily = [];
  const seen = new Set();
  for (const item of list) {
    const date = item.dt_txt.split(' ')[0];
    const hour = Number(item.dt_txt.split(' ')[1]?.slice(0, 2));
    if (!seen.has(date) && daily.length < 5 && hour >= 11 && hour <= 14) {
      seen.add(date);
      daily.push(item);
    }
  }
  if (daily.length < 5) {
    for (const item of list) {
      const date = item.dt_txt.split(' ')[0];
      if (!seen.has(date) && daily.length < 5) {
        seen.add(date);
        daily.push(item);
      }
    }
  }
  return daily;
}

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [unit, setUnit] = useState('C');
  const [recentCities, setRecentCities] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recent_cities') || '[]'); } catch { return []; }
  });
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const rainy = useMemo(() => {
    const condition = weather?.weather?.[0]?.main?.toLowerCase() || '';
    return condition.includes('rain') || condition.includes('drizzle');
  }, [weather]);

  useEffect(() => {
    document.body.classList.toggle('weather-rainy', rainy);
    return () => document.body.classList.remove('weather-rainy');
  }, [rainy]);

  const saveRecentCity = (name) => {
    setRecentCities(prev => {
      const next = [name, ...prev.filter(c => c.toLowerCase() !== name.toLowerCase())].slice(0, 5);
      localStorage.setItem('recent_cities', JSON.stringify(next));
      return next;
    });
  };

  const loadWeather = async (params, locationError = 'Unable to fetch weather data.') => {
    if (!API_KEY) {
      setAlert({ type: 'error', message: 'Missing API key. Copy .env.example to .env and add your OpenWeatherMap API key.' });
      return;
    }
    setLoading(true);
    setAlert(null);
    try {
      const query = new URLSearchParams({ ...params, units: 'metric', appid: API_KEY });
      const currentRes = await fetch(`${API_BASE}/weather?${query}`);
      if (!currentRes.ok) {
        if (currentRes.status === 404) throw new Error('City not found. Please check the spelling.');
        throw new Error(locationError);
      }
      const current = await currentRes.json();
      const forecastRes = await fetch(`${API_BASE}/forecast?${query}`);
      if (!forecastRes.ok) throw new Error('Unable to fetch forecast data.');
      const forecastData = await forecastRes.json();
      setWeather(current);
      setForecast(selectDailyForecast(forecastData.list));
      saveRecentCity(current.name);
      if (current.main.temp > 40) {
        setAlert({ type: 'warning', message: `Extreme heat warning in ${current.name}: ${Math.round(current.main.temp)}°C. Stay hydrated.` });
      }
    } catch (error) {
      setAlert({ type: 'error', message: error.message || locationError });
    } finally {
      setLoading(false);
    }
  };

  const searchCity = (event) => {
    event.preventDefault();
    const value = city.trim();
    if (!value) {
      setAlert({ type: 'error', message: 'Please enter a valid city name.' });
      return;
    }
    loadWeather({ q: value });
  };

  const useLocation = () => {
    if (!navigator.geolocation) {
      setAlert({ type: 'error', message: 'Geolocation is not supported by your browser.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => loadWeather({ lat: coords.latitude, lon: coords.longitude }, 'Failed to fetch current location weather.'),
      () => setAlert({ type: 'error', message: 'Unable to retrieve your location. Check browser permissions.' })
    );
  };

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="noise" />
      <header className="topbar"><div className="topbar-inner">
        <a className="brand" href="#"><span className="brand-mark"><CloudSun /></span><span><strong>Atmos</strong><small>Weather intelligence</small></span></a>
        <div className="status-pill"><span /> Live weather data</div>
      </div></header>

      {alert && <div className="alert-wrap"><div className="alert-box" data-type={alert.type}>
        <div className="alert-content"><AlertTriangle /><span>{alert.message}</span></div>
        <button onClick={() => setAlert(null)} className="alert-close" aria-label="Close alert"><X /></button>
      </div></div>}

      <main className="dashboard">
        <section className="hero-copy"><p className="eyebrow">WEATHER AT A GLANCE</p><h1>Know the sky.<br /><span>Plan your day.</span></h1><p className="hero-subtitle">Search any city and get current conditions, useful metrics, and a 5-day outlook in seconds.</p></section>
        <section className="control-grid">
          <aside className="search-panel glass-card">
            <div className="panel-heading"><div className="icon-bubble"><Search /></div><div><p className="eyebrow">LOCATION</p><h2>Where are you going?</h2></div></div>
            <form onSubmit={searchCity} className="search-form"><label htmlFor="city-input">City name</label><div className="input-wrap"><MapPin /><input id="city-input" value={city} onChange={e => setCity(e.target.value)} autoComplete="off" placeholder="e.g. New Delhi, London, Tokyo" /></div><button type="submit" className="primary-btn" disabled={loading}><span>{loading ? 'Loading weather…' : 'Explore weather'}</span><ArrowUpRight /></button></form>
            <div className="or-divider"><span>or</span></div>
            <button type="button" onClick={useLocation} className="location-btn" disabled={loading}><Navigation /><span>Use my current location</span></button>
            {recentCities.length > 0 && <div className="recent-wrap"><label htmlFor="recent-cities">Recent searches</label><select id="recent-cities" defaultValue="" onChange={e => { if (e.target.value) { setCity(e.target.value); loadWeather({ q: e.target.value }); } }}><option value="" disabled>Choose a recent city</option>{recentCities.map(c => <option key={c} value={c}>{c}</option>)}</select></div>}
            <div className="feature-row"><span><Zap /> Fast lookup</span><span><ShieldCheck /> Live API</span></div>
          </aside>

          <section className="weather-area">
            {!weather ? <div className="empty-state glass-card"><div className="empty-icon"><CloudSun /></div><p className="eyebrow">READY WHEN YOU ARE</p><h2>Search for a city</h2><p>Enter a location to turn this space into your personalized weather dashboard.</p><div className="empty-hint"><Sparkles /> Tip: try “Bhubaneswar”</div></div> : <>
              <CurrentWeather weather={weather} unit={unit} setUnit={setUnit} />
              <section className="forecast-section"><div className="section-heading"><div><p className="eyebrow">LOOKING AHEAD</p><h2>5-Day Forecast</h2></div><div className="forecast-badge"><CalendarDays /> Daily outlook</div></div><div className="forecast-grid">{forecast.map((item, i) => <ForecastCard key={item.dt} item={item} index={i} />)}</div></section>
            </>}
          </section>
        </section>
      </main>
      <footer className="footer"><span>Atmos Weather Dashboard</span><span>Powered by OpenWeatherMap</span></footer>
    </div>
  );
}

function CurrentWeather({ weather, unit, setUnit }) {
  const icon = weather.weather[0].icon;
  const description = weather.weather[0].description;
  const date = new Date(weather.dt * 1000).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  return <div className="current-weather-card">
    <div className="current-top"><div><p className="eyebrow">CURRENT CONDITIONS</p><h2 className="location-name">{weather.name}, {weather.sys.country}</h2><p className="location-meta">{date}</p><div className="temp-block"><span className="big-temp">{getTemp(weather.main.temp, unit)}</span><button className="unit-btn" onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}>Switch to °{unit === 'C' ? 'F' : 'C'}</button></div></div><div className="weather-icon-block"><img src={`${ICON_BASE}/${icon}@4x.png`} alt={description} /><p>{description}</p></div></div>
    <div className="metrics"><Metric icon={<ThermometerSun />} label="Feels like" value={getTemp(weather.main.feels_like, unit)} /><Metric icon={<Droplets />} label="Humidity" value={`${weather.main.humidity}%`} /><Metric icon={<Wind />} label="Wind speed" value={`${weather.wind.speed} m/s`} /></div>
  </div>;
}
function Metric({ icon, label, value }) { return <div className="metric">{React.cloneElement(icon, { className: 'metric-icon' })}<div className="metric-label">{label}</div><div className="metric-value">{value}</div></div>; }
function ForecastCard({ item, index }) {
  const date = new Date(item.dt * 1000); const day = index === 0 ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' }); const formatted = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); const desc = item.weather[0].description;
  return <article className="forecast-card"><div className="forecast-day">{day}</div><div className="forecast-date">{formatted}</div><img src={`${ICON_BASE}/${item.weather[0].icon}@2x.png`} alt={desc} /><div className="forecast-desc">{desc}</div><div className="forecast-temp">{Math.round(item.main.temp)}°C</div><div className="forecast-stats"><div className="forecast-stat"><span><Droplets /> Humidity</span><strong>{item.main.humidity}%</strong></div><div className="forecast-stat"><span><Wind /> Wind</span><strong>{item.wind.speed} m/s</strong></div></div></article>;
}

createRoot(document.getElementById('root')).render(<App />);
