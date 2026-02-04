<template>
  <div class="recording-page p-2">
    <div v-if="loading" class="text-center py-5">
      <div class="d-flex flex-column align-items-center gap-3">
        <span class="ri-loader-4-line fs-2 spin text-primary"></span>
        <span class="text-muted small fw-medium">Memuatkan maklumat tugasan...</span>
      </div>
    </div>

    <template v-else-if="assignment">
      <!-- Page Header -->
      <div class="d-flex align-items-center justify-content-between mb-4 mt-2">
        <div>
          <h4 class="mb-1 text-uppercase fw-bold text-dark">Perekodan Lapangan</h4>
          <p class="text-muted small mb-0">{{ assignment.no_ruj_surat_lulus }}</p>
        </div>
        <router-link
          to="/assignments"
          class="btn btn-light btn-sm px-3 d-flex align-items-center gap-2"
        >
          <span class="ri-arrow-left-line"></span> Kembali
        </router-link>
      </div>

      <!-- Modern Nav tabs -->
      <div class="card border-0 shadow-sm mb-4">
        <ul class="nav nav-pills custom-nav p-2">
          <li class="nav-item">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'maklumat' }"
              @click="activeTab = 'maklumat'"
            >
              <span class="ri-information-line"></span> Asas
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'tag' }"
              @click="activeTab = 'tag'"
            >
              <span class="ri-price-tag-3-line"></span> Perekodan Tag
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'lokasi' }"
              @click="activeTab = 'lokasi'"
            >
              <span class="ri-map-pin-line"></span> Lokasi
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'aktiviti' }"
              @click="activeTab = 'aktiviti'"
            >
              <span class="ri-calendar-line"></span> Aktiviti
            </button>
          </li>
        </ul>
      </div>

      <div class="card border-0 shadow-sm overflow-hidden">
        <div class="card-body p-0">
          <!-- Maklumat Asas -->
          <div v-show="activeTab === 'maklumat'" class="p-4">
            <h6 class="fw-bold mb-4 text-primary d-flex align-items-center gap-2">
              <span class="ri-survey-line"></span> Maklumat Terperinci Tugasan
            </h6>
            <div class="row g-4">
              <div class="col-6">
                <div class="info-group">
                  <label class="text-muted small fw-bold text-uppercase mb-2 d-block"
                    >No. Rujukan Surat</label
                  >
                  <p class="text-dark fw-semibold fs-5 mb-0">
                    {{ assignment.no_ruj_surat_lulus || '-' }}
                  </p>
                </div>
              </div>
              <div class="col-6">
                <div class="info-group">
                  <label class="text-muted small fw-bold text-uppercase mb-2 d-block"
                    >Status Tanah</label
                  >
                  <div>
                    <span :class="['status-pill', assignment.status_tanah?.toLowerCase()]">
                      {{ formatStatusTanah(assignment.status_tanah) }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="col-4">
                <div class="info-group">
                  <label class="text-muted small fw-bold text-uppercase mb-2 d-block">Daerah</label>
                  <p class="text-dark fw-medium">{{ formatDaerah(assignment.daerah) }}</p>
                </div>
              </div>
              <div class="col-4">
                <div class="info-group">
                  <label class="text-muted small fw-bold text-uppercase mb-2 d-block"
                    >Kompartmen</label
                  >
                  <p class="text-dark fw-medium">{{ formatKompartmen(assignment.kompartmen) }}</p>
                </div>
              </div>
              <div class="col-4">
                <div class="info-group">
                  <label class="text-muted small fw-bold text-uppercase mb-2 d-block"
                    >Kaedah Pelaksanaan</label
                  >
                  <p class="text-dark fw-medium">{{ formatKaedah(assignment.kaedah) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Perekodan Tag -->
          <div v-show="activeTab === 'tag'">
            <div class="p-4 border-bottom d-flex justify-content-between align-items-center">
              <h6 class="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                <span class="ri-price-tag-3-line"></span> Rekod Tag Pokok
              </h6>
              <button
                class="btn btn-primary btn-sm px-3 d-flex align-items-center gap-2"
                @click="showTagModal = true"
              >
                <span class="ri-add-line"></span> Tambah Tag
              </button>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th class="ps-4">Bil.</th>
                    <th>No. Tag</th>
                    <th>Jenis Tag</th>
                    <th>Spesies</th>
                    <th>Ukurlilit (cm)</th>
                    <th class="text-center pe-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="tagRecords.length === 0">
                    <td colspan="6" class="text-center py-5 text-muted">Tiada rekod tag ditemui</td>
                  </tr>
                  <tr v-for="(tag, index) in tagRecords" :key="tag.id">
                    <td class="ps-4 text-muted">{{ index + 1 }}.</td>
                    <td class="fw-semibold text-dark">{{ tag.no_tag }}</td>
                    <td>
                      <span class="badge bg-light text-dark fw-medium px-2 py-1">{{
                        tag.jenis_tag
                      }}</span>
                    </td>
                    <td>{{ tag.kod_spesies }}</td>
                    <td>{{ tag.ukurlilit_paras_dada }}</td>
                    <td class="text-center pe-4">
                      <span
                        :class="['sync-badge', tag.sync_status === 'synced' ? 'synced' : 'pending']"
                      >
                        {{ tag.sync_status === 'synced' ? 'Disinkronkan' : 'Menunggu' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Lokasi Penandaan -->
          <div v-show="activeTab === 'lokasi'">
            <div class="p-4 border-bottom d-flex justify-content-between align-items-center">
              <h6 class="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                <span class="ri-map-pin-line"></span> Rekod Lokasi
              </h6>
              <button
                class="btn btn-primary btn-sm px-3 d-flex align-items-center gap-2"
                @click="showLokasiModal = true"
              >
                <span class="ri-add-line"></span> Tambah Lokasi
              </button>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th class="ps-4">Bil.</th>
                    <th>Tarikh</th>
                    <th>Masa</th>
                    <th>Catatan</th>
                    <th class="text-center pe-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="lokasiRecords.length === 0">
                    <td colspan="5" class="text-center py-5 text-muted">
                      Tiada rekod lokasi ditemui
                    </td>
                  </tr>
                  <tr v-for="(lok, index) in lokasiRecords" :key="lok.id">
                    <td class="ps-4 text-muted">{{ index + 1 }}.</td>
                    <td class="fw-semibold text-dark">{{ lok.tarikh }}</td>
                    <td>
                      <small class="text-muted fw-medium"
                        >{{ lok.masa_mula }} - {{ lok.masa_tamat }}</small
                      >
                    </td>
                    <td>{{ lok.catatan || '-' }}</td>
                    <td class="text-center pe-4">
                      <span
                        :class="['sync-badge', lok.sync_status === 'synced' ? 'synced' : 'pending']"
                      >
                        {{ lok.sync_status === 'synced' ? 'Disinkronkan' : 'Menunggu' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Aktiviti -->
          <div v-show="activeTab === 'aktiviti'">
            <div class="p-4 border-bottom d-flex justify-content-between align-items-center">
              <h6 class="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                <span class="ri-calendar-line"></span> Rekod Aktiviti
              </h6>
              <button
                class="btn btn-primary btn-sm px-3 d-flex align-items-center gap-2"
                @click="showAktivitiModal = true"
              >
                <span class="ri-add-line"></span> Tambah Aktiviti
              </button>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th class="ps-4">Bil.</th>
                    <th>Tarikh</th>
                    <th>Jenis Aktiviti</th>
                    <th>Catatan</th>
                    <th class="text-center pe-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="aktivitiRecords.length === 0">
                    <td colspan="5" class="text-center py-5 text-muted">
                      Tiada rekod aktiviti ditemui
                    </td>
                  </tr>
                  <tr v-for="(akt, index) in aktivitiRecords" :key="akt.id">
                    <td class="ps-4 text-muted">{{ index + 1 }}.</td>
                    <td class="fw-semibold text-dark">{{ akt.tarikh }}</td>
                    <td>
                      <span class="badge bg-light text-primary fw-medium px-2 py-1">{{
                        akt.aktiviti
                      }}</span>
                    </td>
                    <td>{{ akt.catatan || '-' }}</td>
                    <td class="text-center pe-4">
                      <span
                        :class="['sync-badge', akt.sync_status === 'synced' ? 'synced' : 'pending']"
                      >
                        {{ akt.sync_status === 'synced' ? 'Disinkronkan' : 'Menunggu' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="text-center py-5">
      <div class="d-flex flex-column align-items-center gap-2">
        <span class="ri-error-warning-line fs-2 text-warning"></span>
        <h5 class="text-dark fw-bold">Tugasan Tidak Dijumpai</h5>
        <p class="text-muted small">Sila pastikan anda memilih tugasan yang sah dari senarai.</p>
        <router-link to="/assignments" class="btn btn-primary btn-sm px-4"
          >Kembali ke Senarai</router-link
        >
      </div>
    </div>

    <!-- Modals -->
    <TagRecordingModal
      v-if="showTagModal"
      :assignment-id="assignmentId"
      @close="showTagModal = false"
      @saved="onTagSaved"
    />
    <LokasiRecordingModal
      v-if="showLokasiModal"
      :assignment-id="assignmentId"
      @close="showLokasiModal = false"
      @saved="onLokasiSaved"
    />
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

const tagRecords = ref<any[]>([])
const lokasiRecords = ref<any[]>([])
const aktivitiRecords = ref<any[]>([])
const daerahList = ref<any[]>([])

const loading = computed(() => assignmentsStore.loading)
const assignment = computed(() => assignmentsStore.currentAssignment)

async function loadRecords(): Promise<void> {
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

function formatKaedah(kaedah: number | string | null | undefined): string {
  if (!kaedah) return '-'
  const kaedahMap: Record<string, string> = { '1': 'Kontraktor', '2': 'Jabatan' }
  return kaedahMap[String(kaedah)] || String(kaedah)
}

onMounted(async () => {
  try {
    daerahList.value = await window.api.getReferenceData('ref_daerah_hutan')
  } catch (e) {
    console.error('Failed to load reference data:', e)
  }
  await assignmentsStore.fetchAssignment(assignmentId.value)
  await loadRecords()
})
</script>

<style scoped>
.recording-page {
  min-height: 500px;
}

/* Custom Pills Nav */
.nav {
  display: flex !important;
  flex-wrap: wrap;
  padding-left: 0;
  margin-bottom: 0;
  list-style: none !important;
}

.nav-item {
  list-style: none !important;
}

.custom-nav {
  gap: 0.5rem;
}

.custom-nav .nav-link {
  border-radius: 8px;
  color: var(--gray-600);
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0.6rem 1.25rem;
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
}

.custom-nav .nav-link:hover:not(.active) {
  background-color: var(--gray-50);
  color: var(--brand-primary);
}

.custom-nav .nav-link.active {
  background-color: var(--light-primary);
  color: var(--brand-primary);
  border-color: var(--light-primary);
}

.custom-nav .nav-link span {
  font-size: 1.1rem;
}

/* Info Group */
.info-group label {
  letter-spacing: 0.025em;
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
  padding: 1rem 0.75rem;
  font-size: 0.9375rem;
}

/* Sync Badges */
.sync-badge {
  display: inline-flex;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.sync-badge.synced {
  background-color: var(--light-success);
  color: var(--success);
}
.sync-badge.pending {
  background-color: var(--light-warning);
  color: var(--warning);
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

.spin {
  animation: spinner 1.5s linear infinite;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}
</style>
