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
              class="sidebar-link"
              :class="{ active: isTandaPokokActive, 'menu-open': tandaPokokOpen }"
              @click.prevent="toggleTandaPokok"
            >
              <span class="ri-price-tag-3-line"></span>
              <span class="hide-menu">Tanda Pokok</span>
              <span class="ri-arrow-right-s-line ms-auto sidebar-arrow"></span>
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
  background: var(--sidebar-bg);
  box-shadow: 1px 0 12px rgba(0, 0, 0, 0.03);
  z-index: 101;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  border-right: 1px solid var(--border-color);
}

.left-sidebar.collapsed {
  width: var(--sidebar-mini-width);
}

.scroll-sidebar {
  height: 100%;
  overflow-y: auto;
  padding-top: calc(var(--topbar-height) + 1.25rem);
}

.sidebar-nav {
  padding: 0 0.75rem;
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-item {
  margin-bottom: 0.25rem;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.75rem 1rem;
  color: var(--gray-600);
  border-radius: var(--border-radius);
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 2px solid transparent;
  font-weight: 500;
  font-size: 0.9375rem;
}

.sidebar-link:hover {
  background-color: var(--sidebar-hover);
  color: var(--brand-primary);
  text-decoration: none;
}

.sidebar-link.active {
  background-color: var(--light-info);
  color: var(--brand-primary);
  border-left-color: var(--brand-primary);
}

.sidebar-link span[class^='ri-'] {
  font-size: 1.35rem;
  flex-shrink: 0;
  transition: color 0.2s;
}

.sidebar-link:hover span[class^='ri-'],
.sidebar-link.active span[class^='ri-'] {
  color: var(--brand-primary);
}

.sidebar-link .hide-menu {
  flex: 1;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.2s;
}

.collapsed .hide-menu {
  opacity: 0;
  pointer-events: none;
}

.sidebar-link .badge {
  margin-left: auto;
}

.sidebar-link .badge {
  margin-left: auto;
}

.sidebar-arrow {
  transition: transform 0.3s ease;
  font-size: 1.1rem;
}

.menu-open .sidebar-arrow {
  transform: rotate(90deg);
}

.sub-menu {
  list-style: none;
  padding: 0 0 0 1.25rem;
  margin: 0.25rem 0;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sub-menu.show {
  max-height: 250px;
}

.sub-menu .sidebar-link {
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 400;
}

.sub-menu .sidebar-link.router-link-active {
  background-color: var(--gray-50);
  color: var(--brand-primary);
  font-weight: 500;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 6px;
  line-height: 1;
}

.bg-warning {
  background-color: var(--warning);
  color: var(--gray-900);
}
</style>
