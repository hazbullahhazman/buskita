# Manual upload and setup

## Upload to GitHub

1. Extract this ZIP on your computer.
2. Open your new GitHub repository and choose **uploading an existing file** (or **Add file → Upload files**).
3. Upload the extracted files and the `src`, `shared`, `server`, and `tests` folders. Keep `package.json` at the repository root. Do not upload the ZIP as the application source.
4. Include `.gitignore` and `.env.example`. Never upload `.env.local`, real API keys, `node_modules`, or `.demo-data`.
5. Commit the upload.

## Run the complete demo

Install Node.js 22.12 or newer. Open a terminal in the extracted folder:

```sh
npm ci
npm run build
npm start
```

Open `http://localhost:4317` for passengers, `/driver` for drivers, and `/office` for the office dashboard. All pages connect to the same running server.

## Vercel deployment status

**This archive contains the working local application, not a completed Vercel adaptation.** Deploying only its Vite frontend will not provide working bookings, GPS updates, or office statistics: those pages require the Express API.

The current backend uses a continuously running simulation timer, Server-Sent Events, and a local JSON file. Before using Vercel for the complete app, replace file storage with a shared database, implement request-driven simulation updates, and adapt the live-update transport and API to serverless execution. No cloud database or Vercel credentials are included.

Alternatively, host the complete Node application on a server with persistent disk and support for long-lived HTTP connections. Use `npm ci && npm run build` to build and `npm start` to launch, configure `PORT` if required by the host, and persist the directory specified by `DEMO_DATA_DIR`. Use HTTPS for phone GPS. Run one application instance with the current file storage implementation.

The three user identities and driver/office pages are open demo roles, not authenticated accounts. Route geometry and proposed stops still need UTM field verification. See `README.md` for the demo's limitations and walkthrough.
