<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header bg-info text-white">
          <h5 class="modal-title">
            Tambah Lokasi Penandaan
            <small v-if="hasDraft" class="text-warning ms-2">(Draf)</small>
          </h5>
          <button type="button" class="btn-close" @click="handleClose">
            <span class="ri-close-line"></span>
          </button>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label required">Tarikh</label>
              <input 
                v-model="form.tarikh" 
                type="date" 
                class="form-control" 
                required
              />
            </div>
            
            <div class="row">
              <div class="col-6 mb-3">
                <label class="form-label required">Masa Mula</label>
                <input 
                  v-model="form.masa_mula" 
                  type="time" 
                  class="form-control" 
                  required
                />
              </div>
              <div class="col-6 mb-3">
                <label class="form-label required">Masa Tamat</label>
                <input 
                  v-model="form.masa_tamat" 
                  type="time" 
                  class="form-control" 
                  required
                />
              </div>
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
            
            <div class="mb-3">
              <label class="form-label">Catatan</label>
              <textarea 
                v-model="form.catatan" 
                class="form-control" 
                rows="3"
                placeholder="Catatan tambahan (jika ada)"
              ></textarea>
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
import { ref, reactive, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  assignmentId: number
}>()

const emit = defineEmits(['close', 'saved'])

const saving = ref(false)
const hasDraft = ref(false)
const autoSaveInterval = ref<NodeJS.Timeout | null>(null)

const today = new Date().toISOString().split('T')[0]

const form = reactive({
  tarikh: today,
  masa_mula: '',
  masa_tamat: '',
  latitude: null as number | null,
  longitude: null as number | null,
  catatan: ''
})

// Auto-save draft
async function saveDraft(): Promise<void> {
  if (form.masa_mula || form.masa_tamat) {
    await window.api.saveDraft('lokasi', props.assignmentId, { ...form })
  }
}

// Load existing draft
async function loadDraft(): Promise<void> {
  try {
    const draft = await window.api.getDraft('lokasi', props.assignmentId)
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
    const result = await window.api.saveLokasiRecord({
      tp_pokok_a_id: props.assignmentId,
      tarikh: form.tarikh,
      masa_mula: form.masa_mula,
      masa_tamat: form.masa_tamat,
      latitude: form.latitude,
      longitude: form.longitude,
      catatan: form.catatan
    })
    
    if (result.success) {
      await window.api.clearDraft('lokasi', props.assignmentId)
      emit('saved')
    }
  } catch (error) {
    console.error('Failed to save lokasi:', error)
    await saveDraft()
    alert('Gagal menyimpan. Data telah disimpan sebagai draf.')
  } finally {
    saving.value = false
  }
}

function handleClose(): void {
  if (form.masa_mula || form.masa_tamat) {
    saveDraft()
  }
  emit('close')
}

onMounted(async () => {
  await loadDraft()
  autoSaveInterval.value = setInterval(saveDraft, 10000)
})

onUnmounted(() => {
  if (autoSaveInterval.value) {
    clearInterval(autoSaveInterval.value)
  }
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
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--gray-200);
}
</style>
