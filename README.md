# Hootcam UI

A React frontend for the **Hootcam** system: live camera streams, motion detection controls, events, and configuration for owl box / wildlife camera setups.

## Architecture (3-part setup)

Hootcam can run as three separate apps:

| App | Where it runs | Role |
|-----|----------------|------|
| **Hootcam UI** (this repo) | Any device with a browser | Web interface: live view, detection controls, events, files, config. |
| **Hootcam Motion** | NUC or PC | Consumes RTSP streams, runs motion detection and recording, serves the REST API and MJPEG streams. **This is the server the UI talks to.** |
| **Hootcam Streamer** | Raspberry Pi | Publishes two RTSP streams (cam0, cam1) from CSI cameras. No motion or recording. |

You point the UI at **Hootcam Motion** (the NUC). Motion pulls video from the Pi’s RTSP streams and does all processing. No direct connection from the UI to the Pi is required.

## Project overview

The UI talks to the **Hootcam Motion** API (or the legacy all-in-one Hootcam Server if you use that). It provides:

- **Public live view** – Anyone can open the app and see camera streams when the server URL is configured. No sign-in required for viewing.
- **Signed-in experience** – After signing in with the server’s HTTP Basic Auth credentials, you get the full dashboard: detection controls, events, recorded files, and configuration.

The app uses `VITE_HOOTCAM_STREAMER_URL` (from `.env`) as the API base URL for all requests. **In the 3-part setup, set this to your NUC (Hootcam Motion) URL**, e.g. `http://192.168.1.5:8080`. If you’re not logged in, that same URL is used for public camera streams; if the server requires auth for streams, the UI shows “Sign in to view” and a link to the login page.

## Features

- **Live view (public)** – Camera 0 and Camera 1 streams on the home page; no login required. Theme toggle and “Sign in” in the header.
- **Dashboard** – After sign-in: live previews and detection status per camera, with links to controls and config.
- **Cameras** – Per-camera live view, connection status, start/pause detection, snapshot, and link to camera config. When using Hootcam Motion, set each camera’s **stream_url** (RTSP) in config (e.g. `rtsp://pi-ip:8554/cam0`).
- **Events** – List motion events with filters; event detail with file thumbnails.
- **Files** – Browse pictures and movies with filters; view images and videos.
- **Config** – Global server config (log level, stream quality, etc.).
- **Storage** – View and set recording path (including auto-detected SSD).
- **Camera config** – Per-camera settings (motion threshold, event gap, **stream_url** for RTSP, etc.).
- **Account** – Change password (HTTP Basic Auth).
- **Light / dark mode** – Theme toggle with persistence.

## Installation

### Prerequisites

- Node.js 20+ (or 22+ for latest Vite)
- **Hootcam Motion** running on your NUC (e.g. `uvicorn hootcam_motion.main:app --host 0.0.0.0 --port 8080`). Alternatively, the legacy all-in-one **Hootcam Server** on a Pi.

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
   # For 3-part setup: NUC running Hootcam Motion
   VITE_HOOTCAM_STREAMER_URL=http://192.168.1.5:8080
   ```

   Use your actual NUC host/port. If you use the legacy all-in-one server on a Pi, set the Pi URL instead (e.g. `http://192.168.1.10:8080`). If you omit this, the app defaults to `http://localhost:8080`.

3. **Run the development server**

   ```bash
   npm run dev
   ```

   Open http://localhost:5173 in a browser. If you use WSL, the dev server listens on all interfaces so you can open that URL from a Windows browser.

4. **Sign in (for full access)**

   On the home page you’ll see the public live view and a “Sign in” button. Click it and enter the HTTP Basic Auth username and password used by Hootcam Motion (or Hootcam Server). After a successful login you’ll be redirected to the dashboard with full access.

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_HOOTCAM_STREAMER_URL` | API base URL for the backend (e.g. Hootcam Motion on NUC: `http://nuc-ip:8080`). Used for all API requests and for public camera streams. Defaults to `http://localhost:8080` if unset. |

## Build

To build for production:

```bash
npm run build
```

Output is in `dist/`. Serve it with any static file server. The app will call the server at the URL configured in `.env` at build time (`VITE_HOOTCAM_STREAMER_URL`); ensure that URL is reachable from the browser and that the server allows your UI origin in CORS.

## Related projects

- **Hootcam Motion** – Backend that consumes RTSP streams and runs motion detection, recording, and API. The UI talks to this when using the 3-part architecture.
- **Hootcam Streamer** – Lightweight RTSP streamer for the Pi (two cameras). Feeds Hootcam Motion.
- **Hootcam Server** – Legacy all-in-one backend for the Pi (cameras + motion + recording + API). Can still be used with this UI if you run everything on the Pi.

## .gitignore

The repo ignores:

- `node_modules`, `dist`, `dist-ssr`
- `.env`, `.env.local`, and `.env.*.local` (so local secrets and server URLs are not committed)
- Common editor/OS and log files

See `.gitignore` in the project root for the full list.
