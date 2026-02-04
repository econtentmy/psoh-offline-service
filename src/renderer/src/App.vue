<template>
  <div id="main-wrapper" :class="{ 'sidebar-mini': sidebarCollapsed }">
    <!-- Modern Preloader -->
    <Transition name="fade">
      <div v-if="loading && route.name !== 'welcome'" class="preloader">
        <div class="loader-content">
          <div class="spinner-pulse"></div>
          <p class="loader-text">Memuatkan PSOH...</p>
        </div>
      </div>
    </Transition>

    <!-- Show login if not configured or blank layout -->
    <template v-if="!isConfigured || route.meta.layout === 'blank'">
      <router-view v-slot="{ Component }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </template>

    <!-- Main layout when configured -->
    <template v-else>
      <Topbar @toggle-sidebar="toggleSidebar" />
      <Sidebar :collapsed="sidebarCollapsed" />
      <div class="page-wrapper">
        <Breadcrumb />
        <div class="container-fluid">
          <router-view v-slot="{ Component }">
            <Transition name="page-fade" mode="out-in">
              <component :is="Component" />
            </Transition>
          </router-view>
        </div>
        <Footer />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Topbar from '@/components/layout/Topbar.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Breadcrumb from '@/components/layout/Breadcrumb.vue'
import Footer from '@/components/layout/Footer.vue'

const route = useRoute()
const authStore = useAuthStore()
const loading = ref(true)
const sidebarCollapsed = ref(false)

const isConfigured = computed(() => authStore.isConfigured)

function toggleSidebar(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

onMounted(async () => {
  await authStore.loadSettings()

  // Setup network status listener
  window.api.onNetworkStatus((status) => {
    authStore.setNetworkStatus(status)
  })

  // Get initial network status
  const networkStatus = await window.api.getNetworkStatus()
  authStore.setNetworkStatus(networkStatus)

  // Slight delay to prevent flickering
  setTimeout(() => {
    loading.value = false
  }, 500)
})
</script>

<style>
/* Global Styles Improvements */
body {
  margin: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.preloader {
  position: fixed;
  z-index: 50000;
  inset: 0;
  background: var(--white);
  display: flex;
  justify-content: center;
  align-items: center;
}

.loader-content {
  text-align: center;
}

.spinner-pulse {
  width: 48px;
  height: 48px;
  background: var(--brand-primary);
  border-radius: 50%;
  margin: 0 auto 1.5rem;
  animation: pulse-out 1.2s infinite ease-in-out;
}

.loader-text {
  font-weight: 500;
  color: var(--gray-700);
  letter-spacing: 0.025em;
}

@keyframes pulse-out {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: all 0.25s ease-out;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

#main-wrapper {
  background-color: var(--body-bg);
}

.page-wrapper {
  padding-bottom: 30px;
  min-height: 100vh;
  margin-left: var(--sidebar-width);
  transition: margin-left 0.3s ease;
}

.sidebar-mini .page-wrapper {
  margin-left: var(--sidebar-mini-width);
}

.container-fluid {
  padding: 0 30px 25px;
}
</style>
