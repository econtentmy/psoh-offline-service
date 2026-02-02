<template>
  <div id="main-wrapper" :class="{ 'sidebar-mini': sidebarCollapsed }">
    <!-- Preloader -->
    <div v-if="loading && route.name !== 'welcome'" class="preloader">
      <svg
        class="tea lds-ripple"
        width="37"
        height="48"
        viewBox="0 0 37 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M27.0819 17H3.02508C1.91076 17 1.01376 17.9059 1.0485 19.0197C1.15761 22.5177 1.49703 29.7374 2.5 34C4.07125 40.6778 7.18553 44.8868 8.44856 46.3845C8.79051 46.79 9.29799 47 9.82843 47H20.0218C20.639 47 21.2193 46.7159 21.5659 46.2052C22.6765 44.5687 25.2312 40.4282 27.5 34C28.9757 29.8188 29.084 22.4043 29.0441 18.9156C29.0319 17.8436 28.1539 17 27.0819 17Z"
          stroke="#233242"
          stroke-width="2"
        ></path>
        <path
          d="M29 23.5C29 23.5 34.5 20.5 35.5 25.4999C36.0986 28.4926 34.2033 31.5383 32 32.8713C29.4555 34.4108 28 34 28 34"
          stroke="#233242"
          stroke-width="2"
        ></path>
        <path
          id="teabag"
          fill="#233242"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M16 25V17H14V25H12C10.3431 25 9 26.3431 9 28V34C9 35.6569 10.3431 37 12 37H18C19.6569 37 21 35.6569 21 34V28C21 26.3431 19.6569 25 18 25H16ZM11 28C11 27.4477 11.4477 27 12 27H18C18.5523 27 19 27.4477 19 28V34C19 34.5523 18.5523 35 18 35H12C11.4477 35 11 34.5523 11 34V28Z"
        ></path>
        <path
          id="steamL"
          d="M17 1C17 1 17 4.5 14 6.5C11 8.5 11 12 11 12"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke="#233242"
        ></path>
        <path
          id="steamR"
          d="M21 6C21 6 21 8.22727 19 9.5C17 10.7727 17 13 17 13"
          stroke="#233242"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></path>
      </svg>
    </div>

    <!-- Show login if not configured or blank layout -->
    <template v-if="!isConfigured || route.meta.layout === 'blank'">
      <router-view />
    </template>

    <!-- Main layout when configured -->
    <template v-else>
      <Topbar @toggle-sidebar="toggleSidebar" />
      <Sidebar :collapsed="sidebarCollapsed" />
      <div class="page-wrapper">
        <Breadcrumb />
        <div class="container-fluid">
          <router-view />
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
  
  loading.value = false
})
</script>

<style>
.preloader {
  position: fixed;
  z-index: 50000;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
}

.tea {
  animation: steam 1s ease-in-out infinite;
}

@keyframes steam {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

#teabag {
  animation: teabag 2s ease-in-out infinite;
}

@keyframes teabag {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-3px) rotate(3deg);
  }
}

#steamL, #steamR {
  animation: steamAnim 2s ease-in-out infinite;
  opacity: 0.7;
}

#steamR {
  animation-delay: 0.5s;
}

@keyframes steamAnim {
  0%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  50% {
    opacity: 0.8;
    transform: translateY(-2px);
  }
}
</style>
