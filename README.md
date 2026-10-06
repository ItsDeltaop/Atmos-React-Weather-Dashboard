# Atmos — React Weather Dashboard

A polished weather forecast dashboard rebuilt from the original vanilla HTML/CSS/JavaScript project using **React + Vite**.

## Features

- Current weather by city
- 5-day forecast
- Current-location weather using browser geolocation
- Celsius/Fahrenheit toggle for current conditions
- Recent city searches saved in `localStorage`
- Rainy-weather visual effect
- Extreme heat warning
- Responsive, resume-ready UI
- Component-based React architecture

## Tech stack

- React
- Vite
- Lucide React
- OpenWeatherMap API
- CSS

## Run locally

1. Install Node.js (18+ recommended).
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root based on `.env.example`:

```env
VITE_OPENWEATHER_API_KEY=your_openweathermap_api_key_here
```

4. Start the development server:

```bash
npm run dev
```

5. Create a production build:

```bash
npm run build
```

## GitHub

Do **not** commit `.env`. The API key is intentionally read from `VITE_OPENWEATHER_API_KEY` and `.env` is ignored by Git.

> Note: because this is a client-side weather app, the OpenWeatherMap key is ultimately exposed to the browser. For a production deployment, restrict the API key by allowed domains/API access or place API requests behind a server/serverless function.
