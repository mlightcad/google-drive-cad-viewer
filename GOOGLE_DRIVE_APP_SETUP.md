# Google Drive App Setup Guide

This guide explains how to set up your CAD Viewer as a Google Drive App that can handle CAD files directly from Google Drive.

## Overview

When properly configured, users will be able to:
1. Right-click on CAD files (DWG, DXF, DGN, DWF) in Google Drive
2. Select "Open with" → "CAD Viewer"
3. Your app will open with the selected file loaded

## Prerequisites

1. A deployed web application (HTTPS required)
   - Static site hosting works perfectly (Netlify, Vercel, GitHub Pages, etc.)
   - No server-side processing required
2. Google Cloud Console project with Drive API enabled
3. OAuth 2.0 credentials configured

## Step 1: Google Cloud Console Setup

### 1.1 Create/Select Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your **Project ID** (you'll need this later)

### 1.2 Enable APIs
1. Go to "APIs & Services" → "Library"
2. Search for and enable:
   - **Google Drive API**
   - **Google Picker API** (required for the in-app “Choose from Google Drive” button)
   (Do not enable the legacy Google+ / oauth2 v2 userinfo API — it is blocked.)

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add **Authorized JavaScript origins** (scheme + host + port only; **no path, no trailing slash**):
   - `http://localhost:5173` (local `pnpm dev`)
   - `https://mlightcad.github.io` (GitHub Pages; origin does **not** include `/google-drive-cad-viewer`)
5. Add **Authorized redirect URIs** (this app uses the GIS popup token flow, but Google still requires at least one URI):
   - `http://localhost:5173/`
   - `https://mlightcad.github.io/google-drive-cad-viewer/`
6. Note your **Client ID** (you'll need this later)

### 1.4 Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Restrict the API key to:
   - Google Drive API
   - Your domain only

### 1.5 Add OAuth test users (required while the app is in Testing)

The app is still in **Testing** and has not completed Google verification, so **only listed testers can sign in**. Project owners are not always enough. Add the Google account you actually use when clicking **Sign in with Google** (for example `mlight.lee@outlook.com`).

1. Open [Google Auth Platform → Audience](https://console.cloud.google.com/auth/audience)
   - Older console: **APIs & Services** → **OAuth consent screen** → **Test users**
2. Keep **Publishing status** as **Testing**
3. Under **Test users**, click **Add users**
4. Enter the email of the Google account you will select at sign-in (must match the account used with **Sign in with Google**)
5. Save, wait one or two minutes, then authorize again

Testing mode allows at most **100 testers**. This app requests `drive.file` (non-sensitive / per-file). Do **not** click **Publish app** just to let everyone sign in; a public launch still requires Google’s brand verification and a configured Homepage + Privacy Policy on your verified domain (see README “Publishing / OAuth verification”).

## Step 2: Configure Environment Variables

### For GitHub Actions Deployment (Recommended)

1. **Set up GitHub Secrets:**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add these secrets:
     - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
     - `GOOGLE_API_KEY`: Your Google API Key
     - `GOOGLE_PROJECT_ID`: Your Google Cloud Project ID (string id for the Drive App manifest)
     - `GOOGLE_APP_ID`: Your Google Cloud **project number** (digits only; used by Google Picker as `VITE_GOOGLE_APP_ID`)

### For Local Development

Create a `.env.local` file in your project root:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your_api_key_here
VITE_GOOGLE_APP_ID=your_google_project_number_here
```

`VITE_GOOGLE_APP_ID` must be the numeric **Project number** from Google Cloud Console → Home → Project info (not the project id string).
## Step 3: Drive App Manifest (Auto-Generated)

The drive app manifest is automatically generated during the build process using your GitHub Secrets. No manual configuration needed!

**Template file**: `public/drive-app-manifest.template.json` (for reference only)

**Generated file**: `public/drive-app-manifest.json` (created during build with real credentials)

## Step 4: Create App Icons

Create icon files in `public/icons/`:
- `icon-16.png` (16x16 pixels)
- `icon-32.png` (32x32 pixels)
- `icon-48.png` (48x48 pixels)
- `icon-128.png` (128x128 pixels)

## Step 5: Deploy Your Application

### Option A: Netlify (Recommended for static sites)

1. Build your application:
```bash
npm run build
```

2. Deploy to Netlify:
   - Drag and drop the `dist` folder to Netlify
   - Or connect your GitHub repository for automatic deployments
   - Netlify provides HTTPS automatically

3. Configure redirects (create `public/_redirects` file):
```
/*    /index.html   200
```

### Option B: Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Configure the static site build (`pnpm build`, publish `dist/`)

### Option C: GitHub Pages

#### Method 1: GitHub Actions (Recommended - Secure)

1. **Set up GitHub Secrets:**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add these secrets:
     - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
     - `GOOGLE_API_KEY`: Your Google API Key
     - `GOOGLE_PROJECT_ID`: Your Google Cloud Project ID (Drive App manifest)
     - `GOOGLE_APP_ID`: Your Google Cloud **project number** (digits; Google Picker)

2. **Push your code:**
   ```bash
   git add .
   git commit -m "Add GitHub Actions deployment"
   git push origin main
   ```

3. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: "GitHub Actions"
   - The workflow will automatically deploy on push

#### Method 2: Manual Deployment (Less Secure)

1. **Create config file** (replace with your actual credentials):
   ```bash
   cp public/config.production.js public/config.js
   # Edit config.js with your actual credentials
   ```

2. **Build and deploy:**
   ```bash
   npm run build
   # Copy dist folder to gh-pages branch
   ```

3. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: "gh-pages"

**⚠️ Warning:** Method 2 exposes your API keys in the repository. Use Method 1 for security.

### Option D: Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Initialize and deploy:
```bash
firebase init hosting
firebase deploy
```

**All these options provide HTTPS automatically, which is required for Google Drive Apps.**

## Step 6: Register as Google Drive App

### Option A: Chrome Web Store (Recommended)
1. Create a Chrome Web Store developer account
2. Package your app as a Chrome extension
3. Submit to the Chrome Web Store
4. Users can install from the store

### Option B: Direct Installation
1. Users can install directly by visiting your app URL
2. They'll see a prompt to "Add to Google Drive"
3. Click "Add" to install the app

## Step 7: Testing

### Test File Handler Integration
1. Upload a CAD file to Google Drive
2. Right-click on the file
3. Select "Open with" → "CAD Viewer"
4. Your app should open with the file loaded

### Test URL Parameters
Your app should handle these URL parameters:
- `?action=open&fileId=FILE_ID&fileName=FILE_NAME&mimeType=MIME_TYPE`

## Troubleshooting

### Common Issues

1. **"App not found" error**
   - Ensure your manifest is properly configured
   - Check that your domain is authorized in OAuth settings

2. **Authentication fails**
   - Verify your Client ID and API Key
   - Check that your domain is in authorized origins

3. **Error 403 `access_denied` / "has not completed the Google verification process"**
   - The OAuth app is in **Testing** mode
   - Add the signed-in Google account as a **Test user** (see §1.5)
   - Sign in with that tester account, not an unlisted personal/work account

4. **Files don't load**
   - Ensure the Google Drive API is enabled
   - Check that your API key has proper restrictions

5. **CORS errors**
   - Make sure your domain is in authorized origins
   - Check that you're using HTTPS in production

### Debug Mode

Add this to your browser console to debug:
```javascript
// Check if Drive App parameters are present
console.log('URL params:', new URLSearchParams(window.location.search));

// Check authentication status
console.log('GAPI loaded:', typeof gapi !== 'undefined');
console.log('Google loaded:', typeof google !== 'undefined');
```

## Security Considerations

1. **API Key Restrictions**: Always restrict your API key to your domain
2. **OAuth Scopes**: Only request the minimum required permissions
3. **HTTPS**: Always use HTTPS in production
4. **Token Storage**: Don't store tokens in localStorage (use sessionStorage or memory)

## Production Checklist

- [ ] HTTPS enabled on the production host (`mlightcad.com` recommended)
- [ ] App and `privacy.html` served from the **same** verified domain
- [ ] OAuth consent screen: Homepage URL, Privacy Policy URL (identical to the in-app link), Authorized domains
- [ ] Domain ownership verified in Google Search Console
- [ ] Environment variables / GitHub secrets configured
- [ ] Drive App manifest updated with real credentials and production `web_url`
- [ ] Icons created and uploaded
- [ ] OAuth credentials configured for production origin
- [ ] API key restricted to production domain
- [ ] Google Drive API + Google Picker API enabled
- [ ] App tested with real CAD files
- [ ] Demo video recorded (OAuth consent in English + open DWG/DXF) before submitting verification

## Support

For issues with Google Drive App integration:
- [Google Drive API Documentation](https://developers.google.com/drive)
- [Chrome Web Store Developer Documentation](https://developer.chrome.com/docs/webstore/)
- [Google Cloud Console Help](https://cloud.google.com/apis/docs/getting-started)
