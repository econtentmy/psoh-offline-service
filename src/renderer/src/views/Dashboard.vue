<template>
  <div class="dashboard-content">
    <!-- Header Section -->
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h3 class="mb-1 fw-bold">Selamat Datang</h3>
        <p class="text-muted mb-0">Paparan ringkasan aktiviti dan status semasa tugasan anda.</p>
      </div>
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
            <div class="stat-label">Rekod Disinkronkan</div>
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
            <div class="stat-label">Rekod Menunggu</div>
          </div>
        </div>
      </div>
      <div class="col-4">
        <div class="stat-card assignments-active">
          <div class="stat-icon">
            <span class="ri-folder-open-line"></span>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{ assignments.length }}</div>
            <div class="stat-label">Tugasan Aktif</div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <!-- Quick Actions -->
      <div class="col-8">
        <div class="card h-100 shadow-sm border-0">
          <div class="card-body p-4">
            <h5 class="card-title fw-bold mb-4">Tindakan Pantas</h5>
            <div class="row g-3">
              <div class="col-4">
                <div class="quick-action-tile" @click="navigateTo('/assignments')">
                  <div class="tile-icon">
                    <span class="ri-file-list-3-line"></span>
                  </div>
                  <span class="tile-label">Senarai Tugasan</span>
                </div>
              </div>
              <div class="col-4">
                <div
                  class="quick-action-tile"
                  @click="handleSync"
                  :class="{ disabled: !isOnline || isSyncing }"
                >
                  <div class="tile-icon" :class="{ spin: isSyncing }">
                    <span class="ri-refresh-line"></span>
                  </div>
                  <span class="tile-label">{{ isSyncing ? 'Menyinkronkan' : 'Sinkronkan' }}</span>
                </div>
              </div>
              <div class="col-4">
                <div class="quick-action-tile" @click="navigateTo('/settings')">
                  <div class="tile-icon">
                    <span class="ri-settings-4-line"></span>
                  </div>
                  <span class="tile-label">Konfigurasi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Sync Info -->
      <div class="col-4">
        <div class="card h-100 shadow-sm border-0">
          <div class="card-body p-4">
            <h5 class="card-title fw-bold mb-4">Status Sistem</h5>
            <div class="status-list">
              <div class="status-item">
                <span class="status-label">Rangkaian</span>
                <span
                  :class="[
                    'status-badge',
                    isOnline ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                  ]"
                >
                  {{ isOnline ? 'Dalam Talian' : 'Luar Talian' }}
                </span>
              </div>
              <div class="status-item">
                <span class="status-label">Sinkronisasi Terakhir</span>
                <span class="status-value">{{ lastSyncFormatted }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">Petugas Semasa</span>
                <span class="status-value fw-semibold">{{ authStore.user?.name || '-' }}</span>
              </div>
            </div>

            <div class="mt-4 p-3 rounded-3 bg-light-info">
              <div class="d-flex gap-3">
                <span class="ri-information-line text-primary fs-4"></span>
                <div>
                  <small class="text-dark fw-medium d-block mb-1">Nota Penting</small>
                  <p class="small text-muted mb-0">
                    Pastikan anda mensinkronkan data sebelum memulakan tugasan di lapangan.
                  </p>
                </div>
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSyncStore } from '@/stores/sync'
import { useAssignmentsStore } from '@/stores/assignments'

const router = useRouter()
const authStore = useAuthStore()
const syncStore = useSyncStore()
const assignmentsStore = useAssignmentsStore()

const isOnline = computed(() => authStore.isOnline)
const isSyncing = computed(() => syncStore.isSyncing)
const syncStatus = computed(() => syncStore.status)
const assignments = computed(() => assignmentsStore.assignments)

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

function navigateTo(path: string): void {
  router.push(path)
}

async function handleSync(): Promise<void> {
  if (!isOnline.value || isSyncing.value) return
  await syncStore.syncAll()
}

onMounted(async () => {
  await syncStore.fetchSyncStatus()
  await assignmentsStore.fetchAssignments()
})
</script>

<style scoped>
.dashboard-content {
  padding-top: 1rem;
}

/* Stat Cards */
.stat-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.75rem;
  border-radius: var(--border-radius-lg);
  background: #fff;
  box-shadow: var(--box-shadow);
  border: 1px solid var(--border-color);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
}

.sync-success .stat-icon {
  background-color: var(--light-success);
  color: var(--success);
}
.sync-pending .stat-icon {
  background-color: var(--light-warning);
  color: var(--warning);
}
.assignments-active .stat-icon {
  background-color: var(--light-primary);
  color: var(--primary);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--gray-900);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--gray-500);
  margin-top: 0.25rem;
  font-weight: 500;
}

/* Quick Actions */
.quick-action-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.25rem 1.5rem;
  border-radius: var(--border-radius-lg);
  background: var(--gray-50);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.quick-action-tile:hover {
  background: #fff;
  border-color: var(--brand-secondary);
  box-shadow: var(--box-shadow);
  transform: translateY(-3px);
}

.quick-action-tile .tile-icon {
  font-size: 2.25rem;
  color: var(--brand-primary);
  margin-bottom: 1rem;
  transition: transform 0.3s;
}

.quick-action-tile:hover .tile-icon {
  color: var(--brand-secondary);
  transform: scale(1.1);
}

.quick-action-tile .tile-label {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--gray-700);
  text-align: center;
}

.quick-action-tile.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(1);
}

.quick-action-tile.disabled:hover {
  transform: none;
  border-color: transparent;
  box-shadow: none;
}

/* Status List */
.status-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--gray-100);
}

.status-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.status-label {
  font-size: 0.9375rem;
  color: var(--gray-500);
}

.status-value {
  font-size: 0.9375rem;
  color: var(--gray-800);
}

.status-badge {
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.bg-success-subtle {
  background-color: var(--light-success);
}
.bg-danger-subtle {
  background-color: var(--light-danger);
}

.spin {
  animation: spinner 1.5s linear infinite;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}
</style>
