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
          <MlCadViewer
            v-if="fileUrl"
            locale="en"
            canvas-id="canvas"
            :url="fileUrl"
          />
          <div v-else class="viewer-loading">
            <el-icon class="loading-icon" size="32"><Loading /></el-icon>
            <p>Loading file content...</p>
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
              <p>Loading file from Google Drive...</p>
            </div>
            
            <div v-if="fileUrl" class="cad-viewer">
              <MlCadViewer
                locale="en"
                canvas-id="canvas"
                :url="fileUrl"
              />
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
import { AcApSettingManager } from '@mlightcad/cad-simple-viewer'
import { MlCadViewer } from '@mlightcad/cad-viewer'
import { ref, watch } from 'vue'

import GoogleDriveAuth from './components/GoogleDriveAuth.vue'
import GoogleDriveFilePicker from './components/GoogleDriveFilePicker.vue'
import { useGoogleDrive } from './composables/useGoogleDrive'

// Configure CAD viewer settings
AcApSettingManager.instance.isShowCommandLine = false

interface DriveFile {
  id: string
  name: string
  size: string
  modifiedTime: string
  mimeType: string
}

const { 
  isAuthenticated, 
  isLoading, 
  currentFile, 
  getFileDownloadUrl, 
  signOut 
} = useGoogleDrive()

const selectedFile = ref<DriveFile | null>(null)
const fileUrl = ref<string>('')

const handleFileSelected = async (file: DriveFile) => {
  selectedFile.value = file
  fileUrl.value = ''
  
  try {
    // Get the download URL for the file
    const downloadUrl = await getFileDownloadUrl(file.id)
    fileUrl.value = downloadUrl
  } catch (error) {
    console.error('Error getting file URL:', error)
    // Fallback to a demo file if there's an error
    fileUrl.value = 'https://cdn.jsdelivr.net/gh/mlight-lee/cad-data/data/anteen.dwg'
  }
}

// Watch for current file changes (Drive App mode)
watch(currentFile, async (file) => {
  if (file) {
    fileUrl.value = ''
    try {
      const downloadUrl = await getFileDownloadUrl(file.id)
      fileUrl.value = downloadUrl
    } catch (error) {
      console.error('Error getting file URL:', error)
      // Fallback to a demo file if there's an error
      fileUrl.value = 'https://cdn.jsdelivr.net/gh/mlight-lee/cad-data/data/anteen.dwg'
    }
  }
}, { immediate: true })
</script>

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
  position: relative;
}

.viewer-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
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
