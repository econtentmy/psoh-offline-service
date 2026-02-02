<template>
  <div class="recording-page">
    <div v-if="loading" class="text-center py-5">
      <span class="ri-loader-4-line spin"></span> Memuatkan...
    </div>

    <template v-else-if="assignment">
      <!-- Nav tabs -->
      <ul class="nav-tabs">
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === 'maklumat' }"
            @click="activeTab = 'maklumat'"
          >
            Maklumat Asas
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === 'tag' }"
            @click="activeTab = 'tag'"
          >
            Perekodan Tag
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === 'lokasi' }"
            @click="activeTab = 'lokasi'"
          >
            Lokasi Penandaan
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === 'aktiviti' }"
            @click="activeTab = 'aktiviti'"
          >
            Aktiviti
          </a>
        </li>
      </ul>

      <div class="tab-content bg-white p-4">
        <!-- Maklumat Asas -->
        <div v-show="activeTab === 'maklumat'" class="tab-pane">
          <h5 class="mb-3">Maklumat Asas</h5>
          <div class="row">
            <div class="col-6 mb-3">
              <label class="form-label text-muted">No. Rujukan Surat Kelulusan</label>
              <p class="mb-0 fw-bold">{{ assignment.no_ruj_surat_lulus || '-' }}</p>
            </div>
            <div class="col-6 mb-3">
              <label class="form-label text-muted">Status Tanah</label>
              <p class="mb-0 fw-bold">{{ formatStatusTanah(assignment.status_tanah) }}</p>
            </div>
            <div class="col-6 mb-3">
              <label class="form-label text-muted">Daerah</label>
              <p class="mb-0 fw-bold">{{ formatDaerah(assignment.daerah) }}</p>
            </div>
            <div class="col-6 mb-3">
              <label class="form-label text-muted">Kompartmen</label>
              <p class="mb-0 fw-bold">{{ formatKompartmen(assignment.kompartmen) }}</p>
            </div>
            <div class="col-6 mb-3">
              <label class="form-label text-muted">Kaedah</label>
              <p class="mb-0 fw-bold">{{ formatKaedah(assignment.kaedah) }}</p>
            </div>
          </div>
        </div>

        <!-- Perekodan Tag -->
        <div v-show="activeTab === 'tag'" class="tab-pane">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">Perekodan Tag Pokok</h5>
            <button class="btn btn-rounded btn-info" @click="showTagModal = true">
              <span class="ri-add-line"></span> Tambah Tag
            </button>
          </div>

          <div class="table-responsive">
            <table class="table table-hover table-striped table-bordered">
              <thead class="bg-info text-light">
                <tr>
                  <th>Bil.</th>
                  <th>No. Tag</th>
                  <th>Jenis</th>
                  <th>Spesies</th>
                  <th>Ukurlilit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="tagRecords.length === 0">
                  <td colspan="6" class="text-center">Tiada rekod</td>
                </tr>
                <tr v-for="(tag, index) in tagRecords" :key="tag.id">
                  <td>{{ index + 1 }}.</td>
                  <td>{{ tag.no_tag }}</td>
                  <td>{{ tag.jenis_tag }}</td>
                  <td>{{ tag.kod_spesies }}</td>
                  <td>{{ tag.ukurlilit_paras_dada }} cm</td>
                  <td>
                    <span class="badge" :class="tag.sync_status === 'synced' ? 'bg-success' : 'bg-warning'">
                      {{ tag.sync_status === 'synced' ? 'Disinkronkan' : 'Menunggu' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Lokasi Penandaan -->
        <div v-show="activeTab === 'lokasi'" class="tab-pane">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">Lokasi Penandaan</h5>
            <button class="btn btn-rounded btn-info" @click="showLokasiModal = true">
              <span class="ri-add-line"></span> Tambah Lokasi
            </button>
          </div>

          <div class="table-responsive">
            <table class="table table-hover table-striped table-bordered">
              <thead class="bg-info text-light">
                <tr>
                  <th>Bil.</th>
                  <th>Tarikh</th>
                  <th>Masa Mula</th>
                  <th>Masa Tamat</th>
                  <th>Catatan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="lokasiRecords.length === 0">
                  <td colspan="6" class="text-center">Tiada rekod</td>
                </tr>
                <tr v-for="(lok, index) in lokasiRecords" :key="lok.id">
                  <td>{{ index + 1 }}.</td>
                  <td>{{ lok.tarikh }}</td>
                  <td>{{ lok.masa_mula }}</td>
                  <td>{{ lok.masa_tamat }}</td>
                  <td>{{ lok.catatan || '-' }}</td>
                  <td>
                    <span class="badge" :class="lok.sync_status === 'synced' ? 'bg-success' : 'bg-warning'">
                      {{ lok.sync_status === 'synced' ? 'Disinkronkan' : 'Menunggu' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Aktiviti -->
        <div v-show="activeTab === 'aktiviti'" class="tab-pane">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">Aktiviti Penandaan</h5>
            <button class="btn btn-rounded btn-info" @click="showAktivitiModal = true">
              <span class="ri-add-line"></span> Tambah Aktiviti
            </button>
          </div>

          <div class="table-responsive">
            <table class="table table-hover table-striped table-bordered">
              <thead class="bg-info text-light">
                <tr>
                  <th>Bil.</th>
                  <th>Tarikh</th>
                  <th>Aktiviti</th>
                  <th>Catatan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="aktivitiRecords.length === 0">
                  <td colspan="5" class="text-center">Tiada rekod</td>
                </tr>
                <tr v-for="(akt, index) in aktivitiRecords" :key="akt.id">
                  <td>{{ index + 1 }}.</td>
                  <td>{{ akt.tarikh }}</td>
                  <td>{{ akt.aktiviti }}</td>
                  <td>{{ akt.catatan || '-' }}</td>
                  <td>
                    <span class="badge" :class="akt.sync_status === 'synced' ? 'bg-success' : 'bg-warning'">
                      {{ akt.sync_status === 'synced' ? 'Disinkronkan' : 'Menunggu' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="text-center py-5">
      Tugasan tidak dijumpai
    </div>

    <!-- Tag Modal -->
    <TagRecordingModal
      v-if="showTagModal"
      :assignment-id="assignmentId"
      @close="showTagModal = false"
      @saved="onTagSaved"
    />

    <!-- Lokasi Modal -->
    <LokasiRecordingModal
      v-if="showLokasiModal"
      :assignment-id="assignmentId"
      @close="showLokasiModal = false"
      @saved="onLokasiSaved"
    />

    <!-- Aktiviti Modal -->
    <AktivitiRecordingModal
      v-if="showAktivitiModal"
      :assignment-id="assignmentId"
      @close="showAktivitiModal = false"
      @saved="onAktivitiSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAssignmentsStore } from '@/stores/assignments'
import TagRecordingModal from '@/components/forms/TagRecordingModal.vue'
import LokasiRecordingModal from '@/components/forms/LokasiRecordingModal.vue'
import AktivitiRecordingModal from '@/components/forms/AktivitiRecordingModal.vue'

const route = useRoute()
const assignmentsStore = useAssignmentsStore()

const assignmentId = computed(() => parseInt(route.params.id as string))
const activeTab = ref('maklumat')
const showTagModal = ref(false)
const showLokasiModal = ref(false)
const showAktivitiModal = ref(false)

// Local records
const tagRecords = ref<any[]>([])
const lokasiRecords = ref<any[]>([])
const aktivitiRecords = ref<any[]>([])

// Reference data for lookups
const daerahList = ref<any[]>([])

const loading = computed(() => assignmentsStore.loading)
const assignment = computed(() => assignmentsStore.currentAssignment)

async function loadRecords(): Promise<void> {
  // Load from local database
  const pending = await window.api.getPendingRecords()
  tagRecords.value = pending.tags.filter((t) => t.tp_pokok_a_id === assignmentId.value)
  lokasiRecords.value = pending.lokasi.filter((l) => l.tp_pokok_a_id === assignmentId.value)
  aktivitiRecords.value = pending.aktiviti.filter((a) => a.tp_pokok_a_id === assignmentId.value)
}

async function onTagSaved(): Promise<void> {
  showTagModal.value = false
  await loadRecords()
}

async function onLokasiSaved(): Promise<void> {
  showLokasiModal.value = false
  await loadRecords()
}

async function onAktivitiSaved(): Promise<void> {
  showAktivitiModal.value = false
  await loadRecords()
}

// Format status tanah for display
function formatStatusTanah(status: string | null): string {
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
function formatDaerah(daerah: string | number | null): string {
  if (!daerah) return '-'
  const found = daerahList.value.find((d) => d.id === Number(daerah) || d.kod === String(daerah))
  return found?.nama || String(daerah)
}

// Format kompartmen from JSON array to readable string
function formatKompartmen(kompartmen: string | null): string {
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
  
  await assignmentsStore.fetchAssignment(assignmentId.value)
  await loadRecords()
})
</script>

<style scoped>
.recording-page {
  min-height: 400px;
}

.nav-tabs {
  display: flex;
  flex-wrap: wrap;
  padding-left: 0;
  margin-bottom: 0;
  list-style: none;
  border-bottom: 1px solid var(--gray-200);
  background: #fff;
}

.nav-item {
  margin-bottom: -1px;
}

.nav-link {
  display: block;
  padding: 0.75rem 1.25rem;
  color: var(--gray-600);
  background-color: transparent;
  border: 1px solid transparent;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  cursor: pointer;
  text-decoration: none;
}

.nav-link:hover {
  border-color: var(--gray-200) var(--gray-200) transparent;
}

.nav-link.active {
  color: var(--gray-700);
  background-color: #fff;
  border-color: var(--gray-200) var(--gray-200) #fff;
  font-weight: 500;
}

.tab-content {
  border: 1px solid var(--gray-200);
  border-top: none;
}

.fw-bold {
  font-weight: 500 !important;
}
</style>
