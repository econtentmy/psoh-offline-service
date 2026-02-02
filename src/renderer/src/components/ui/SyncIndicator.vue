<template>
  <div 
    class="sync-indicator" 
    :class="statusClass"
    :title="statusTitle"
  >
    <span class="dot"></span>
    <span class="status-text">{{ statusText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSyncStore } from '@/stores/sync'

const authStore = useAuthStore()
const syncStore = useSyncStore()

const isOnline = computed(() => authStore.isOnline)
const isSyncing = computed(() => syncStore.isSyncing)
const pendingCount = computed(() => syncStore.totalPending)

const statusClass = computed(() => {
  if (isSyncing.value) return 'syncing'
  if (isOnline.value) return 'online'
  return 'offline'
})

const statusText = computed(() => {
  if (isSyncing.value) return 'Menyinkronkan...'
  if (isOnline.value) {
    if (pendingCount.value > 0) {
      return `Dalam Talian (${pendingCount.value} belum disinkronkan)`
    }
    return 'Dalam Talian'
  }
  return 'Luar Talian'
})

const statusTitle = computed(() => {
  if (isSyncing.value) return 'Sinkronisasi sedang berjalan'
  if (isOnline.value) return 'Sambungan internet tersedia'
  return 'Tiada sambungan internet - data akan disimpan secara tempatan'
})
</script>

<style scoped>
.sync-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: default;
}

.sync-indicator.online {
  background-color: rgba(92, 184, 92, 0.2);
  color: #fff;
}

.sync-indicator.offline {
  background-color: rgba(217, 83, 79, 0.2);
  color: #fff;
}

.sync-indicator.syncing {
  background-color: rgba(91, 192, 222, 0.2);
  color: #fff;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sync-indicator.online .dot {
  background-color: #5cb85c;
}

.sync-indicator.offline .dot {
  background-color: #d9534f;
}

.sync-indicator.syncing .dot {
  background-color: #5bc0de;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { 
    opacity: 1;
    transform: scale(1);
  }
  50% { 
    opacity: 0.5;
    transform: scale(0.8);
  }
}

.status-text {
  white-space: nowrap;
}
</style>
