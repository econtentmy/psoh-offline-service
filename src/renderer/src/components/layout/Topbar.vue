<template>
  <header class="topbar">
    <nav class="navbar">
      <div class="navbar-header">
        <!-- Mobile toggle -->
        <a class="nav-toggler" href="#" @click.prevent="$emit('toggle-sidebar')">
          <span class="ri-menu-line"></span>
        </a>
        
        <!-- Logo -->
        <div class="navbar-brand">
          <router-link to="/" class="logo">
            <span class="logo-text">
              <img 
                :src="logoUrl" 
                alt="PSOH Logo" 
                width="60" 
                height="60"
                class="logo-img"
              />
            </span>
          </router-link>
        </div>
      </div>
      
      <!-- Right side -->
      <div class="navbar-content">
        <ul class="navbar-nav">
          <!-- Sync Status -->
          <li class="nav-item">
            <SyncIndicator />
          </li>
          
          <!-- User dropdown -->
          <li class="nav-item dropdown" v-if="user">
            <a class="nav-link dropdown-toggle" href="#" @click.prevent="showUserMenu = !showUserMenu">
              <span class="user-avatar">
                <span class="ri-user-line"></span>
              </span>
              <span class="user-name">{{ user.name }}</span>
            </a>
            
            <div class="dropdown-menu" :class="{ show: showUserMenu }">
              <div class="user-header">
                <div class="user-avatar-lg">
                  <span class="ri-user-line"></span>
                </div>
                <div class="user-info">
                  <h4>{{ user.name }}</h4>
                  <p>{{ user.email }}</p>
                </div>
              </div>
              <div class="dropdown-divider"></div>
              <router-link to="/settings" class="dropdown-item" @click="showUserMenu = false">
                <span class="ri-settings-line"></span> Tetapan
              </router-link>
              <div class="dropdown-divider"></div>
              <a href="#" class="dropdown-item text-danger" @click.prevent="handleLogout">
                <span class="ri-logout-box-line"></span> Log Keluar
              </a>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SyncIndicator from '@/components/ui/SyncIndicator.vue'
import logoImage from '@/assets/images/PSOH_LOGO_Feb_2024.png'

defineEmits(['toggle-sidebar'])

const router = useRouter()
const authStore = useAuthStore()
const showUserMenu = ref(false)

const user = computed(() => authStore.user)
const logoUrl = logoImage

async function handleLogout(): Promise<void> {
  showUserMenu.value = false
  await authStore.logout()
  router.push('/settings')
}
</script>

<style scoped>
.topbar {
  position: fixed;
  top: 0;
  left: var(--sidebar-width);
  right: 0;
  height: var(--topbar-height);
  background-color: var(--brand-primary);
  z-index: 100;
  transition: left 0.3s ease;
}

.sidebar-mini .topbar {
  left: var(--sidebar-mini-width);
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}

.navbar-header {
  display: flex;
  align-items: center;
}

.nav-toggler {
  display: none;
  color: #fff;
  font-size: 1.5rem;
  margin-right: 1rem;
}

@media (max-width: 768px) {
  .nav-toggler {
    display: block;
  }
}

.navbar-brand {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-img {
  border-radius: 4px;
  background: #fff;
  padding: 2px;
}

.navbar-content {
  display: flex;
  align-items: center;
}

.navbar-nav {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 1rem;
}

.nav-item {
  position: relative;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
  padding: 0.5rem;
  cursor: pointer;
}

.nav-link:hover {
  text-decoration: none;
  opacity: 0.9;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.user-name {
  font-weight: 500;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 250px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: none;
  z-index: 1000;
}

.dropdown-menu.show {
  display: block;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--sidebar-hover-bg);
}

.user-avatar-lg {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--gray-600);
}

.user-info h4 {
  margin: 0;
  font-size: 1rem;
  color: var(--gray-800);
}

.user-info p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--gray-600);
}

.dropdown-divider {
  height: 0;
  margin: 0.5rem 0;
  overflow: hidden;
  border-top: 1px solid var(--gray-200);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: var(--gray-700);
  text-decoration: none;
  cursor: pointer;
}

.dropdown-item:hover {
  background: var(--gray-100);
}

.dropdown-item.text-danger {
  color: var(--danger);
}
</style>
