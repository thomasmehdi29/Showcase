# Showcase Frontend Demo

Showcase is now a frontend-only product demo built with React + Vite + Tailwind + Leaflet.

## Demo Characteristics
- No backend required
- No `VITE_API_BASE_URL` or API environment variables
- Data layer is browser `localStorage`
- First load seeds realistic NYC vendors, events, and map locations
- All create/update flows persist locally and refresh UI immediately

## Local Development
```powershell
cd "c:\Users\thoma\Documents\OneDrive\Local App Code\frontend"
npm install
npm run dev
```

Open the URL printed by Vite in the terminal.

## Production Build
```powershell
cd "c:\Users\thoma\Documents\OneDrive\Local App Code\frontend"
npm run build
npm run preview
```

## Deploy To Vercel
Use these settings when importing the repo into Vercel:
- Framework Preset: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: none

`frontend/vercel.json` is included for SPA route rewrites so deep links like `/vendors/3` work in production.

## Reset Demo Data
If you want to reset seeded data in the browser:
- Open DevTools Console
- Run `localStorage.removeItem("showcase:demo-db:v1")`
- Refresh the page
