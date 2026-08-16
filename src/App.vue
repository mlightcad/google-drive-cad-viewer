<template>
  <div id="app-root">
    <div class="app-header">
      <h1>Google Drive CAD Viewer</h1>
      <p>View CAD files directly from your Google Drive</p>
    </div>

    <div class="app-content">
      <!-- Loading state -->
      <div v-if="isLoading" class="loading-container">
        <el-card class="loading-card">
          <div class="loading-content">
            <el-icon class="loading-icon" size="48"><Loading /></el-icon>
            <p>Loading CAD file from Google Drive...</p>
          </div>
        </el-card>
      </div>

      <!-- Drive App Mode - File opened from Google Drive -->
      <div v-else-if="currentFile && isAuthenticated" class="drive-app-mode">
        <div class="file-header">
          <div class="file-info">
            <h2>{{ currentFile.name }}</h2>
            <p>Opened from Google Drive</p>
          </div>
          <div class="file-actions">
            <el-button @click="signOut" type="danger" text>
              Sign Out
            </el-button>
          </div>
        </div>
        
        <div class="cad-viewer-container">
          <CadEmbedViewer
            v-if="currentFile"
            :file-name="currentFile.name"
            :buffer="fileBuffer"
            :title="currentFile.name"
          />
          <div v-if="fileLoadState !== 'ready'" class="viewer-overlay">
            <template v-if="fileLoadState === 'error'">
              <el-empty :description="fileLoadError">
                <el-button type="primary" @click="retryLoadFile">Retry</el-button>
              </el-empty>
            </template>
            <template v-else>
              <el-icon class="loading-icon" size="32"><Loading /></el-icon>
              <p>Loading file content...</p>
            </template>
          </div>
        </div>
      </div>

      <!-- Standard Mode - File Browser -->
      <div v-else class="standard-mode">
        <!-- Google Drive Authentication -->
        <GoogleDriveAuth v-if="!isAuthenticated" />
        
        <!-- File Picker and Viewer -->
        <div v-else class="viewer-container">
          <div class="sidebar">
            <GoogleDriveFilePicker @file-selected="handleFileSelected" />
          </div>
          
          <div class="viewer-main">
            <div v-if="selectedFile" class="file-info">
              <h3>{{ selectedFile.name }}</h3>
              <p>{{ fileStatusText }}</p>
            </div>
            
            <div v-if="selectedFile" class="cad-viewer">
              <CadEmbedViewer
                :file-name="selectedFile.name"
                :buffer="fileBuffer"
                :title="selectedFile.name"
              />
              <div v-if="fileLoadState !== 'ready'" class="viewer-overlay">
                <template v-if="fileLoadState === 'error'">
                  <el-empty :description="fileLoadError">
                    <el-button type="primary" @click="retryLoadFile">Retry</el-button>
                  </el-empty>
                </template>
                <template v-else>
                  <el-icon class="loading-icon" size="32"><Loading /></el-icon>
                  <p>Loading file from Google Drive...</p>
                </template>
              </div>
            </div>
            
            <div v-else-if="isAuthenticated && !selectedFile" class="welcome-message">
              <el-empty description="Select a CAD file from Google Drive to view it" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref, watch } from 'vue'

import CadEmbedViewer from './components/CadEmbedViewer.vue'
import GoogleDriveAuth from './components/GoogleDriveAuth.vue'
import GoogleDriveFilePicker from './components/GoogleDriveFilePicker.vue'
import { useGoogleDrive } from './composables/useGoogleDrive'

interface DriveFile {
  id: string
  name: string
  size: string
  modifiedTime: string
  mimeType: string
}

type FileLoadState = 'idle' | 'loading' | 'ready' | 'error'

const { 
  isAuthenticated, 
  isLoading, 
  currentFile, 
  getFileContent, 
  signOut 
} = useGoogleDrive()

const selectedFile = ref<DriveFile | null>(null)
const fileBuffer = ref<ArrayBuffer | null>(null)
const fileLoadState = ref<FileLoadState>('idle')
const fileLoadError = ref('')
let loadGeneration = 0

const fileStatusText = computed(() => {
  if (fileLoadState.value === 'ready') return 'Opened in MLightCAD viewer'
  if (fileLoadState.value === 'error') return fileLoadError.value
  return 'Loading file from Google Drive...'
})

const loadFileBuffer = async (fileId: string) => {
  const generation = ++loadGeneration
  fileBuffer.value = null
  fileLoadState.value = 'loading'
  fileLoadError.value = ''

  try {
    const buffer = await getFileContent(fileId)
    if (generation !== loadGeneration) return
    fileBuffer.value = buffer
    fileLoadState.value = 'ready'
  } catch (error) {
    if (generation !== loadGeneration) return
    console.error('Error downloading file:', error)
    fileLoadState.value = 'error'
    fileLoadError.value = 'Could not download this Google Drive file'
    ElMessage.error(fileLoadError.value)
  }
}

const retryLoadFile = async () => {
  const file = currentFile.value || selectedFile.value
  if (file) await loadFileBuffer(file.id)
}

const handleFileSelected = async (file: DriveFile) => {
  selectedFile.value = file
  await loadFileBuffer(file.id)
}

watch(currentFile, async (file) => {
  if (file) await loadFileBuffer(file.id)
}, { immediate: true })
</script>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
}
</style>

<style scoped>
#app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
  text-align: center;
  padding: 40px 20px;
  color: white;
}

.app-header h1 {
  margin: 0 0 10px 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.app-header p {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.app-content {
  flex: 1;
  padding: 0 20px 40px;
}

/* Loading State */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-card {
  max-width: 400px;
  text-align: center;
}

.loading-content {
  padding: 40px;
}

.loading-icon {
  color: #409EFF;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Drive App Mode */
.drive-app-mode {
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #f8f9fa;
}

.file-info h2 {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 1.5rem;
}

.file-info p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.cad-viewer-container {
  min-height: 600px;
  height: calc(100vh - 260px);
  position: relative;
}

.viewer-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.92);
  color: #666;
}

/* Standard Mode */
.standard-mode {
  /* Existing styles for file browser mode */
}

.viewer-container {
  display: flex;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.sidebar {
  width: 400px;
  border-right: 1px solid #e4e7ed;
  background: #f8f9fa;
}

.viewer-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 600px;
}

.file-info {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #f8f9fa;
}

.file-info h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.file-info p {
  margin: 0;
  color: #666;
}

.cad-viewer {
  flex: 1;
  position: relative;
  min-height: 600px;
}

.welcome-message {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

/* Responsive design */
@media (max-width: 1024px) {
  .viewer-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .file-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .app-header h1 {
    font-size: 2rem;
  }
  
  .app-content {
    padding: 0 10px 20px;
  }
  
  .viewer-container,
  .drive-app-mode {
    margin: 0 10px;
  }
}
</style>
