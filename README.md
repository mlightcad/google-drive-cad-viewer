# Google Drive CAD Viewer

A modern web application that integrates Google Drive with a powerful CAD viewer, allowing you to view CAD files (DWG, DXF, DGN, DWF) directly from your Google Drive.

## Features

- 🔐 **Google Drive App Integration**: Register as a file handler for CAD files in Google Drive
- 🎯 **Direct File Opening**: Right-click CAD files in Drive → "Open with CAD Viewer"
- 📁 **File Browser**: Browse and search CAD files in your Google Drive
- 🎯 **CAD Viewer**: View CAD files with advanced rendering capabilities
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🔍 **File Search**: Search for specific CAD files by name
- 📊 **File Information**: View file size, modification date, and other metadata

## Supported File Formats

- **DWG** - AutoCAD Drawing files
- **DXF** - Drawing Exchange Format

## Technology Stack

- **Frontend**: Vue 3 with TypeScript
- **UI Framework**: Element Plus
- **CAD Viewer**: @mlightcad/cad-viewer
- **Google Drive API**: Google APIs JavaScript Client Library
- **Build Tool**: Vite
- **Styling**: UnoCSS + SCSS

## Prerequisites

Before running this application, you need to set up Google Drive API credentials:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Create OAuth 2.0 credentials:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Set application type to "Web application"
   - Add your domain to authorized origins
   - Add `http://localhost:5173` for development
5. Create an API Key:
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Restrict the API key to Google Drive API

**For Google Drive App Integration**: See [GOOGLE_DRIVE_APP_SETUP.md](./GOOGLE_DRIVE_APP_SETUP.md) for detailed setup instructions.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/mlight-lee/google-drive-cad-viewer.git
cd google-drive-cad-viewer
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Edit `.env.local` and add your Google API credentials:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
```

## Development

Start the development server:
```bash
npm run dev
# or
pnpm dev
```

The application will be available at `http://localhost:5173`

## Building for Production

Build the application:
```bash
npm run build
# or
pnpm build
```

Preview the production build:
```bash
npm run preview
# or
pnpm preview
```

## Usage

### Standard Mode (File Browser)
1. **Authentication**: Click "Connect Google Drive" to authenticate with your Google account
2. **Browse Files**: Use the file browser to search and browse CAD files in your Google Drive
3. **View Files**: Click on any CAD file to view it in the integrated viewer
4. **Navigation**: Use the CAD viewer's built-in navigation tools to zoom, pan, and explore the drawing

### Google Drive App Mode
1. **Install App**: Install the CAD Viewer as a Google Drive App
2. **Open Files**: Right-click on CAD files in Google Drive
3. **Select App**: Choose "Open with" → "CAD Viewer"
4. **View**: The file opens directly in the CAD viewer

## Project Structure

```
src/
├── components/
│   ├── GoogleDriveAuth.vue      # Google Drive authentication component
│   └── GoogleDriveFilePicker.vue # File browser component
├── composables/
│   └── useGoogleDrive.ts        # Google Drive API integration
├── types/
│   └── google-apis.d.ts         # TypeScript declarations for Google APIs
├── App.vue                      # Main application component
└── main.ts                      # Application entry point
```

## API Permissions

The application requests the following Google Drive permissions:
- `https://www.googleapis.com/auth/drive.readonly` - Read-only access to files in Google Drive

## Google Drive App Integration

This application can be registered as a Google Drive App to handle CAD files directly. When properly configured:

- Users can right-click CAD files in Google Drive
- Select "Open with" → "CAD Viewer"
- The app opens with the selected file loaded

See [GOOGLE_DRIVE_APP_SETUP.md](./GOOGLE_DRIVE_APP_SETUP.md) for complete setup instructions.

## Security

- All authentication is handled securely through Google's OAuth 2.0 flow
- API credentials are stored as environment variables
- The application only requests read-only access to Google Drive
- No file data is stored locally or transmitted to third-party servers

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **Authentication fails**: Ensure your Google API credentials are correctly configured and the domain is authorized
2. **Files not loading**: Check that the Google Drive API is enabled in your Google Cloud Console
3. **CORS errors**: Make sure your domain is added to the authorized origins in your OAuth 2.0 client configuration

### Development Issues

- If you encounter TypeScript errors related to Google APIs, ensure the type declarations are properly loaded
- For build issues, try clearing the cache: `npm run clean && npm install`

## License

MIT License - see the main project LICENSE file for details.

## Acknowledgments

- [@mlightcad/cad-viewer](https://github.com/mlight-lee/cad-viewer) - The CAD viewing engine
- [Element Plus](https://element-plus.org/) - Vue 3 UI framework
- [Google Drive API](https://developers.google.com/drive) - Google Drive integration 