export interface UserInfo {
  name: string
  email: string
  picture: string
}

export interface DriveFile {
  id: string
  name: string
  size: string
  modifiedTime: string
  mimeType: string
}

export interface DriveAppAction {
  action: string
  fileId: string
  fileName: string
  mimeType: string
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
const APP_ID = import.meta.env.VITE_GOOGLE_APP_ID || ''

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
].join(' ')

const CAD_EXTENSIONS = ['.dwg', '.dxf']

const isPlaceholder = (value: string) =>
  !value ||
  value.includes('your_client_id_here') ||
  value.includes('your_api_key_here') ||
  value.includes('your_google_client_id_here') ||
  value.includes('your_google_api_key_here') ||
  value.includes('your_google_app_id_here') ||
  value.includes('your_app_id_here')

/** OAuth + Drive download (Drive App “Open with”). Does not require Picker app id. */
export const isConfigured = !isPlaceholder(CLIENT_ID) && !isPlaceholder(API_KEY)

/** Google Picker also needs the numeric Cloud project number. */
export const isPickerConfigured = isConfigured && !isPlaceholder(APP_ID)

function loadScript(src: string): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
  if (existing) {
    return existing.dataset.loaded === 'true'
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          existing.addEventListener('load', () => resolve())
          existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)))
        })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

function toDriveFile(file: {
  id?: string | null
  name?: string | null
  size?: string | null
  modifiedTime?: string | null
  mimeType?: string | null
}): DriveFile | null {
  if (!file.id || !file.name || !file.modifiedTime || !file.mimeType) {
    return null
  }
  return {
    id: file.id,
    name: file.name,
    size: file.size || '0',
    modifiedTime: file.modifiedTime,
    mimeType: file.mimeType
  }
}

function isCadFileName(name: string): boolean {
  const lower = name.toLowerCase()
  return CAD_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

type TokenCallback = (response: google.accounts.oauth2.TokenResponse) => void

export class GoogleDriveClient {
  private tokenClient: google.accounts.oauth2.TokenClient | null = null
  private gapiReady = false
  private gisReady = false
  private pickerReady = false
  private accessToken = ''
  private pendingAuth: { resolve: () => void; reject: (error: Error) => void } | null = null

  isAuthenticated = false
  userInfo: UserInfo = { name: '', email: '', picture: '' }

  async initialize(): Promise<void> {
    if (this.gapiReady && this.gisReady && this.pickerReady) return

    await Promise.all([
      loadScript('https://apis.google.com/js/api.js'),
      loadScript('https://accounts.google.com/gsi/client')
    ])

    await new Promise<void>((resolve) => {
      gapi.load('client:picker', () => resolve())
    })

    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
    })

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => this.handleTokenResponse(response)
    })

    this.gapiReady = true
    this.gisReady = true
    this.pickerReady = true
  }

  private handleTokenResponse: TokenCallback = (response) => {
    if (response.error || !response.access_token) {
      const error = new Error(response.error || 'Google Drive authorization failed')
      this.pendingAuth?.reject(error)
      this.pendingAuth = null
      return
    }

    this.accessToken = response.access_token
    gapi.client.setToken({ access_token: response.access_token })
    this.isAuthenticated = true

    void this.loadUserProfile(response.access_token).catch((error: unknown) => {
      console.warn('Could not load Google user profile:', error)
    })

    this.pendingAuth?.resolve()
    this.pendingAuth = null
  }

  private async loadUserProfile(accessToken: string): Promise<void> {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    if (!response.ok) {
      throw new Error(`Failed to load user profile (${response.status})`)
    }

    const profile = await response.json()
    this.userInfo = {
      name: profile.name || profile.email || '',
      email: profile.email || '',
      picture: profile.picture || ''
    }
  }

  authenticate(): Promise<void> {
    if (!isConfigured) {
      return Promise.reject(
        new Error(
          'Google API credentials not configured. Set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY in .env.local.'
        )
      )
    }

    return new Promise((resolve, reject) => {
      void this.initialize()
        .then(() => {
          if (!this.tokenClient) {
            reject(new Error('Token client not initialized'))
            return
          }
          this.pendingAuth = { resolve, reject }
          this.tokenClient.requestAccessToken({ prompt: this.isAuthenticated ? '' : 'consent' })
        })
        .catch(reject)
    })
  }

  signOut(): void {
    const token = gapi.client.getToken()
    if (token?.access_token) {
      google.accounts.oauth2.revoke(token.access_token, () => {})
      gapi.client.setToken(null)
    }

    this.accessToken = ''
    this.isAuthenticated = false
    this.userInfo = { name: '', email: '', picture: '' }
  }

  async getFileDetails(fileId: string): Promise<DriveFile> {
    const response = await gapi.client.drive.files.get({
      fileId,
      fields: 'id,name,size,modifiedTime,mimeType'
    })
    const file = toDriveFile(response.result)
    if (!file) {
      throw new Error('Incomplete Drive file metadata')
    }
    return file
  }

  async getFileContent(fileId: string): Promise<ArrayBuffer> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated')
    }

    const token = this.accessToken || gapi.client.getToken()?.access_token
    if (!token) {
      throw new Error('No access token')
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to download Drive file (${response.status})`)
    }

    return response.arrayBuffer()
  }

  /**
   * Opens Google's official Drive file picker and resolves with the chosen CAD file.
   */
  openFilePicker(): Promise<DriveFile> {
    return new Promise((resolve, reject) => {
      if (!isPickerConfigured) {
        reject(
          new Error(
            'Google Picker requires VITE_GOOGLE_APP_ID (numeric project number). Set it in .env.local.'
          )
        )
        return
      }

      void this.initialize()
        .then(async () => {
          if (!this.isAuthenticated) {
            await this.authenticate()
          }

          const token = this.accessToken || gapi.client.getToken()?.access_token
          if (!token) {
            reject(new Error('No access token for Google Picker'))
            return
          }

          const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
          view.setIncludeFolders(true)
          view.setSelectFolderEnabled(false)
          view.setMode(google.picker.DocsViewMode.LIST)

          const picker = new google.picker.PickerBuilder()
            .addView(view)
            .addView(google.picker.ViewId.RECENTLY_PICKED)
            .setOAuthToken(token)
            .setDeveloperKey(API_KEY)
            .setAppId(APP_ID)
            .setTitle('Select a CAD file (DWG / DXF)')
            .setCallback((data: google.picker.ResponseObject) => {
              if (data.action === google.picker.Action.CANCEL) {
                reject(new Error('Picker cancelled'))
                return
              }
              if (data.action !== google.picker.Action.PICKED) return

              const doc = data.docs?.[0]
              if (!doc?.id || !doc.name) {
                reject(new Error('No file selected'))
                return
              }
              if (!isCadFileName(doc.name)) {
                reject(new Error('Please select a .dwg or .dxf file'))
                return
              }

              resolve({
                id: doc.id,
                name: doc.name,
                size: String(doc.sizeBytes ?? 0),
                modifiedTime: doc.lastEditedUtc
                  ? new Date(doc.lastEditedUtc).toISOString()
                  : new Date().toISOString(),
                mimeType: doc.mimeType || 'application/octet-stream'
              })
            })
            .build()

          picker.setVisible(true)
        })
        .catch(reject)
    })
  }

  parseDriveAppActionFromUrl(): DriveAppAction | null {
    const params = new URLSearchParams(window.location.search)
    const action = params.get('action')
    const fileId = params.get('fileId')
    const fileName = params.get('fileName')
    const mimeType = params.get('mimeType')

    if (!action || !fileId || !fileName || !mimeType) return null
    return { action, fileId, fileName, mimeType }
  }
}
