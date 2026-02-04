<template>
  <div class="sync-status-page p-2">
    <div class="d-flex align-items-center justify-content-between mb-4 mt-2">
      <div>
        <h4 class="mb-1 text-uppercase fw-bold text-dark">Status Sinkronisasi</h4>
        <p class="text-muted small mb-0">
          Pantau status pemindahan data antara peranti dan pelayan pusat.
        </p>
      </div>
      <button
        class="btn btn-primary d-flex align-items-center gap-2 px-3"
        @click="handleSync"
        :disabled="!isOnline || isSyncing || !hasPending"
      >
        <span :class="['ri-refresh-line', { spin: isSyncing }]"></span>
        {{ isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang' }}
      </button>
    </div>

    <!-- Stats Row -->
    <div class="row g-4 mb-4">
      <div class="col-4">
        <div class="stat-card sync-success">
          <div class="stat-icon">
            <span class="ri-checkbox-circle-line"></span>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{ syncStatus.synced }}</div>
            <div class="stat-label">Telah Disinkronkan</div>
          </div>
        </div>
      </div>
      <div class="col-4">
        <div class="stat-card sync-pending">
          <div class="stat-icon">
            <span class="ri-time-line"></span>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{ syncStatus.pending }}</div>
            <div class="stat-label">Menunggu Sinkronisasi</div>
          </div>
        </div>
      </div>
      <div class="col-4">
        <div :class="['stat-card', isOnline ? 'conn-active' : 'conn-inactive']">
          <div class="stat-icon">
            <span :class="isOnline ? 'ri-wifi-line' : 'ri-wifi-off-line'"></span>
          </div>
          <div class="stat-details">
            <div class="stat-value fs-4">{{ isOnline ? 'AKTIF' : 'TIADA' }}</div>
            <div class="stat-label">Sambungan Internet</div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <!-- Pending Records -->
      <div class="col-8">
        <div class="card border-0 shadow-sm">
          <div class="card-body p-4">
            <div class="d-flex align-items-center gap-2 mb-4">
              <span class="ri-database-2-line text-primary fs-5"></span>
              <h6 class="mb-0 fw-bold">Rekod Menunggu Sinkronisasi</h6>
            </div>

            <!-- Progress Bar (when syncing) -->
            <Transition name="fade">
              <div v-if="isSyncing" class="sync-progress-container mb-4">
                <div class="d-flex justify-content-between mb-2">
                  <span class="small fw-medium text-primary">Menghantar data ke pelayan...</span>
                  <span class="small fw-bold"
                    >{{ syncProgress.current }} / {{ syncProgress.total }}</span
                  >
                </div>
                <div class="progress" style="height: 10px">
                  <div
                    class="progress-bar progress-bar-striped progress-bar-animated"
                    :style="{ width: progressPercent + '%' }"
                  ></div>
                </div>
              </div>
            </Transition>

            <!-- Record Sections -->
            <div class="pending-grid">
              <!-- Tag Pokok -->
              <div class="pending-section border rounded-3 p-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div class="d-flex align-items-center gap-2">
                    <span class="ri-price-tag-3-line text-primary"></span>
                    <span class="fw-bold small text-dark">Tag Pokok</span>
                  </div>
                  <span class="badge bg-warning-subtle text-warning-emphasis rounded-pill px-3">{{
                    pendingRecords.tags.length
                  }}</span>
                </div>
                <div v-if="pendingRecords.tags.length === 0" class="empty-state">
                  <p class="text-muted small mb-0 mt-1">Tiada rekod menunggu</p>
                </div>
                <ul v-else class="list-unstyled mb-0 pending-list">
                  <li
                    v-for="tag in pendingRecords.tags.slice(0, 3)"
                    :key="tag.id"
                    class="small py-2 border-bottom"
                  >
                    <div class="d-flex justify-content-between">
                      <span class="text-dark fw-medium">Tag #{{ tag.no_tag }}</span>
                      <span class="text-muted">{{ formatDate(tag.recorded_at) }}</span>
                    </div>
                  </li>
                  <li v-if="pendingRecords.tags.length > 3" class="pt-2 text-center">
                    <small class="text-primary fw-medium"
                      >+ {{ pendingRecords.tags.length - 3 }} rekod lagi</small
                    >
                  </li>
                </ul>
              </div>

              <!-- Lokasi -->
              <div class="pending-section border rounded-3 p-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div class="d-flex align-items-center gap-2">
                    <span class="ri-map-pin-line text-primary"></span>
                    <span class="fw-bold small text-dark">Lokasi Penandaan</span>
                  </div>
                  <span class="badge bg-warning-subtle text-warning-emphasis rounded-pill px-3">{{
                    pendingRecords.lokasi.length
                  }}</span>
                </div>
                <div v-if="pendingRecords.lokasi.length === 0" class="empty-state">
                  <p class="text-muted small mb-0 mt-1">Tiada rekod menunggu</p>
                </div>
                <ul v-else class="list-unstyled mb-0 pending-list">
                  <li
                    v-for="lok in pendingRecords.lokasi.slice(0, 3)"
                    :key="lok.id"
                    class="small py-2 border-bottom"
                  >
                    <div class="d-flex justify-content-between">
                      <span class="text-dark fw-medium">{{ lok.tarikh }}</span>
                      <span class="text-muted">{{ formatDate(lok.recorded_at) }}</span>
                    </div>
                  </li>
                  <li v-if="pendingRecords.lokasi.length > 3" class="pt-2 text-center">
                    <small class="text-primary fw-medium"
                      >+ {{ pendingRecords.lokasi.length - 3 }} rekod lagi</small
                    >
                  </li>
                </ul>
              </div>

              <!-- Aktiviti -->
              <div class="pending-section border rounded-3 p-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div class="d-flex align-items-center gap-2">
                    <span class="ri-calendar-line text-primary"></span>
                    <span class="fw-bold small text-dark">Aktiviti</span>
                  </div>
                  <span class="badge bg-warning-subtle text-warning-emphasis rounded-pill px-3">{{
                    pendingRecords.aktiviti.length
                  }}</span>
                </div>
                <div v-if="pendingRecords.aktiviti.length === 0" class="empty-state">
                  <p class="text-muted small mb-0 mt-1">Tiada rekod menunggu</p>
                </div>
                <ul v-else class="list-unstyled mb-0 pending-list">
                  <li
                    v-for="akt in pendingRecords.aktiviti.slice(0, 3)"
                    :key="akt.id"
                    class="small py-2 border-bottom"
                  >
                    <div class="d-flex justify-content-between">
                      <span class="text-dark fw-medium">{{ akt.aktiviti }}</span>
                      <span class="text-muted">{{ formatDate(akt.recorded_at) }}</span>
                    </div>
                  </li>
                  <li v-if="pendingRecords.aktiviti.length > 3" class="pt-2 text-center">
                    <small class="text-primary fw-medium"
                      >+ {{ pendingRecords.aktiviti.length - 3 }} rekod lagi</small
                    >
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Last Sync Info -->
      <div class="col-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-4">
            <h6 class="fw-bold mb-4">Maklumat Tambahan</h6>
            <div class="sync-info-pills">
              <div class="info-pill mb-3">
                <label class="d-block small text-muted mb-1">Terakhir Dikemaskini</label>
                <div class="fw-bold text-dark">{{ lastSyncFormatted }}</div>
              </div>
              <div class="info-pill mb-3">
                <label class="d-block small text-muted mb-1">Status Peranti</label>
                <div class="d-flex align-items-center gap-2">
                  <div class="status-indicator active"></div>
                  <span class="fw-medium text-dark">Luar Talian (Offline Mode)</span>
                </div>
              </div>
            </div>

            <div v-if="syncStore.error" class="alert alert-danger-subtle border-0 rounded-3 mt-4">
              <div class="d-flex gap-2">
                <span class="ri-error-warning-line fw-bold"></span>
                <span class="small">{{ syncStore.error }}</span>
              </div>
            </div>

            <div class="mt-4 p-3 rounded-3 bg-light-info">
              <div class="d-flex gap-2">
                <span class="ri-information-line text-primary fs-5"></span>
                <p class="small text-muted mb-0">
                  Sinkronisasi akan memindahkan rekod tempatan ke pangkalan data pusat PSOH.
                </p>
              </div>
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
  if (!syncStatus.value.lastSync) return 'Tiada rekod'
  const date = new Date(syncStatus.value.lastSync)
  return date.toLocaleString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleTimeString('ms-MY', {
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
  min-height: 500px;
}

/* Stat Cards */
.stat-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  border-radius: var(--border-radius-lg);
  background: #fff;
  box-shadow: var(--box-shadow);
  border: 1px solid var(--border-color);
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.sync-success .stat-icon {
  background-color: var(--light-success);
  color: var(--success);
}
.sync-pending .stat-icon {
  background-color: var(--light-warning);
  color: var(--warning);
}
.conn-active .stat-icon {
  background-color: var(--light-primary);
  color: var(--primary);
}
.conn-inactive .stat-icon {
  background-color: var(--light-danger);
  color: var(--danger);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--gray-500);
  margin-top: 0.25rem;
  font-weight: 500;
}

/* Pending Stats Grid */
.pending-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
}

.pending-section {
  background-color: var(--gray-50);
  border-color: var(--gray-100) !important;
}

.bg-warning-subtle {
  background-color: var(--light-warning) !important;
}

/* Status Indicator */
.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--gray-300);
}
.status-indicator.active {
  background-color: var(--success);
  box-shadow: 0 0 0 3px var(--light-success);
}

.alert-danger-subtle {
  background-color: var(--light-danger);
  color: var(--danger);
  padding: 1rem;
}

.spin {
  animation: spinner 1.5s linear infinite;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
