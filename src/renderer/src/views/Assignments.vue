<template>
  <div class="assignments-page p-2">
    <!-- Header Section -->
    <div class="d-flex align-items-center justify-content-between mb-4 mt-2">
      <div>
        <h4 class="mb-1 text-uppercase fw-bold text-dark">Senarai Tugasan</h4>
        <p class="text-muted small mb-0">Senarai surat kelulusan yang diperuntukkan kepada anda.</p>
      </div>
      <div class="d-flex gap-2">
        <button
          class="btn btn-primary d-flex align-items-center gap-2 px-3"
          @click="handlePull"
          :disabled="!isOnline || isSyncing"
        >
          <span :class="['ri-refresh-line', { spin: isSyncing }]"></span>
          {{ isSyncing ? 'Memuat Turun...' : 'Kemas Kini Data' }}
        </button>
      </div>
    </div>

    <!-- Modern Search Filter Card -->
    <div class="card border-0 shadow-sm mb-4 search-card">
      <div class="card-body p-4">
        <div class="d-flex align-items-center gap-2 mb-3">
          <span class="ri-filter-2-line text-primary fs-5"></span>
          <h6 class="mb-0 fw-bold">Penapis Carian</h6>
        </div>
        <div class="row g-3">
          <div class="col-4">
            <label class="form-label small fw-semibold text-muted">No. Rujukan Surat</label>
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light border-end-0"
                ><span class="ri-hash"></span
              ></span>
              <input
                v-model="searchTerm.norujukan"
                type="text"
                class="form-control border-start-0 bg-white"
                placeholder="Cari no. rujukan..."
              />
            </div>
          </div>
          <div class="col-4">
            <label class="form-label small fw-semibold text-muted">Status Tanah</label>
            <select v-model="searchTerm.statusTanah" class="form-select form-select-sm bg-white">
              <option value="">Semua Status</option>
              <option value="HSK">Hutan Simpanan Kekal (HSK)</option>
              <option value="TK">Tanah Kerajaan (TK)</option>
            </select>
          </div>
          <div class="col-4">
            <label class="form-label small fw-semibold text-muted">Kompartmen</label>
            <input
              v-model="searchTerm.kompt"
              type="text"
              class="form-control form-control-sm bg-white"
              placeholder="No. kompartmen..."
            />
          </div>
        </div>
        <div class="d-flex justify-content-end gap-2 mt-4">
          <button class="btn btn-light btn-sm px-3" @click="resetSearch">Set Semula</button>
          <button class="btn btn-primary btn-sm px-4" @click="search">Tapis Rekod</button>
        </div>
      </div>
    </div>

    <!-- Data Table Card -->
    <div class="card border-0 shadow-sm overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th class="ps-4" style="width: 70px">Bil.</th>
              <th>Surat Kelulusan</th>
              <th>Status Tanah</th>
              <th>Daerah / Kompartmen</th>
              <th>Kaedah</th>
              <th class="text-center pe-4" style="width: 140px">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="text-center py-5">
                <div class="d-flex flex-column align-items-center gap-3">
                  <span class="ri-loader-4-line fs-2 spin text-primary"></span>
                  <span class="text-muted small fw-medium">Memproses data...</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="filteredAssignments.length === 0">
              <td colspan="6" class="text-center py-5">
                <div class="d-flex flex-column align-items-center gap-2">
                  <span class="ri-file-search-line fs-2 text-gray-300"></span>
                  <p class="text-muted mb-0">Tiada rekod tugasan ditemui.</p>
                  <button v-if="isOnline" @click="handlePull" class="btn btn-link btn-sm">
                    Cuba muat turun data baru
                  </button>
                </div>
              </td>
            </tr>
            <tr v-for="(item, index) in filteredAssignments" :key="item.id">
              <td class="ps-4 text-muted">{{ index + 1 }}.</td>
              <td>
                <div class="fw-semibold text-dark">{{ item.no_ruj_surat_lulus || '-' }}</div>
                <div class="small text-muted">{{ item.no_fail || 'Ref-ID: ' + item.id }}</div>
              </td>
              <td>
                <span :class="['status-pill', item.status_tanah?.toLowerCase()]">
                  {{ formatStatusTanah(item.status_tanah) }}
                </span>
              </td>
              <td>
                <div class="text-dark">{{ formatDaerah(item.daerah) }}</div>
                <div class="small text-muted">Kompt: {{ formatKompartmen(item.kompartmen) }}</div>
              </td>
              <td>
                <div class="small fw-medium">{{ formatKaedah(item.kaedah) }}</div>
              </td>
              <td class="text-center pe-4">
                <router-link
                  :to="`/recording/${item.id}`"
                  class="btn-action-view"
                  title="Mula Rakaman"
                >
                  <span class="ri-edit-box-line"></span>
                  Mula Rakaman
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSyncStore } from '@/stores/sync'
import { useAssignmentsStore } from '@/stores/assignments'

const authStore = useAuthStore()
const syncStore = useSyncStore()
const assignmentsStore = useAssignmentsStore()

const searchTerm = ref({
  norujukan: '',
  statusTanah: '',
  kompt: ''
})

const daerahList = ref<any[]>([])

const isOnline = computed(() => authStore.isOnline)
const isSyncing = computed(() => syncStore.isSyncing)
const loading = computed(() => assignmentsStore.loading)
const assignments = computed(() => assignmentsStore.assignments)

const filteredAssignments = computed(() => {
  let result = assignments.value

  if (searchTerm.value.norujukan) {
    result = result.filter((a) =>
      a.no_ruj_surat_lulus?.toLowerCase().includes(searchTerm.value.norujukan.toLowerCase())
    )
  }

  if (searchTerm.value.statusTanah) {
    result = result.filter((a) => a.status_tanah === searchTerm.value.statusTanah)
  }

  if (searchTerm.value.kompt) {
    result = result.filter((a) =>
      a.kompartmen?.toLowerCase().includes(searchTerm.value.kompt.toLowerCase())
    )
  }

  return result
})

async function handlePull(): Promise<void> {
  if (!isOnline.value || isSyncing.value) return
  const result = await syncStore.pullData()
  if (result) {
    await assignmentsStore.fetchAssignments()
  }
}

function search(): void {}

function resetSearch(): void {
  searchTerm.value = {
    norujukan: '',
    statusTanah: '',
    kompt: ''
  }
}

function formatStatusTanah(status: string | null | undefined): string {
  if (!status) return '-'
  const statusMap: Record<string, string> = {
    hsk: 'HSK',
    HSK: 'HSK',
    tk: 'TK',
    TK: 'TK',
    tr: 'TR',
    TR: 'TR'
  }
  return statusMap[status] || status
}

function formatDaerah(daerah: string | number | null | undefined): string {
  if (!daerah) return '-'
  const found = daerahList.value.find((d) => d.id === Number(daerah) || d.kod === String(daerah))
  return found?.nama || String(daerah)
}

function formatKompartmen(kompartmen: string | null | undefined): string {
  if (!kompartmen) return '-'
  try {
    const arr = typeof kompartmen === 'string' ? JSON.parse(kompartmen) : kompartmen
    if (Array.isArray(arr)) {
      const numbers = arr.map((item: any) => item.no || item).filter(Boolean)
      return numbers.join(', ') || '-'
    }
    return String(kompartmen)
  } catch {
    return String(kompartmen)
  }
}

function formatKaedah(kaedah: number | string | null): string {
  if (!kaedah) return '-'
  const kaedahMap: Record<string, string> = {
    '1': 'Kontraktor',
    '2': 'Jabatan'
  }
  return kaedahMap[String(kaedah)] || String(kaedah)
}

onMounted(async () => {
  try {
    daerahList.value = await window.api.getReferenceData('ref_daerah_hutan')
  } catch (e) {
    console.error('Failed to load reference data:', e)
  }
  await assignmentsStore.fetchAssignments()
})
</script>

<style scoped>
.assignments-page {
  min-height: 500px;
}

.search-card {
  border: 1px solid var(--border-color) !important;
}

/* Table Enhancements */
.table thead th {
  background-color: var(--gray-50);
  color: var(--gray-600);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1rem 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.table tbody td {
  padding: 1.25rem 0.75rem;
  font-size: 0.9375rem;
}

/* Status Pills */
.status-pill {
  display: inline-flex;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-pill.hsk {
  background-color: var(--light-primary);
  color: var(--primary);
}
.status-pill.tk {
  background-color: var(--light-warning);
  color: var(--warning);
}
.status-pill.tr {
  background-color: var(--light-info);
  color: var(--brand-secondary);
}

/* Action Button */
.btn-action-view {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--gray-50);
  color: var(--brand-primary);
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  border: 1px solid var(--gray-100);
}

.btn-action-view:hover {
  background-color: var(--brand-primary);
  color: #fff;
  border-color: var(--brand-primary);
  box-shadow: var(--box-shadow-sm);
}

.spin {
  animation: spinner 1.5s linear infinite;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

.input-group-text {
  color: var(--gray-400);
}

.form-select,
.form-control {
  box-shadow: none !important;
  border-color: var(--border-color);
}

.form-select:focus,
.form-control:focus {
  border-color: var(--brand-primary);
}
</style>
