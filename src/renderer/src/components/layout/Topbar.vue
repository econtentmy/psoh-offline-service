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
              <img :src="logoUrl" alt="PSOH Logo" width="60" height="60" class="logo-img" />
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
            <a
              class="nav-link dropdown-toggle"
              href="#"
              @click.prevent="showUserMenu = !showUserMenu"
            >
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
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.sidebar-mini .topbar {
  left: var(--sidebar-mini-width);
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 1.5rem;
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
  padding: 0.5rem;
  border-radius: var(--border-radius);
  transition: background 0.2s;
}

.nav-toggler:hover {
  background: rgba(255, 255, 255, 0.1);
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

.logo-img {
  border-radius: var(--border-radius);
  transition: transform 0.2s;
}

.logo-img:hover {
  transform: scale(1.05);
}

.navbar-nav {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 1.25rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #fff;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: var(--border-radius);
  transition: all 0.2s;
  text-decoration: none;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  opacity: 1;
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.user-name {
  font-weight: 500;
  font-size: 0.9375rem;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 280px;
  background: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--box-shadow-lg);
  display: none;
  z-index: 1000;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  transform-origin: top right;
  animation: dropdownFade 0.2s ease;
}

@keyframes dropdownFade {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dropdown-menu.show {
  display: block;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--gray-50);
  border-radius: var(--border-radius);
  margin-bottom: 0.5rem;
}

.user-avatar-lg {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  background: var(--brand-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  color: #fff;
}

.user-info h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-900);
}

.user-info p {
  margin: 2px 0 0;
  font-size: 0.8125rem;
  color: var(--gray-500);
}

.dropdown-divider {
  height: 1px;
  margin: 0.5rem 0;
  background-color: var(--gray-100);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--gray-700);
  text-decoration: none;
  cursor: pointer;
  border-radius: var(--border-radius);
  font-size: 0.9375rem;
  transition: all 0.2s;
}

.dropdown-item:hover {
  background: var(--gray-50);
  color: var(--brand-primary);
}

.dropdown-item span[class^='ri-'] {
  font-size: 1.125rem;
  color: var(--gray-400);
}

.dropdown-item:hover span[class^='ri-'] {
  color: var(--brand-primary);
}

.dropdown-item.text-danger {
  color: var(--danger);
}

.dropdown-item.text-danger span {
  color: var(--danger);
}

.dropdown-item.text-danger:hover {
  background: var(--light-danger);
}
</style>
