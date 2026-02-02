<template>
  <div class="settings-page">
    <div class="settings-container">
      <h4 class="mb-4">Tetapan API</h4>

      <div class="card border-bottom border-info shadow">
        <div class="card-body">
          <form @submit.prevent="saveSettings">
            <!-- Environment Selection -->
            <div class="mb-4">
              <label class="form-label required">Persekitaran</label>
              <div class="environment-options">
                <label 
                  class="environment-option" 
                  :class="{ active: environment === 'production' }"
                >
                  <input 
                    type="radio" 
                    v-model="environment" 
                    value="production" 
                    class="d-none"
                  />
                  <div class="option-content">
                    <span class="ri-shield-check-line option-icon text-success"></span>
                    <div class="option-text">
                      <strong>Production</strong>
                      <small>https://psoh.forestry.gov.my</small>
                    </div>
                  </div>
                </label>

                <label 
                  class="environment-option" 
                  :class="{ active: environment === 'staging' }"
                >
                  <input 
                    type="radio" 
                    v-model="environment" 
                    value="staging" 
                    class="d-none"
                  />
                  <div class="option-content">
                    <span class="ri-test-tube-line option-icon text-warning"></span>
                    <div class="option-text">
                      <strong>Staging</strong>
                      <small>Pelayan ujian</small>
                    </div>
                  </div>
                </label>

                <label 
                  class="environment-option" 
                  :class="{ active: environment === 'development' }"
                >
                  <input 
                    type="radio" 
                    v-model="environment" 
                    value="development" 
                    class="d-none"
                  />
                  <div class="option-content">
                    <span class="ri-code-s-slash-line option-icon text-info"></span>
                    <div class="option-text">
                      <strong>Development</strong>
                      <small>Pelayan pembangunan</small>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <!-- API URL (shown for staging/development) -->
            <div class="mb-3" v-if="environment !== 'production'">
              <label class="form-label required">URL Pelayan PSOH</label>
              <input
                v-model="customApiUrl"
                type="url"
                class="form-control"
                :placeholder="environment === 'staging' ? 'https://staging.psoh.forestry.gov.my' : 'http://localhost:8000'"
                required
              />
              <small class="text-muted">
                Masukkan URL sistem PSOH tanpa /api
              </small>
            </div>

            <!-- Production URL Display -->
            <div class="mb-3" v-else>
              <label class="form-label">URL Pelayan PSOH</label>
              <div class="form-control bg-light text-muted" style="cursor: not-allowed;">
                {{ PRODUCTION_URL }}
              </div>
              <small class="text-muted">
                URL production adalah tetap dan tidak boleh diubah
              </small>
            </div>

            <!-- API Token -->
            <div class="mb-3">
              <label class="form-label required">Token API</label>
              <div class="input-group">
                <input
                  v-model="apiToken"
                  :type="showToken ? 'text' : 'password'"
                  class="form-control"
                  placeholder="Masukkan token dari Utiliti > Token API Offline"
                  required
                />
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  @click="showToken = !showToken"
                >
                  <span :class="showToken ? 'ri-eye-off-line' : 'ri-eye-line'"></span>
                </button>
              </div>
              <small class="text-muted">
                Dapatkan token dari Pentadbir Sistem melalui Utiliti > Token API Offline
              </small>
            </div>

            <!-- Connection Status -->
            <div class="mb-4">
              <div class="d-flex align-items-center gap-2">
                <span class="me-2">Status Sambungan:</span>
                <span v-if="connectionStatus === 'checking'" class="text-muted">
                  <span class="ri-loader-4-line spin"></span> Menyemak...
                </span>
                <span v-else-if="connectionStatus === 'connected'" class="text-success">
                  <span class="ri-check-line"></span> Bersambung ({{ userName }})
                </span>
                <span v-else-if="connectionStatus === 'error'" class="text-danger">
                  <span class="ri-close-line"></span> {{ errorMessage }}
                </span>
                <span v-else class="text-secondary">
                  <span class="ri-question-line"></span> Belum disahkan
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="d-flex gap-2">
              <button
                type="button"
                class="btn btn-rounded btn-secondary"
                @click="testConnection"
                :disabled="!currentApiUrl || !apiToken || connectionStatus === 'checking'"
              >
                <span class="ri-wifi-line"></span> Uji Sambungan
              </button>
              <button
                type="submit"
                class="btn btn-rounded btn-info"
                :disabled="connectionStatus !== 'connected' || saving"
              >
                <span class="ri-save-line"></span> 
                {{ saving ? 'Menyimpan...' : 'Simpan Tetapan' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Instructions -->
      <div class="card border-bottom border-info shadow mt-4">
        <div class="card-body">
          <h5 class="mb-3">Cara Mendapatkan Token API</h5>
          <ol class="instructions-list">
            <li>Log masuk ke aplikasi web PSOH</li>
            <li>Pergi ke <strong>Utiliti > Token API Offline</strong></li>
            <li>Klik butang <strong>Cipta Token Baharu</strong></li>
            <li>Pilih pengguna dan masukkan nama token</li>
            <li>Salin token yang dipaparkan (token hanya dipaparkan sekali)</li>
            <li>Tampal token di dalam medan "Token API" di atas</li>
          </ol>
          <div class="alert alert-warning mt-3 mb-0">
            <span class="ri-error-warning-line"></span>
            <strong>Perhatian:</strong> Token perlu disimpan dengan selamat. 
            Jika token hilang, sila hubungi Pentadbir Sistem untuk mencipta token baharu.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Constants
const PRODUCTION_URL = 'https://psoh.forestry.gov.my'

// Form state
const environment = ref<'production' | 'staging' | 'development'>('production')
const customApiUrl = ref('')
const apiToken = ref('')
const showToken = ref(false)
const connectionStatus = ref<'idle' | 'checking' | 'connected' | 'error'>('idle')
const userName = ref('')
const errorMessage = ref('')
const saving = ref(false)

// Computed API URL based on environment
const currentApiUrl = computed(() => {
  if (environment.value === 'production') {
    return PRODUCTION_URL
  }
  return customApiUrl.value
})

// Reset connection status when environment or URL changes
watch([environment, customApiUrl], () => {
  connectionStatus.value = 'idle'
  errorMessage.value = ''
})

onMounted(async () => {
  const settings = await window.api.getApiSettings()
  if (settings) {
    apiToken.value = settings.apiToken
    
    // Detect environment from saved URL
    if (settings.apiUrl === PRODUCTION_URL) {
      environment.value = 'production'
    } else if (settings.apiUrl?.includes('staging')) {
      environment.value = 'staging'
      customApiUrl.value = settings.apiUrl
    } else if (settings.apiUrl) {
      environment.value = 'development'
      customApiUrl.value = settings.apiUrl
    }
    
    // Try to verify existing settings
    if (settings.apiUrl && settings.apiToken) {
      await testConnection()
    }
  }
})

async function testConnection(): Promise<void> {
  if (!currentApiUrl.value || !apiToken.value) return
  
  connectionStatus.value = 'checking'
  errorMessage.value = ''

  try {
    const result = await window.api.testApiConnection(currentApiUrl.value, apiToken.value)
    if (result.success) {
      connectionStatus.value = 'connected'
      userName.value = result.user?.name || ''
      authStore.setUser(result.user)
    } else {
      connectionStatus.value = 'error'
      errorMessage.value = result.error || 'Gagal menyambung ke pelayan'
    }
  } catch (e) {
    connectionStatus.value = 'error'
    errorMessage.value = 'Gagal menyambung ke pelayan'
  }
}

async function saveSettings(): Promise<void> {
  if (connectionStatus.value !== 'connected') return
  
  saving.value = true
  
  try {
    await window.api.saveApiSettings({
      apiUrl: currentApiUrl.value,
      apiToken: apiToken.value
    })
    
    authStore.setApiConfig(currentApiUrl.value, apiToken.value)
    
    // Navigate to dashboard
    router.push('/')
  } catch (e) {
    errorMessage.value = 'Gagal menyimpan tetapan'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.settings-page {
  width: 100%;
  min-height: 100vh;
  padding: 20px;
  background-color: var(--body-bg, #f2f4f5);
}

.settings-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

/* Environment Options */
.environment-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.environment-option {
  flex: 1;
  min-width: 200px;
  padding: 16px;
  border: 2px solid var(--gray-200, #e9ecef);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;
}

.environment-option:hover {
  border-color: var(--gray-400, #ced4da);
  background: var(--gray-100, #f6f8f9);
}

.environment-option.active {
  border-color: var(--info, #137eff);
  background: rgba(19, 126, 255, 0.05);
}

.option-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-icon {
  font-size: 24px;
}

.option-text {
  display: flex;
  flex-direction: column;
}

.option-text strong {
  font-size: 14px;
  color: var(--gray-800, #343a40);
}

.option-text small {
  font-size: 12px;
  color: var(--gray-600, #6c757d);
}

.instructions-list {
  padding-left: 1.25rem;
  margin-bottom: 0;
}

.instructions-list li {
  margin-bottom: 0.5rem;
  color: var(--gray-700);
}

.instructions-list li:last-child {
  margin-bottom: 0;
}

.alert {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.alert span[class^="ri-"] {
  flex-shrink: 0;
  margin-top: 2px;
}
</style>
