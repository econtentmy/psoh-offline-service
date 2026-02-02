<template>
  <div class="sync-status-page">
    <div class="row py-3">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h4 class="mb-0 text-uppercase">Status Sinkronisasi</h4>
          <button
            class="btn btn-rounded btn-info"
            @click="handleSync"
            :disabled="!isOnline || isSyncing || !hasPending"
          >
            <span class="ri-refresh-line" :class="{ spin: isSyncing }"></span>
            {{ isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang' }}
          </button>
        </div>

        <!-- Stats -->
        <div class="row mb-4">
          <div class="col-4">
            <div class="stat-card info">
              <div class="stat-value">{{ syncStatus.synced }}</div>
              <div class="stat-label">Telah Disinkronkan</div>
            </div>
          </div>
          <div class="col-4">
            <div class="stat-card warning">
              <div class="stat-value">{{ syncStatus.pending }}</div>
              <div class="stat-label">Menunggu Sinkronisasi</div>
            </div>
          </div>
          <div class="col-4">
            <div class="stat-card" :class="isOnline ? 'success' : 'danger'">
              <div class="stat-value">{{ isOnline ? 'Aktif' : 'Tiada' }}</div>
              <div class="stat-label">Sambungan Internet</div>
            </div>
          </div>
        </div>

        <!-- Pending Records -->
        <div class="card border-bottom border-info shadow">
          <div class="card-body">
            <h5 class="mb-3">Rekod Menunggu Sinkronisasi</h5>

            <!-- Progress Bar (when syncing) -->
            <div v-if="isSyncing" class="mb-4">
              <div class="progress-info mb-2">
                <span>Menyinkronkan rekod...</span>
                <span>{{ syncProgress.current }} / {{ syncProgress.total }}</span>
              </div>
              <div class="progress">
                <div
                  class="progress-bar"
                  :style="{ width: progressPercent + '%' }"
                ></div>
              </div>
            </div>

            <!-- Pending Tags -->
            <div class="pending-section mb-3">
              <h6>
                <span class="ri-price-tag-3-line"></span> Tag Pokok
                <span class="badge bg-warning ms-2">{{ pendingRecords.tags.length }}</span>
              </h6>
              <div v-if="pendingRecords.tags.length === 0" class="text-muted">
                Tiada rekod menunggu
              </div>
              <ul v-else class="pending-list">
                <li v-for="tag in pendingRecords.tags.slice(0, 5)" :key="tag.id">
                  Tag #{{ tag.no_tag }} - {{ tag.jenis_tag }} 
                  <small class="text-muted">({{ formatDate(tag.recorded_at) }})</small>
                </li>
                <li v-if="pendingRecords.tags.length > 5" class="text-muted">
                  ... dan {{ pendingRecords.tags.length - 5 }} rekod lagi
                </li>
              </ul>
            </div>

            <!-- Pending Lokasi -->
            <div class="pending-section mb-3">
              <h6>
                <span class="ri-map-pin-line"></span> Lokasi Penandaan
                <span class="badge bg-warning ms-2">{{ pendingRecords.lokasi.length }}</span>
              </h6>
              <div v-if="pendingRecords.lokasi.length === 0" class="text-muted">
                Tiada rekod menunggu
              </div>
              <ul v-else class="pending-list">
                <li v-for="lok in pendingRecords.lokasi.slice(0, 5)" :key="lok.id">
                  {{ lok.tarikh }}
                  <small class="text-muted">({{ formatDate(lok.recorded_at) }})</small>
                </li>
                <li v-if="pendingRecords.lokasi.length > 5" class="text-muted">
                  ... dan {{ pendingRecords.lokasi.length - 5 }} rekod lagi
                </li>
              </ul>
            </div>

            <!-- Pending Aktiviti -->
            <div class="pending-section">
              <h6>
                <span class="ri-calendar-line"></span> Aktiviti Penandaan
                <span class="badge bg-warning ms-2">{{ pendingRecords.aktiviti.length }}</span>
              </h6>
              <div v-if="pendingRecords.aktiviti.length === 0" class="text-muted">
                Tiada rekod menunggu
              </div>
              <ul v-else class="pending-list">
                <li v-for="akt in pendingRecords.aktiviti.slice(0, 5)" :key="akt.id">
                  {{ akt.aktiviti }} - {{ akt.tarikh }}
                  <small class="text-muted">({{ formatDate(akt.recorded_at) }})</small>
                </li>
                <li v-if="pendingRecords.aktiviti.length > 5" class="text-muted">
                  ... dan {{ pendingRecords.aktiviti.length - 5 }} rekod lagi
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Last Sync Info -->
        <div class="card border-bottom border-info shadow mt-4">
          <div class="card-body">
            <h5 class="mb-3">Maklumat Sinkronisasi</h5>
            <div class="info-row">
              <span class="info-label">Sinkronisasi Terakhir:</span>
              <span class="info-value">{{ lastSyncFormatted }}</span>
            </div>
            <div v-if="syncStore.error" class="alert alert-danger mt-3 mb-0">
              <span class="ri-error-warning-line"></span>
              {{ syncStore.error }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSyncStore } from '@/stores/sync'

const authStore = useAuthStore()
const syncStore = useSyncStore()

const isOnline = computed(() => authStore.isOnline)
const isSyncing = computed(() => syncStore.isSyncing)
const syncStatus = computed(() => syncStore.status)
const syncProgress = computed(() => syncStore.syncProgress)
const pendingRecords = computed(() => syncStore.pendingRecords)
const hasPending = computed(() => syncStore.hasPendingRecords)

const progressPercent = computed(() => {
  if (syncProgress.value.total === 0) return 0
  return Math.round((syncProgress.value.current / syncProgress.value.total) * 100)
})

const lastSyncFormatted = computed(() => {
  if (!syncStatus.value.lastSync) return 'Belum pernah'
  const date = new Date(syncStatus.value.lastSync)
  return date.toLocaleString('ms-MY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('ms-MY', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function handleSync(): Promise<void> {
  if (!isOnline.value || isSyncing.value) return
  await syncStore.pushData()
}

onMounted(async () => {
  await syncStore.fetchSyncStatus()
  await syncStore.fetchPendingRecords()
  syncStore.setupListeners()
})
</script>

<style scoped>
.sync-status-page {
  min-height: 400px;
}

.stat-card {
  padding: 1.5rem;
  border-radius: 8px;
  color: #fff;
  text-align: center;
}

.stat-card.info {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
}

.stat-card.warning {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
}

.stat-card.success {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
}

.stat-card.danger {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--gray-600);
}

.progress {
  height: 8px;
  background-color: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: var(--info);
  transition: width 0.3s ease;
}

.pending-section h6 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: var(--gray-700);
}

.pending-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.pending-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--gray-200);
  font-size: 0.875rem;
}

.pending-list li:last-child {
  border-bottom: none;
}

.info-row {
  display: flex;
  gap: 1rem;
}

.info-label {
  color: var(--gray-600);
}

.info-value {
  font-weight: 500;
  color: var(--gray-800);
}
</style>
