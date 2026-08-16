import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

// Google Drive API configuration
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
].join(' ')

const isPlaceholder = (value: string) =>
  !value ||
  value.includes('your_client_id_here') ||
  value.includes('your_api_key_here') ||
  value.includes('your_google_client_id_here') ||
  value.includes('your_google_api_key_here')

const isConfigured = !isPlaceholder(CLIENT_ID) && !isPlaceholder(API_KEY)

interface UserInfo {
  name: string
  email: string
  picture: string
}

interface DriveFile {
  id: string
  name: string
  size: string
  modifiedTime: string
  mimeType: string
}

interface SearchResult {
  files: DriveFile[]
  total: number
}

// Google Drive App integration
interface DriveAppAction {
  action: string
  fileId: string
  fileName: string
  mimeType: string
}

function createGoogleDrive() {
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const currentFile = ref<DriveFile | null>(null)
  const userInfo = reactive<UserInfo>({
    name: '',
    email: '',
    picture: ''
  })

  let tokenClient: google.accounts.oauth2.TokenClient | null = null
  let gapiInited = false
  let gisInited = false

  // Initialize Google APIs
  const initializeGoogleAPIs = async () => {
    if (gapiInited && gisInited) return

    try {
      // Load the Google API client library
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://apis.google.com/js/api.js'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Google API'))
        document.head.appendChild(script)
      })

      // Load the Google Identity Services library
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
        document.head.appendChild(script)
      })

      // Initialize gapi
      await new Promise<void>((resolve) => {
        gapi.load('client', resolve)
      })

      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
      })

      gapiInited = true

      // Initialize Google Identity Services
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse
      })

      gisInited = true
    } catch (error) {
      console.error('Failed to initialize Google APIs:', error)
    }
  }

  const loadUserProfile = async (accessToken: string) => {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to load user profile (${response.status})`)
    }

    const profile = await response.json()
    userInfo.name = profile.name || profile.email || ''
    userInfo.email = profile.email || ''
    userInfo.picture = profile.picture || ''
  }

  const handleTokenResponse = (response: google.accounts.oauth2.TokenResponse) => {
    if (response.error || !response.access_token) {
      console.error('Authentication error:', response.error)
      ElMessage.error('Google Drive authorization failed')
      return
    }

    // GIS token client + gapi: attach the token so Drive API calls are authorized.
    gapi.client.setToken({ access_token: response.access_token })
    isAuthenticated.value = true

    loadUserProfile(response.access_token).catch((error: unknown) => {
      console.warn('Could not load Google user profile:', error)
    })
  }

  const authenticate = async () => {
    if (!isConfigured) {
      const missing = [
        !CLIENT_ID ? 'VITE_GOOGLE_CLIENT_ID' : '',
        !API_KEY ? 'VITE_GOOGLE_API_KEY' : ''
      ].filter(Boolean)
      ElMessage.error(
        `Google API credentials not configured. Set ${missing.join(' and ')} in .env.local, then restart the dev server.`
      )
      return
    }

    isLoading.value = true
    try {
      await initializeGoogleAPIs()
      
      if (tokenClient) {
        tokenClient.requestAccessToken()
      }
    } catch (error) {
      console.error('Authentication failed:', error)
    } finally {
      isLoading.value = false
    }
  }

  const signOut = () => {
    const token = gapi.client.getToken()
    if (token) {
      google.accounts.oauth2.revoke(token.access_token)
      gapi.client.setToken('')
    }
    
    isAuthenticated.value = false
    userInfo.name = ''
    userInfo.email = ''
    userInfo.picture = ''
  }

  // Handle Google Drive App integration
  const handleDriveAppAction = async (action: DriveAppAction) => {
    console.log('Drive App Action:', action)
    
    if (action.action === 'open') {
      try {
        // Get file details
        const fileDetails = await getFileDetails(action.fileId)
        currentFile.value = fileDetails
        
        // Authenticate if needed
        if (!isAuthenticated.value) {
          await authenticate()
        }
      } catch (error) {
        console.error('Error handling Drive App action:', error)
      }
    }
  }

  const getFileDetails = async (fileId: string): Promise<DriveFile> => {
    try {
      const response = await gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'id,name,size,modifiedTime,mimeType'
      })

      return {
        id: response.result.id!,
        name: response.result.name!,
        size: response.result.size || '0',
        modifiedTime: response.result.modifiedTime!,
        mimeType: response.result.mimeType!
      }
    } catch (error) {
      console.error('Error getting file details:', error)
      throw error
    }
  }

  const getFileContent = async (fileId: string): Promise<ArrayBuffer> => {
    if (!isAuthenticated.value) {
      throw new Error('Not authenticated')
    }

    const token = gapi.client.getToken()?.access_token
    if (!token) {
      throw new Error('No access token')
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to download Drive file (${response.status})`)
    }

    return response.arrayBuffer()
  }

  // Legacy search functionality (for file browser)
  const searchFiles = async (query: string, page: number = 1, pageSize: number = 20): Promise<SearchResult> => {
    if (!isAuthenticated.value) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await gapi.client.drive.files.list({
        q: query,
        pageSize: pageSize,
        pageToken: page > 1 ? await getPageToken(page) : undefined,
        fields: 'files(id,name,size,modifiedTime,mimeType),nextPageToken'
      })

      return {
        files: response.result.files || [],
        total: response.result.files?.length || 0
      }
    } catch (error) {
      console.error('Error searching files:', error)
      throw error
    }
  }

  const getPageToken = async (_page: number): Promise<string | undefined> => {
    // For simplicity, we'll just return undefined for now
    // In a real implementation, you'd need to track page tokens
    return undefined
  }

  // Initialize Drive App integration
  onMounted(() => {
    // Check if we're being opened as a Drive App
    const urlParams = new URLSearchParams(window.location.search)
    const action = urlParams.get('action')
    const fileId = urlParams.get('fileId')
    const fileName = urlParams.get('fileName')
    const mimeType = urlParams.get('mimeType')

    if (action && fileId && fileName && mimeType) {
      handleDriveAppAction({
        action,
        fileId,
        fileName,
        mimeType
      })
    }

    // Listen for Drive App messages
    window.addEventListener('message', (event) => {
      if (event.origin === 'https://drive.google.com' && event.data.type === 'drive-app-action') {
        handleDriveAppAction(event.data.action)
      }
    })
  })

  return {
    isConfigured,
    isAuthenticated,
    isLoading,
    userInfo,
    currentFile,
    authenticate,
    signOut,
    searchFiles,
    getFileContent,
    getFileDetails,
    handleDriveAppAction
  }
}

let googleDrive: ReturnType<typeof createGoogleDrive> | null = null

export function useGoogleDrive() {
  if (!googleDrive) {
    googleDrive = createGoogleDrive()
  }
  return googleDrive
}
