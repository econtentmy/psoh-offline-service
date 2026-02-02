<template>
  <aside class="left-sidebar" :class="{ collapsed: collapsed }">
    <div class="scroll-sidebar">
      <nav class="sidebar-nav">
        <ul class="sidebar-menu">
          <!-- Dashboard -->
          <li class="sidebar-item">
            <router-link 
              to="/" 
              class="sidebar-link"
              :class="{ active: $route.name === 'dashboard' }"
            >
              <span class="ri-dashboard-line"></span>
              <span class="hide-menu">Dashboard</span>
            </router-link>
          </li>
          
          <!-- Tanda Pokok Section -->
          <li class="sidebar-item" v-if="isConfigured">
            <a 
              href="#" 
              class="sidebar-link has-arrow"
              :class="{ active: isTandaPokokActive }"
              @click.prevent="toggleTandaPokok"
            >
              <span class="ri-price-tag-3-line"></span>
              <span class="hide-menu">Tanda Pokok</span>
            </a>
            <ul class="sub-menu" :class="{ show: tandaPokokOpen }">
              <li class="sidebar-item">
                <router-link to="/assignments" class="sidebar-link">
                  <span class="ri-file-list-line"></span>
                  <span class="hide-menu">Senarai Tugasan</span>
                </router-link>
              </li>
            </ul>
          </li>
          
          <!-- Sync Status -->
          <li class="sidebar-item" v-if="isConfigured">
            <router-link 
              to="/sync-status" 
              class="sidebar-link"
              :class="{ active: $route.name === 'sync-status' }"
            >
              <span class="ri-refresh-line"></span>
              <span class="hide-menu">Status Sinkronisasi</span>
              <span class="badge bg-warning ms-auto" v-if="pendingCount > 0">
                {{ pendingCount }}
              </span>
            </router-link>
          </li>
          
          <!-- Settings -->
          <li class="sidebar-item">
            <router-link 
              to="/settings" 
              class="sidebar-link"
              :class="{ active: $route.name === 'settings' }"
            >
              <span class="ri-settings-line"></span>
              <span class="hide-menu">Tetapan</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSyncStore } from '@/stores/sync'

defineProps<{
  collapsed: boolean
}>()

const route = useRoute()
const authStore = useAuthStore()
const syncStore = useSyncStore()

const tandaPokokOpen = ref(true)

const isConfigured = computed(() => authStore.isConfigured)
const pendingCount = computed(() => syncStore.totalPending)

const isTandaPokokActive = computed(() => {
  return ['assignments', 'recording'].includes(route.name as string)
})

function toggleTandaPokok(): void {
  tandaPokokOpen.value = !tandaPokokOpen.value
}

onMounted(async () => {
  if (isConfigured.value) {
    await syncStore.fetchPendingRecords()
  }
})
</script>

<style scoped>
.left-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: #fff;
  box-shadow: 1px 0 10px rgba(0, 0, 0, 0.05);
  z-index: 101;
  transition: width 0.3s ease;
  overflow: hidden;
}

.left-sidebar.collapsed {
  width: var(--sidebar-mini-width);
}

.left-sidebar.collapsed .hide-menu {
  display: none;
}

.scroll-sidebar {
  height: 100%;
  overflow-y: auto;
  padding-top: calc(var(--topbar-height) + 20px);
}

.sidebar-nav {
  padding: 0 15px;
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-item {
  margin-bottom: 2px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 12px 15px;
  color: var(--gray-700);
  border-radius: 4px;
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 2px solid transparent;
}

.sidebar-link:hover {
  background-color: var(--sidebar-hover-bg);
  border-left-color: var(--sidebar-accent);
  color: #45598C;
  text-decoration: none;
}

.sidebar-link.active {
  background-color: var(--sidebar-hover-bg);
  border-left-color: var(--sidebar-accent);
  color: var(--sidebar-accent);
}

.sidebar-link span[class^="ri-"] {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.sidebar-link .hide-menu {
  flex: 1;
  white-space: nowrap;
}

.sidebar-link .badge {
  margin-left: auto;
}

.has-arrow::after {
  content: "›";
  margin-left: auto;
  transition: transform 0.2s ease;
}

.sub-menu {
  list-style: none;
  padding: 0 0 0 2rem;
  margin: 0;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.sub-menu.show {
  max-height: 200px;
}

.sub-menu .sidebar-link {
  padding: 10px 15px;
  font-size: 0.875rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 50px;
}

.bg-warning {
  background-color: var(--warning);
  color: #212529;
}
</style>
