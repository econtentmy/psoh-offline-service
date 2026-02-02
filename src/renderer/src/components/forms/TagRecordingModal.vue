<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header bg-info text-white">
          <h5 class="modal-title">
            Tambah Tag Pokok
            <small v-if="hasDraft" class="text-warning ms-2">(Draf)</small>
          </h5>
          <button type="button" class="btn-close" @click="handleClose">
            <span class="ri-close-line"></span>
          </button>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label required">Jenis Tag</label>
              <select v-model="form.jenis_tag" class="form-select" required>
                <option value="">Sila Pilih</option>
                <option value="Tebangan">Tebangan</option>
                <option value="Ibu">Ibu</option>
                <option value="Perlindungan">Perlindungan</option>
              </select>
            </div>
            
            <div class="mb-3">
              <label class="form-label required">No. Tag</label>
              <input 
                v-model="form.no_tag" 
                type="text" 
                class="form-control input-uppercase" 
                placeholder="cth: T001"
                required
                @input="form.no_tag = ($event.target as HTMLInputElement).value.toUpperCase()"
              />
            </div>
            
            <div class="mb-3">
              <label class="form-label required">Kod Spesies</label>
              <SearchableSelect
                v-model="form.kod_spesies"
                :options="speciesOptions"
                placeholder="Sila Pilih"
                search-placeholder="Cari kod atau nama spesies..."
              />
              <input type="hidden" :value="form.kod_spesies" required />
            </div>
            
            <div class="mb-3">
              <label class="form-label required">Ukurlilit Paras Dada (cm)</label>
              <input 
                v-model.number="form.ukurlilit_paras_dada" 
                type="number" 
                step="0.1"
                min="0"
                class="form-control" 
                required
              />
            </div>
            
            <div class="mb-3">
              <label class="form-label">Kualiti</label>
              <select v-model="form.kualiti" class="form-select">
                <option value="">Sila Pilih</option>
                <option value="Baik">Baik</option>
                <option value="Sederhana">Sederhana</option>
                <option value="Cacat">Cacat</option>
              </select>
            </div>
            
            <div class="mb-3">
              <label class="form-label">Catatan</label>
              <textarea 
                v-model="form.catatan" 
                class="form-control" 
                rows="2"
              ></textarea>
            </div>
            
            <div class="row">
              <div class="col-6 mb-3">
                <label class="form-label">Latitud</label>
                <input 
                  v-model.number="form.latitude" 
                  type="number" 
                  step="0.000001"
                  class="form-control" 
                  placeholder="cth: 4.123456"
                />
              </div>
              <div class="col-6 mb-3">
                <label class="form-label">Longitud</label>
                <input 
                  v-model.number="form.longitude" 
                  type="number" 
                  step="0.000001"
                  class="form-control" 
                  placeholder="cth: 101.123456"
                />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="handleClose">
              Batal
            </button>
            <button type="submit" class="btn btn-info" :disabled="saving">
              <span class="ri-save-line"></span>
              {{ saving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'

const props = defineProps<{
  assignmentId: number
}>()

const emit = defineEmits(['close', 'saved'])

const saving = ref(false)
const hasDraft = ref(false)
const species = ref<{ kod: string; nama: string }[]>([])
const autoSaveInterval = ref<NodeJS.Timeout | null>(null)

// Convert species to options format for SearchableSelect
const speciesOptions = computed(() => 
  species.value.map(sp => ({
    value: sp.kod,
    label: `${sp.kod} - ${sp.nama}`
  }))
)

const form = reactive({
  jenis_tag: '',
  no_tag: '',
  kod_spesies: '',
  ukurlilit_paras_dada: null as number | null,
  kualiti: '',
  catatan: '',
  latitude: null as number | null,
  longitude: null as number | null
})

// Auto-save draft every 5 seconds when form has data
async function saveDraft(): Promise<void> {
  if (form.jenis_tag || form.no_tag || form.kod_spesies) {
    await window.api.saveDraft('tag', props.assignmentId, { ...form })
    console.log('Draft saved')
  }
}

// Load existing draft
async function loadDraft(): Promise<void> {
  try {
    const draft = await window.api.getDraft('tag', props.assignmentId)
    if (draft) {
      Object.assign(form, draft)
      hasDraft.value = true
    }
  } catch (error) {
    console.error('Failed to load draft:', error)
  }
}

async function handleSubmit(): Promise<void> {
  saving.value = true
  
  try {
    const result = await window.api.saveTagRecord({
      tp_pokok_a_id: props.assignmentId,
      jenis_tag: form.jenis_tag,
      no_tag: form.no_tag,
      kod_spesies: form.kod_spesies,
      ukurlilit_paras_dada: form.ukurlilit_paras_dada,
      kualiti: form.kualiti,
      catatan: form.catatan,
      latitude: form.latitude,
      longitude: form.longitude
    })
    
    if (result.success) {
      // Clear draft after successful save
      await window.api.clearDraft('tag', props.assignmentId)
      emit('saved')
    }
  } catch (error) {
    console.error('Failed to save tag:', error)
    // Save draft on error to prevent data loss
    await saveDraft()
    alert('Gagal menyimpan. Data telah disimpan sebagai draf.')
  } finally {
    saving.value = false
  }
}

function handleClose(): void {
  // Save draft before closing if there's data
  if (form.jenis_tag || form.no_tag || form.kod_spesies) {
    saveDraft()
  }
  emit('close')
}

// Watch for form changes and auto-save
watch(form, () => {
  // Debounced auto-save on form change
}, { deep: true })

onMounted(async () => {
  // Load draft first
  await loadDraft()
  
  // Load species reference data
  try {
    const data = await window.api.getReferenceData('ref_spesies')
    species.value = data
  } catch (error) {
    // Fallback species if no reference data
    species.value = [
      { kod: 'MRB', nama: 'Meranti Bukit' },
      { kod: 'MRS', nama: 'Meranti Sarang Punai' },
      { kod: 'KMP', nama: 'Kempas' },
      { kod: 'KRG', nama: 'Keruing' },
      { kod: 'BLN', nama: 'Balau' }
    ]
  }

  // Start auto-save interval (every 10 seconds)
  autoSaveInterval.value = setInterval(saveDraft, 10000)
})

onUnmounted(() => {
  // Clear auto-save interval
  if (autoSaveInterval.value) {
    clearInterval(autoSaveInterval.value)
  }
  // Final draft save on unmount
  saveDraft()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-dialog {
  width: 100%;
  max-width: 500px;
  margin: 1rem;
}

.modal-content {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--gray-200);
  border-radius: 8px 8px 0 0;
}

.modal-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 500;
}

.btn-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-body {
  padding: 1.25rem;
  max-height: 70vh;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--gray-200);
}

.input-uppercase {
  text-transform: uppercase;
}

.input-uppercase::placeholder {
  text-transform: none;
}
</style>
