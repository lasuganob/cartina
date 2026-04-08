# Cartina

Cartina is a local-first grocery trip planning app built as a Progressive Web App (PWA). It lets users create and review grocery trips in the browser, store data offline with IndexedDB, and sync queued changes to a Google Apps Script backend when connectivity returns.

## Goals

- Provide a fast grocery trip planner that still works with unstable or missing internet.
- Keep trip creation available offline by writing immediately to local storage.
- Sync data to a lightweight Google Sheets-backed backend when the device is online.
- Support installable PWA behavior on desktop and mobile.
- Present a simple dashboard for planned trips, completed trips, and budget totals.

## Product Specs

- Dashboard view with trip summary metrics and upcoming trips.
- Trips view with:
  - add-trip form
  - trips overview list
  - online/offline sync status
- Offline-first persistence with Dexie over IndexedDB.
- Mutation queue for deferred sync to Google Apps Script.
- PWA manifest and service worker via `vite-plugin-pwa`.
- Responsive Material UI layout with sidebar navigation.
- Skeleton loading states to preserve layout during initial load.

## Tech Stack

- `React 19`
- `Vite 6`
- `React Router`
- `Material UI`
- `Dexie` + `dexie-react-hooks`
- `Day.js`
- `vite-plugin-pwa`
- `Google Apps Script` as a lightweight backend
- `Google Sheets` as the backing store used by Apps Script

## Environment Variables

Create a local `.env` file based on [`.env.example`](/Users/ippuser/Desktop/Work/Apps/cartina-app/.env.example).

```env
VITE_GAS_BASE_URL=https://script.google.com/macros/s/your-deployment-id/exec
VITE_APP_NAME=Cartina
```

- `VITE_GAS_BASE_URL`: deployed Google Apps Script web app URL ending in `/exec`
- `VITE_APP_NAME`: app name exposed in the PWA manifest

## Installation

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Then update `VITE_GAS_BASE_URL` with your deployed Apps Script web app URL.

### 3. Start local development

```bash
npm run dev
```

The app runs on `http://localhost:5173` unless the port is already in use.

## Google Apps Script Setup

The frontend expects a Google Apps Script web app that exposes `/trips` over `GET` and `POST`.

### Backend setup

1. Create a Google Spreadsheet.
2. Open Extensions -> Apps Script.
3. Paste the contents of [`Code.gs`](/Users/ippuser/Desktop/Work/Apps/cartina-app/google-apps-script/Code.gs) into the Apps Script project.
4. Save and deploy it as a Web App.
5. Set deployment access so the frontend can reach it from the browser.
6. Copy the `/exec` URL into `VITE_GAS_BASE_URL` in `.env`.

On first use, the script creates a `Trips` sheet if it does not already exist.

## Build for Production

```bash
npm run build
```

The production output is generated in [`dist/`](/Users/ippuser/Desktop/Work/Apps/cartina-app/dist).

## PWA Installation

Cartina is configured as an installable PWA. After deploying or running it from a supported environment, you can install it like an app.

### Desktop Chrome or Edge

1. Open the app in the browser.
2. Wait for the page to finish loading.
3. Click the install icon in the address bar, or open the browser menu and choose `Install Cartina`.
4. Confirm installation.

### Android Chrome

1. Open the app in Chrome.
2. Open the browser menu.
3. Tap `Install app` or `Add to Home screen`.
4. Confirm the prompt.

### iPhone or iPad Safari

1. Open the app in Safari.
2. Tap the Share button.
3. Choose `Add to Home Screen`.
4. Confirm the app name and save.

## Offline Behavior

- Trips are written to IndexedDB immediately.
- If the backend is unavailable, the UI keeps using cached local data.
- Pending mutations are stored in a sync queue.
- When the browser comes back online, queued trip mutations are retried automatically.

## Current Scope

- Trip creation
- Trip listing
- Dashboard metrics
- Local caching and deferred sync

This repository currently includes the basic trip workflow and PWA shell. If you extend it, keep the local-first behavior intact so offline entry remains reliable.
