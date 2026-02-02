<template>
  <div class="page-breadcrumb">
    <div class="align-self-center">
      <h4 class="page-title">{{ pageTitle }}</h4>
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <router-link to="/">Utama</router-link>
          </li>
          <li 
            v-for="(crumb, index) in breadcrumbs" 
            :key="index"
            class="breadcrumb-item"
            :class="{ active: index === breadcrumbs.length - 1 }"
          >
            <router-link v-if="crumb.to && index < breadcrumbs.length - 1" :to="crumb.to">
              {{ crumb.label }}
            </router-link>
            <span v-else>{{ crumb.label }}</span>
          </li>
        </ol>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

interface Breadcrumb {
  label: string
  to?: string
}

const route = useRoute()

const pageTitle = computed(() => {
  return (route.meta.title as string) || 'PSOH Offline'
})

const breadcrumbs = computed<Breadcrumb[]>(() => {
  const crumbs: Breadcrumb[] = []
  
  switch (route.name) {
    case 'dashboard':
      crumbs.push({ label: 'Dashboard' })
      break
    case 'settings':
      crumbs.push({ label: 'Tetapan API' })
      break
    case 'assignments':
      crumbs.push({ label: 'Tanda Pokok', to: '/assignments' })
      crumbs.push({ label: 'Senarai Tugasan' })
      break
    case 'recording':
      crumbs.push({ label: 'Tanda Pokok', to: '/assignments' })
      crumbs.push({ label: 'Senarai Tugasan', to: '/assignments' })
      crumbs.push({ label: 'Perekodan' })
      break
    case 'sync-status':
      crumbs.push({ label: 'Status Sinkronisasi' })
      break
    default:
      crumbs.push({ label: pageTitle.value })
  }
  
  return crumbs
})
</script>

<style scoped>
.page-breadcrumb {
  padding: 15px 30px;
  background: #fff;
  margin-bottom: 0;
}

.page-title {
  margin-bottom: 5px;
  font-size: 21px;
  color: var(--gray-800);
  font-weight: 500;
}

.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  padding: 0;
  margin-bottom: 0;
  list-style: none;
  background-color: transparent;
}

.breadcrumb-item + .breadcrumb-item {
  padding-left: 0.5rem;
}

.breadcrumb-item + .breadcrumb-item::before {
  display: inline-block;
  padding-right: 0.5rem;
  color: var(--gray-500);
  content: "/";
}

.breadcrumb-item a {
  color: var(--gray-600);
  text-decoration: none;
}

.breadcrumb-item a:hover {
  color: var(--primary);
}

.breadcrumb-item.active {
  color: var(--gray-500);
}
</style>
