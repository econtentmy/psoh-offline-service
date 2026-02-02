<template>
  <div class="dashboard">
    <!-- Stats Row -->
    <div class="row mb-4">
      <div class="col-4">
        <div class="stat-card info">
          <div class="stat-value">{{ syncStatus.synced }}</div>
          <div class="stat-label">Rekod Telah Disinkronkan</div>
        </div>
      </div>
      <div class="col-4">
        <div class="stat-card warning">
          <div class="stat-value">{{ syncStatus.pending }}</div>
          <div class="stat-label">Rekod Belum Disinkronkan</div>
        </div>
      </div>
      <div class="col-4">
        <div class="stat-card success">
          <div class="stat-value">{{ assignments.length }}</div>
          <div class="stat-label">Tugasan Aktif</div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="card border-bottom border-info shadow mb-4">
      <div class="card-body">
        <h4 class="mb-3">Tindakan Pantas</h4>
        <div class="row">
          <div class="col-4">
            <div class="quick-action" @click="navigateTo('/assignments')">
              <span class="ri-file-list-line"></span>
              <span>Senarai Tugasan</span>
            </div>
          </div>
          <div class="col-4">
            <div 
              class="quick-action" 
              @click="handleSync"
              :class="{ disabled: !isOnline || isSyncing }"
            >
              <span class="ri-refresh-line" :class="{ spin: isSyncing }"></span>
              <span>{{ isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang' }}</span>
            </div>
          </div>
          <div class="col-4">
            <div class="quick-action" @click="navigateTo('/settings')">
              <span class="ri-settings-line"></span>
              <span>Tetapan</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="card border-bottom border-info shadow">
      <div class="card-body">
        <h4 class="mb-3">Maklumat Sinkronisasi</h4>
        <div class="info-grid">
          <div class="info-item">
            <label>Status Sambungan</label>
            <span :class="isOnline ? 'text-success' : 'text-danger'">
              {{ isOnline ? 'Dalam Talian' : 'Luar Talian' }}
            </span>
          </div>
          <div class="info-item">
            <label>Sinkronisasi Terakhir</label>
            <span>{{ lastSyncFormatted }}</span>
          </div>
          <div class="info-item">
            <label>Rekod Menunggu</label>
            <span :class="syncStatus.pending > 0 ? 'text-warning' : 'text-success'">
              {{ syncStatus.pending }} rekod
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
.dashboard {
  padding: 20px 0;
}

.stat-card {
  padding: 1.5rem;
  border-radius: 8px;
  color: #fff;
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

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border-radius: 8px;
  background: var(--gray-100);
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-action:hover {
  background: var(--sidebar-hover-bg);
  transform: translateY(-2px);
}

.quick-action.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-action.disabled:hover {
  transform: none;
}

.quick-action span[class^="ri-"] {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  color: var(--brand-primary);
}

.quick-action span:last-child {
  font-weight: 500;
  color: var(--gray-700);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-size: 0.875rem;
  color: var(--gray-500);
}

.info-item span {
  font-size: 1rem;
  font-weight: 500;
  color: var(--gray-800);
}
</style>
