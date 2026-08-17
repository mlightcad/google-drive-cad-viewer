# Google Drive CAD Viewer

A lightweight web app that opens CAD files (DWG, DXF) from Google Drive in the [MLightCAD embed viewer](https://mlightcad.com/iframe-plugin.html).

## Features

- **Google Drive File Picker**: Choose files with Google’s official Drive picker (no custom file browser)
- **Drive App Integration**: Open CAD files from Drive via “Open with”
- **CAD Viewer**: Drawings open in MLightCAD’s embed iframe via `postMessage`
- **Small footprint**: Vanilla TypeScript + CSS (no Vue / Element Plus)

## Supported File Formats

- **DWG** — AutoCAD Drawing files
- **DXF** — Drawing Exchange Format

## Technology Stack

- **Frontend**: Vanilla TypeScript + CSS
- **CAD Viewer**: [MLightCAD iframe plugin](https://mlightcad.com/iframe-plugin.html) (`https://mlightcad.com/embed.html`)
- **Google APIs**: Identity Services, Drive API, [Google Picker](https://developers.google.com/workspace/drive/picker/guides/overview)
- **Build Tool**: Vite

## Prerequisites

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable:
   - **Google Drive API**
   - **Google Picker API**
4. Create OAuth 2.0 credentials (Web application):
   - Authorized JavaScript origins: `http://localhost:5173` (and your production origin)
   - Authorized redirect URIs as required by Google
5. Create an API key restricted to Drive / Picker and your domains
6. Note your **Project number** (Home → Project info) — this is `VITE_GOOGLE_APP_ID`

**For Google Drive App Integration**: See [GOOGLE_DRIVE_APP_SETUP.md](./GOOGLE_DRIVE_APP_SETUP.md).

## Installation

```bash
git clone https://github.com/mlightcad/google-drive-cad-viewer.git
cd google-drive-cad-viewer
pnpm install
```

```bash
cp env.example .env.local
```

Edit `.env.local`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_GOOGLE_APP_ID=your_google_project_number_here
# Optional. Defaults to https://mlightcad.com/embed.html
# VITE_MLIGHTCAD_EMBED_URL=https://mlightcad.com/embed.html
```

## Development

```bash
pnpm dev
```

App URL: `http://localhost:5173`

## Building for Production

```bash
pnpm build
pnpm preview
```

## Usage

### Standard mode (Google Picker)

1. Click **Sign in with Google** and authorize
2. Click **Choose from Google Drive** to open Google’s file picker
3. Select a `.dwg` or `.dxf` file
4. The app downloads the file with your Drive token and opens it in the MLightCAD embed iframe

### Google Drive App mode

1. Install the CAD Viewer as a Google Drive App
2. Right-click a CAD file in Drive → **Open with** → **CAD Viewer**
3. The drawing opens in the viewer

## Project Structure

```
src/
├── main.ts           # UI wiring and app flow
├── googleDrive.ts    # OAuth, Drive download, Google Picker
├── cadEmbed.ts       # MLightCAD iframe + postMessage
├── mlightcadEmbed.ts # Embed URL helpers
└── styles.css        # App styles
```

## API Permissions

- `https://www.googleapis.com/auth/drive.file` — read files the user opens with this app (Picker / Drive “Open with”)
- `https://www.googleapis.com/auth/userinfo.email` / `userinfo.profile` — show signed-in account

## How viewing works

This app does **not** bundle `@mlightcad/cad-viewer`. After you pick a Drive file it:

1. Downloads the DWG/DXF in this page with the Google Drive OAuth token
2. Opens [MLightCAD embed](https://mlightcad.com/embed.html) in an iframe (`mode=review&toolbar=1`)
3. Sends the file bytes with `postMessage` (`mlightcad-embed:open`) after the embed reports `mlightcad-embed:ready`
4. The drawing is parsed and rendered **in the visitor’s browser**

Local embed testing: set `VITE_MLIGHTCAD_EMBED_URL` to your local embed page (for example `http://localhost:5174/embed.html`).

## Security

- Authentication uses Google OAuth 2.0
- Credentials live in environment variables
- Only per-file Drive access (`drive.file`) is requested
- Drawing bytes are downloaded in-page and sent to the embed iframe via `postMessage`; they are not stored by this app
- In-app Privacy links (auth page, nav, workspace toolbar) open `privacy.html`

### Publishing / OAuth verification (mlightcad.com)

Host the built app and `privacy.html` on the **same verified domain** you list as the OAuth consent Homepage (recommended: `mlightcad.com`).

Example when the app lives under the marketing site:

| Field | Example URL |
|-------|-------------|
| App | `https://mlightcad.com/google-drive-cad-viewer/` |
| Privacy Policy | `https://mlightcad.com/google-drive-cad-viewer/privacy.html` |
| OAuth Homepage | Product page on `mlightcad.com` (describe the app; not only a login wall) |
| Authorized domain | `mlightcad.com` (verify ownership in Google Search Console) |

Use the same Privacy Policy URL on the homepage and in the OAuth consent screen. Add Authorized JavaScript origins for that production origin before submitting verification.

## Troubleshooting

1. **Authentication fails**: Check OAuth client origins and that your Google account is a test user (while the app is in Testing)
2. **Picker does not open**: Enable **Google Picker API** and set `VITE_GOOGLE_APP_ID` to the numeric **project number**
3. **Files not loading**: Ensure Drive API is enabled and you are still signed in
4. **CORS / origin errors**: Add the exact origin (no path) to Authorized JavaScript origins
5. **Drawing does not open**: Confirm the file is `.dwg`/`.dxf` and the access token is still valid

## License

MIT License

## Acknowledgments

- [MLightCAD iframe plugin](https://mlightcad.com/iframe-plugin.html)
- [Google Picker API](https://developers.google.com/workspace/drive/picker/guides/overview)
- [Google Drive API](https://developers.google.com/drive)
