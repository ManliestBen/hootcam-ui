# Hootcam UI

A React frontend for **Hootcam Server**: dual-camera motion detection, live streams, events, and configuration for owl box / wildlife camera setups (e.g. Raspberry Pi 5 with dual CSI cameras).

## Project overview

Hootcam UI talks to the [Hootcam Server](https://github.com/your-org/hootcam-server) API. It provides:

- **Public live view** – Anyone can open the app and see camera streams (when the server URL is configured). No sign-in required for viewing.
- **Signed-in experience** – After signing in with the server’s HTTP Basic Auth credentials, you get the full dashboard: detection controls, events, recorded files, and configuration.

The app uses `VITE_HOOTCAM_SERVER_URL` (from `.env`) as the API base URL for all requests. If you’re not logged in, that same URL is used to load the public camera streams; if the server requires auth for streams, the UI shows “Sign in to view” and a link to the login page.

## Features

- **Live view (public)** – Camera 0 and Camera 1 streams on the home page; no login required. Theme toggle and “Sign in” in the header.
- **Dashboard** – After sign-in: live previews and detection status per camera, with links to controls and config.
- **Cameras** – Per-camera live view, connection status, start/pause detection, snapshot, and link to camera config.
- **Events** – List motion events with filters; event detail with file thumbnails.
- **Files** – Browse pictures and movies with filters; view images and videos.
- **Config** – Global server config (log level, stream quality, etc.).
- **Storage** – View and set recording path (including auto-detected SSD).
- **Camera config** – Per-camera settings (resolution, motion threshold, event gap, etc.).
- **Account** – Change password (HTTP Basic Auth).
- **Light / dark mode** – Theme toggle with persistence.

## Installation

### Prerequisites

- Node.js 20+ (or 22+ for latest Vite)
- [Hootcam Server](https://github.com/ManliestBen/hootcam-server) running (e.g. `uvicorn hootcam_server.main:app --host 0.0.0.0 --port 8080`)

### Steps

1. **Clone and install dependencies**

   ```bash
   cd hootcam-ui
   npm install
   ```

2. **Configure the server URL (recommended)**

   Copy the example env file and set your server URL:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:

   ```env
   VITE_HOOTCAM_SERVER_URL=http://localhost:8080
   ```

   Use your actual server host/port if different (e.g. `http://192.168.1.10:8080`). If you omit this, the app defaults to `http://localhost:8080`.

3. **Run the development server**

   ```bash
   npm run dev
   ```

   Open http://localhost:5173 in a browser. If you use WSL, the dev server listens on all interfaces so you can open that URL from a Windows browser.

4. **Sign in (for full access)**

   On the home page you’ll see the public live view and a “Sign in” button. Click it and enter the same HTTP Basic Auth username and password used by the server. The app uses the server URL from `VITE_HOOTCAM_SERVER_URL`. After a successful login you’ll be redirected to the dashboard with full access.

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_HOOTCAM_SERVER_URL` | API base URL for the Hootcam server (e.g. `http://localhost:8080`). Used for all API requests and for public camera streams. Defaults to `http://localhost:8080` if unset. |

## Build

To build for production:

```bash
npm run build
```

Output is in `dist/`. Serve it with any static file server. The app will call the server at the URL configured in `.env` at build time (`VITE_HOOTCAM_SERVER_URL`); ensure that URL is reachable from the browser and that the server allows your UI origin in CORS.

## .gitignore

The repo ignores:

- `node_modules`, `dist`, `dist-ssr`
- `.env`, `.env.local`, and `.env.*.local` (so local secrets and server URLs are not committed)
- Common editor/OS and log files

See `.gitignore` in the project root for the full list.
