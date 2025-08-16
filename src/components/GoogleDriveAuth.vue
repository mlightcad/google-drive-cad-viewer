<template>
  <div class="google-drive-auth">
    <el-card class="auth-card">
      <template #header>
        <div class="card-header">
          <el-icon><FolderOpened /></el-icon>
          <span>Google Drive Integration</span>
        </div>
      </template>
      
      <div class="auth-content">
        <div v-if="!isAuthenticated" class="auth-prompt">
          <p>Connect to Google Drive to view CAD files directly from your Drive.</p>
          <el-button 
            type="primary" 
            size="large" 
            @click="authenticate"
            :loading="isLoading"
            class="auth-button"
          >
            <el-icon><FolderOpened /></el-icon>
            Connect Google Drive
          </el-button>
        </div>
        
        <div v-else class="auth-success">
          <el-alert
            title="Connected to Google Drive"
            type="success"
            :closable="false"
            show-icon
          />
          <div class="user-info">
            <el-avatar :src="userInfo.picture" :size="40" />
            <span class="user-name">{{ userInfo.name }}</span>
            <el-button size="small" @click="signOut" type="danger" text>
              Sign Out
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { FolderOpened } from '@element-plus/icons-vue'
import { ElAlert, ElAvatar,ElButton, ElCard, ElIcon } from 'element-plus'

import { useGoogleDrive } from '../composables/useGoogleDrive'

const { 
  isAuthenticated, 
  isLoading, 
  userInfo, 
  authenticate, 
  signOut 
} = useGoogleDrive()
</script>

<style scoped>
.google-drive-auth {
  max-width: 500px;
  margin: 20px auto;
}

.auth-card {
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

.auth-content {
  text-align: center;
}

.auth-prompt p {
  margin-bottom: 20px;
  color: #666;
  line-height: 1.5;
}

.auth-button {
  padding: 12px 24px;
  font-size: 16px;
}

.auth-success {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.user-name {
  font-weight: 500;
  color: #333;
}
</style>
