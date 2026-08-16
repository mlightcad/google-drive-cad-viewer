import './styles.css'

import { CadEmbedViewer } from './cadEmbed'
import {
  DriveFile,
  GoogleDriveClient,
  isConfigured,
  isPickerConfigured
} from './googleDrive'
import { initSiteNav } from './siteNav'

type FileLoadState = 'idle' | 'loading' | 'ready' | 'error'

const drive = new GoogleDriveClient()

const authLayout = document.querySelector<HTMLElement>('#auth-layout')!
const bootPanel = document.querySelector<HTMLElement>('#boot-panel')!
const authPanel = document.querySelector<HTMLElement>('#auth-panel')!
const workspacePanel = document.querySelector<HTMLElement>('#workspace-panel')!
const configWarning = document.querySelector<HTMLElement>('#config-warning')!
const signInBtn = document.querySelector<HTMLButtonElement>('#sign-in-btn')!
const signOutBtn = document.querySelector<HTMLButtonElement>('#sign-out-btn')!
const pickFileBtn = document.querySelector<HTMLButtonElement>('#pick-file-btn')!
const userChip = document.querySelector<HTMLElement>('#user-chip')!
const userAvatar = document.querySelector<HTMLImageElement>('#user-avatar')!
const userName = document.querySelector<HTMLElement>('#user-name')!
const fileNameEl = document.querySelector<HTMLElement>('#file-name')!
const fileStatusEl = document.querySelector<HTMLElement>('#file-status')!
const welcome = document.querySelector<HTMLElement>('#welcome')!
const viewerHost = document.querySelector<HTMLElement>('#viewer-host')!
const viewerOverlay = document.querySelector<HTMLElement>('#viewer-overlay')!
const overlayLoading = document.querySelector<HTMLElement>('#overlay-loading')!
const overlayError = document.querySelector<HTMLElement>('#overlay-error')!
const overlayErrorText = document.querySelector<HTMLElement>('#overlay-error-text')!
const retryBtn = document.querySelector<HTMLButtonElement>('#retry-btn')!

const viewer = new CadEmbedViewer(viewerHost)
viewer.mount()

let selectedFile: DriveFile | null = null
let loadGeneration = 0

function show(el: HTMLElement, visible: boolean): void {
  el.hidden = !visible
}

function setFileLoadUi(state: FileLoadState, errorMessage = ''): void {
  const hasFile = Boolean(selectedFile)
  show(welcome, !hasFile && state === 'idle')

  if (selectedFile) {
    fileNameEl.textContent = selectedFile.name
    fileNameEl.title = selectedFile.name
  } else {
    fileNameEl.textContent = 'No file selected'
    fileNameEl.title = ''
  }

  if (state === 'ready') {
    show(fileStatusEl, false)
    fileStatusEl.textContent = ''
  } else if (state === 'error') {
    show(fileStatusEl, true)
    fileStatusEl.textContent = errorMessage
  } else if (state === 'loading') {
    show(fileStatusEl, true)
    fileStatusEl.textContent = 'Loading…'
  } else {
    show(fileStatusEl, false)
    fileStatusEl.textContent = ''
  }

  const showOverlay = hasFile && state !== 'ready'
  show(viewerOverlay, showOverlay)
  show(overlayLoading, showOverlay && state === 'loading')
  show(overlayError, showOverlay && state === 'error')
  if (state === 'error') {
    overlayErrorText.textContent = errorMessage
  }
}

function updateUserChip(): void {
  const { name, picture } = drive.userInfo
  if (name || picture) {
    show(userChip, true)
    userName.textContent = name
    if (picture) {
      userAvatar.src = picture
      userAvatar.alt = name
    } else {
      userAvatar.removeAttribute('src')
      userAvatar.alt = ''
    }
  } else {
    show(userChip, false)
  }
}

function updateConfigWarning(): void {
  if (!isConfigured) {
    configWarning.innerHTML =
      'Google API credentials are missing. For local dev, copy <code>env.example</code> to ' +
      '<code>.env.local</code> and set <code>VITE_GOOGLE_CLIENT_ID</code> and ' +
      '<code>VITE_GOOGLE_API_KEY</code>. For GitHub Pages, set repository secrets ' +
      '<code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_API_KEY</code>, then redeploy.'
    show(configWarning, true)
    return
  }

  if (!isPickerConfigured) {
    configWarning.innerHTML =
      'Google Picker needs the Cloud <strong>project number</strong>. For local dev set ' +
      '<code>VITE_GOOGLE_APP_ID</code> in <code>.env.local</code>. For GitHub Pages add secret ' +
      '<code>GOOGLE_APP_ID</code> (digits only), then redeploy.'
    show(configWarning, true)
    return
  }

  configWarning.textContent = ''
  show(configWarning, false)
}

function renderAuthState(): void {
  show(bootPanel, false)

  if (!drive.isAuthenticated) {
    show(authLayout, true)
    show(authPanel, true)
    show(workspacePanel, false)
    updateConfigWarning()
    signInBtn.disabled = !isConfigured
    return
  }

  show(authLayout, false)
  show(authPanel, false)
  show(workspacePanel, true)
  updateUserChip()
}

async function loadFileBuffer(file: DriveFile): Promise<void> {
  const generation = ++loadGeneration
  selectedFile = file
  viewer.clear()
  setFileLoadUi('loading')

  try {
    const buffer = await drive.getFileContent(file.id)
    if (generation !== loadGeneration) return
    viewer.open(file.name, buffer)
    setFileLoadUi('ready')
  } catch (error) {
    if (generation !== loadGeneration) return
    console.error('Error downloading file:', error)
    setFileLoadUi('error', 'Could not download this Google Drive file')
  }
}

async function refreshUserChipSoon(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    if (drive.userInfo.name || drive.userInfo.picture) {
      updateUserChip()
      return
    }
    await new Promise((r) => setTimeout(r, 100))
  }
}

async function handlePickFile(): Promise<void> {
  pickFileBtn.disabled = true
  try {
    const file = await drive.openFilePicker()
    await loadFileBuffer(file)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to open file picker'
    if (message !== 'Picker cancelled') {
      console.error(error)
      alert(message)
    }
    if (!selectedFile) {
      welcome.querySelector('p')!.textContent =
        'No file selected. Use “Choose from Google Drive” to open a drawing.'
      setFileLoadUi('idle')
    }
  } finally {
    pickFileBtn.disabled = false
  }
}

async function handleSignIn(): Promise<void> {
  signInBtn.disabled = true
  show(authLayout, true)
  show(bootPanel, true)
  show(authPanel, false)
  try {
    await drive.authenticate()
    renderAuthState()
    void refreshUserChipSoon()
    await handlePickFile()
  } catch (error) {
    console.error('Authentication failed:', error)
    alert(error instanceof Error ? error.message : 'Google Drive authorization failed')
    renderAuthState()
  } finally {
    signInBtn.disabled = !isConfigured
  }
}

function handleSignOut(): void {
  loadGeneration += 1
  selectedFile = null
  viewer.clear()
  setFileLoadUi('idle')
  drive.signOut()
  renderAuthState()
}

async function handleDriveAppOpen(): Promise<void> {
  const action = drive.parseDriveAppActionFromUrl()
  if (!action || action.action !== 'open') return

  show(authLayout, true)
  show(bootPanel, true)
  show(authPanel, false)
  show(workspacePanel, false)

  try {
    if (!drive.isAuthenticated) {
      await drive.authenticate()
    }
    renderAuthState()
    void refreshUserChipSoon()

    const details = await drive.getFileDetails(action.fileId)
    await loadFileBuffer(details)
  } catch (error) {
    console.error('Drive App open failed:', error)
    alert(error instanceof Error ? error.message : 'Failed to open Drive file')
    renderAuthState()
  }
}

signInBtn.addEventListener('click', () => {
  void handleSignIn()
})
signOutBtn.addEventListener('click', handleSignOut)
pickFileBtn.addEventListener('click', () => {
  void handlePickFile()
})
retryBtn.addEventListener('click', () => {
  if (selectedFile) void loadFileBuffer(selectedFile)
})

window.addEventListener('message', (event) => {
  if (event.origin !== 'https://drive.google.com') return
  if (event.data?.type !== 'drive-app-action') return
  const action = event.data.action
  if (action?.action === 'open' && action.fileId) {
    void (async () => {
      try {
        if (!drive.isAuthenticated) await drive.authenticate()
        renderAuthState()
        const details = await drive.getFileDetails(action.fileId)
        await loadFileBuffer(details)
      } catch (error) {
        console.error('Drive App message failed:', error)
      }
    })()
  }
})

async function boot(): Promise<void> {
  initSiteNav()
  show(authLayout, true)
  show(bootPanel, true)
  show(authPanel, false)
  show(workspacePanel, false)
  setFileLoadUi('idle')

  if (!isConfigured) {
    renderAuthState()
    return
  }

  try {
    await drive.initialize()
  } catch (error) {
    console.error('Failed to initialize Google APIs:', error)
  }

  const driveAction = drive.parseDriveAppActionFromUrl()
  if (driveAction) {
    await handleDriveAppOpen()
    return
  }

  renderAuthState()
}

void boot()
