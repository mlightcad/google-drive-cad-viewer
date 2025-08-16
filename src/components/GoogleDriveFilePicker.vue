<template>
  <div class="google-drive-picker">
    <el-card class="picker-card">
      <template #header>
        <div class="card-header">
          <el-icon><FolderOpened /></el-icon>
          <span>Select CAD File from Google Drive</span>
        </div>
      </template>
      
      <div class="picker-content">
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="Search for CAD files..."
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        
        <div class="file-list">
          <el-empty v-if="files.length === 0 && !isLoading" description="No CAD files found" />
          
          <el-skeleton v-if="isLoading" :rows="5" animated />
          
          <div v-else class="files-grid">
            <div
              v-for="file in files"
              :key="file.id"
              class="file-item"
              @click="selectFile(file)"
            >
              <div class="file-icon">
                <el-icon size="32" color="#409EFF">
                  <Document />
                </el-icon>
              </div>
              <div class="file-info">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-meta">
                  {{ formatFileSize(file.size) }} • {{ formatDate(file.modifiedTime) }}
                </div>
              </div>
              <div class="file-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click.stop="selectFile(file)"
                >
                  View
                </el-button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="pagination" v-if="files.length > 0">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="totalFiles"
            layout="prev, pager, next"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Document,FolderOpened, Search } from '@element-plus/icons-vue'
import { ElButton, ElCard, ElEmpty, ElIcon, ElInput, ElPagination,ElSkeleton } from 'element-plus'
import { onMounted, ref, watch } from 'vue'

import { useGoogleDrive } from '../composables/useGoogleDrive'

interface DriveFile {
  id: string
  name: string
  size: string
  modifiedTime: string
  mimeType: string
}

const emit = defineEmits<{
  fileSelected: [file: DriveFile]
}>()

const { searchFiles, isAuthenticated } = useGoogleDrive()

const searchQuery = ref('')
const files = ref<DriveFile[]>([])
const isLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const totalFiles = ref(0)

const supportedExtensions = ['.dwg', '.dxf']

const handleSearch = async () => {
  if (!isAuthenticated.value) return
  
  isLoading.value = true
  try {
    const query = searchQuery.value 
      ? `name contains '${searchQuery.value}' and (${supportedExtensions.map(ext => `name contains '${ext}'`).join(' or ')})`
      : `(${supportedExtensions.map(ext => `name contains '${ext}'`).join(' or ')})`
    
    const result = await searchFiles(query, currentPage.value, pageSize.value)
    files.value = result.files
    totalFiles.value = result.total
  } catch (error) {
    console.error('Error searching files:', error)
  } finally {
    isLoading.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  handleSearch()
}

const selectFile = (file: DriveFile) => {
  emit('fileSelected', file)
}

const formatFileSize = (size: string) => {
  const bytes = parseInt(size)
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  if (isAuthenticated.value) {
    handleSearch()
  }
})

watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    handleSearch()
  }
})
</script>

<style scoped>
.google-drive-picker {
  max-width: 800px;
  margin: 20px auto;
}

.picker-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.picker-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-bar {
  margin-bottom: 16px;
}

.file-list {
  min-height: 300px;
}

.files-grid {
  display: grid;
  gap: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-item:hover {
  border-color: #409EFF;
  background-color: #f0f9ff;
}

.file-icon {
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  font-size: 12px;
  color: #999;
}

.file-actions {
  flex-shrink: 0;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
