# Showcase

Showcase is a location-based community marketplace for discovering local vendors, artisans, farmers, markets, pop-ups, and events.

This first draft includes:
- A Node + Express + SQLite REST backend
- A React + Vite + Tailwind + Leaflet frontend
- Map-first discovery with color-coded vendor/event markers
- Vendor registration and showcase/event creation workflows

## Project Structure

```text
Local App Code/
  backend/
    package.json
    schema.sql
    showcase.db                 # created after first backend start
    scripts/
      init-db.js
    src/
      db.js
      initDb.js
      server.js
      routes/
        vendors.js
        events.js
        locations.js
  frontend/
    package.json
    index.html
    vite.config.js
    tailwind.config.js
    postcss.config.js
    src/
      main.jsx
      App.jsx
      index.css
      lib/
        api.js
        categories.js
      components/
        NavBar.jsx
        ShowcaseMap.jsx
        VendorCard.jsx
        EventCard.jsx
        MarketplacePlaceholder.jsx
      pages/
        HomePage.jsx
        VendorsPage.jsx
        VendorRegistrationPage.jsx
        VendorDetailPage.jsx
        EventsPage.jsx
        EventDetailPage.jsx
        CreateShowcasePage.jsx
```

## Backend Features

### REST API (CRUD)
- Vendors: `GET/POST/PUT/DELETE /api/vendors`, `GET /api/vendors/:id`
- Events: `GET/POST/PUT/DELETE /api/events`, `GET /api/events/:id`
- Locations: `GET/POST/PUT/DELETE /api/locations`, `GET /api/locations/:id`

### Database Schema
Tables are created in `backend/src/initDb.js`:
- `vendors`
- `events` (foreign key to `vendors`)
- `locations` (can belong to one vendor or one event)

### Seed Data
On backend start, seed data is inserted if the database is empty:
- 4 vendors
- 5 events
- vendor and event locations

## Frontend Features
- Interactive Leaflet map (OpenStreetMap tiles)
- Vendor and event markers on map
- Category-based marker coloring
- Clickable marker popups with vendor/event detail navigation
- Vendor browse page
- Event browse page
- Vendor registration form
- Vendor profile/detail page
- Event detail page
- Showcase (event) creation form
- Placeholder marketplace cards for community browsing

## Setup

### 1) Install dependencies

```powershell
cd "c:\Users\thoma\Documents\OneDrive\Local App Code\backend"
npm install

cd "c:\Users\thoma\Documents\OneDrive\Local App Code\frontend"
npm install
```

Or from the project root, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-local.ps1
```

`run-local.ps1` will:
- Use system Node.js if it exists on `PATH`
- Otherwise download and use a portable Node runtime in `.tools\`
- Install backend and frontend dependencies
- Start backend and frontend servers
- Write process IDs to `.showcase-pids.json`
- Print the exact URLs to open

### 2) Run backend server

```powershell
cd "c:\Users\thoma\Documents\OneDrive\Local App Code\backend"
npm run dev
```

Backend base URL:
- `http://localhost:4000`

### 3) Run frontend dev server

```powershell
cd "c:\Users\thoma\Documents\OneDrive\Local App Code\frontend"
npm run dev
```

Frontend URL:
- `http://localhost:5173`

## Exact URLs To Open
- App: `http://localhost:5173`
- API Health: `http://localhost:4000/api/health`
- Vendors API: `http://localhost:4000/api/vendors`
- Events API: `http://localhost:4000/api/events`
- Locations API: `http://localhost:4000/api/locations`

## Notes
- CORS allows `http://localhost:5173` and `http://127.0.0.1:5173`.
- If you want a different backend URL, set `VITE_API_BASE_URL` in the frontend environment.
