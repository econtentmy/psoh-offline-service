<template>
  <div class="welcome-container">
    <div class="welcome-content animate__animated animate__fadeIn">
      <img :src="psohLogo" alt="PSOH Logo" class="logo mb-4" />
      
      <div class="welcome-text mb-4">
        <h3 class="welcome-title">Selamat Datang ke</h3>
        <h4 class="welcome-subtitle">Sistem Pendigitalan Operasi Hutan</h4>
        <h5 class="welcome-mode">(Luar Talian)</h5>
      </div>

      <div class="loading-bar mt-2">
        <div class="progress"></div>
      </div>
      <p class="text-muted mt-2">Sedang memuatkan aplikasi...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import psohLogo from '@/assets/images/PSOH_LOGO_Feb_2024.png'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  const timerPromise = new Promise(resolve => setTimeout(resolve, 5000))
  
  if (!authStore.settingsLoaded) {
    await authStore.loadSettings()
  }
  
  await timerPromise
  
  if (authStore.isConfigured) {
    router.push({ name: 'dashboard' })
  } else {
    router.push({ name: 'settings' })
  }
})
</script>

<style scoped>
.welcome-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
}

.welcome-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo {
  max-width: 300px;
  height: auto;
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.welcome-subtitle {
  font-size: 20px;
  font-weight: 500;
  color: #34495e;
  margin-bottom: 6px;
}

.welcome-mode {
  font-size: 16px;
  font-weight: 400;
  color: #7f8c8d;
  margin-bottom: 0;
}

.loading-bar {
  width: 200px;
  height: 4px;
  background-color: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress {
  width: 100%;
  height: 100%;
  background-color: #137eff;
  animation: progress 2.5s ease-in-out;
  transform-origin: left;
}

@keyframes progress {
  0% {
    transform: scaleX(0);
  }
  100% {
    transform: scaleX(1);
  }
}
</style>
