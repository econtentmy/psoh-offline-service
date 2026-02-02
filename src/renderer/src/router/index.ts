import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'welcome',
      component: () => import('@/views/Welcome.vue'),
      meta: { title: 'Selamat Datang', requiresAuth: false, layout: 'blank' }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { title: 'Dashboard', requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/Settings.vue'),
      meta: { title: 'Tetapan API', requiresAuth: false }
    },
    {
      path: '/assignments',
      name: 'assignments',
      component: () => import('@/views/Assignments.vue'),
      meta: { title: 'Senarai Tugasan', requiresAuth: true }
    },
    {
      path: '/recording/:id',
      name: 'recording',
      component: () => import('@/views/Recording.vue'),
      meta: { title: 'Perekodan', requiresAuth: true }
    },
    {
      path: '/sync-status',
      name: 'sync-status',
      component: () => import('@/views/SyncStatus.vue'),
      meta: { title: 'Status Sinkronisasi', requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // Load settings if not loaded
  if (!authStore.settingsLoaded && to.name !== 'welcome') {
    await authStore.loadSettings()
  }
  
  // Check if route requires auth and user is not configured
  if (to.meta.requiresAuth && !authStore.isConfigured) {
    next({ name: 'settings' })
  } else {
    next()
  }
})

export default router
