<template>
  <div class="assignments-page">
    <div class="row py-3">
      <div class="col-12">
        <!-- Header with Sync Button -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h4 class="mb-0 text-uppercase">Senarai Tugasan</h4>
          <div class="d-flex gap-2">
            <button 
              class="btn btn-rounded btn-info"
              @click="handlePull"
              :disabled="!isOnline || isSyncing"
            >
              <span class="ri-refresh-line" :class="{ spin: isSyncing }"></span>
              {{ isSyncing ? 'Memuat Turun...' : 'Muat Turun Data' }}
            </button>
          </div>
        </div>

        <!-- Search/Filter Accordion -->
        <div class="accordion mb-3" id="searchAccordion">
          <div class="accordion-item bg-white">
            <h2 class="accordion-header">
              <button
                class="accordion-button bg-light text-dark"
                type="button"
                @click="showSearch = !showSearch"
              >
                <b>Carian</b>
              </button>
            </h2>
            <div class="accordion-collapse" :class="{ show: showSearch }">
              <div class="accordion-body">
                <div class="row">
                  <div class="col-4">
                    <label class="form-label">No. Rujukan Surat Kelulusan</label>
                    <input
                      v-model="searchTerm.norujukan"
                      type="text"
                      class="form-control"
                    />
                  </div>
                  <div class="col-4">
                    <label class="form-label">Status Tanah</label>
                    <select v-model="searchTerm.statusTanah" class="form-select">
                      <option value="">Sila Pilih</option>
                      <option value="HSK">Hutan Simpanan Kekal (HSK)</option>
                      <option value="TK">Tanah Kerajaan (TK)</option>
                    </select>
                  </div>
                  <div class="col-4">
                    <label class="form-label">Kompartmen</label>
                    <input
                      v-model="searchTerm.kompt"
                      type="text"
                      class="form-control"
                    />
                  </div>
                </div>
                <div class="row mt-3">
                  <div class="col d-flex gap-2">
                    <button class="btn btn-rounded btn-info" @click="search">
                      <span class="ri-search-line"></span> Cari
                    </button>
                    <button class="btn btn-rounded btn-secondary" @click="resetSearch">
                      <span class="ri-refresh-line"></span> Set Semula
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Table -->
        <div class="table-responsive">
          <table class="table table-hover table-striped table-bordered">
            <thead class="bg-info text-light">
              <tr>
                <th style="width: 60px;">Bil.</th>
                <th>No. Rujukan Surat Kelulusan</th>
                <th>Status Tanah</th>
                <th>Daerah</th>
                <th>Kompartmen</th>
                <th>Kaedah</th>
                <th style="width: 100px;">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="7" class="text-center py-4">
                  <span class="ri-loader-4-line spin"></span> Memuatkan...
                </td>
              </tr>
              <tr v-else-if="filteredAssignments.length === 0">
                <td colspan="7" class="text-center py-4">
                  Tiada rekod
                </td>
              </tr>
              <tr v-for="(item, index) in filteredAssignments" :key="item.id">
                <td>{{ index + 1 }}.</td>
                <td>{{ item.no_ruj_surat_lulus || '-' }}</td>
                <td>{{ formatStatusTanah(item.status_tanah) }}</td>
                <td>{{ formatDaerah(item.daerah) }}</td>
                <td>{{ formatKompartmen(item.kompartmen) }}</td>
                <td>{{ formatKaedah(item.kaedah) }}</td>
                <td class="text-center">
                  <router-link 
                    :to="`/recording/${item.id}`"
                    class="btn btn-sm btn-info"
                    title="Rekod"
                  >
                    <span class="ri-pencil-line"></span>
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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

const showSearch = ref(true)
const searchTerm = ref({
  norujukan: '',
  statusTanah: '',
  kompt: ''
})

// Reference data for lookups
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

function search(): void {
  // Filtering is reactive, no action needed
}

function resetSearch(): void {
  searchTerm.value = {
    norujukan: '',
    statusTanah: '',
    kompt: ''
  }
}

// Format status tanah for display
function formatStatusTanah(status: string | null | undefined): string {
  if (!status) return '-'
  const statusMap: Record<string, string> = {
    'hsk': 'Hutan Simpan Kekal (HSK)',
    'HSK': 'Hutan Simpan Kekal (HSK)',
    'tk': 'Tanah Kerajaan (TK)',
    'TK': 'Tanah Kerajaan (TK)',
    'tr': 'Tanah Rizab (TR)',
    'TR': 'Tanah Rizab (TR)'
  }
  return statusMap[status] || status
}

// Format daerah - lookup name from reference data
function formatDaerah(daerah: string | number | null | undefined): string {
  if (!daerah) return '-'
  const found = daerahList.value.find((d) => d.id === Number(daerah) || d.kod === String(daerah))
  return found?.nama || String(daerah)
}

// Format kompartmen from JSON array to readable string
function formatKompartmen(kompartmen: string | null | undefined): string {
  if (!kompartmen) return '-'
  
  try {
    // Try to parse as JSON
    const arr = typeof kompartmen === 'string' ? JSON.parse(kompartmen) : kompartmen
    
    if (Array.isArray(arr)) {
      // Extract 'no' values from the array of objects
      const numbers = arr.map((item: any) => item.no || item).filter(Boolean)
      return numbers.join(', ') || '-'
    }
    
    return String(kompartmen)
  } catch {
    // If not valid JSON, return as-is
    return String(kompartmen)
  }
}

// Format kaedah pelaksanaan
function formatKaedah(kaedah: number | string | null): string {
  if (!kaedah) return '-'
  const kaedahMap: Record<string, string> = {
    '1': 'Kontraktor',
    '2': 'Jabatan'
  }
  return kaedahMap[String(kaedah)] || String(kaedah)
}

onMounted(async () => {
  // Load reference data for lookups (using daerah hutan / forest districts)
  try {
    daerahList.value = await window.api.getReferenceData('ref_daerah_hutan')
  } catch (e) {
    console.error('Failed to load daerah hutan reference data:', e)
  }
  
  await assignmentsStore.fetchAssignments()
})
</script>

<style scoped>
.assignments-page {
  min-height: 400px;
}

.accordion-collapse {
  display: none;
}

.accordion-collapse.show {
  display: block;
}

.btn-sm span[class^="ri-"] {
  font-size: 1rem;
}
</style>
