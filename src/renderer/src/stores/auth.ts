import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: number
  name: string
  email: string
  negeri_id: number | null
  roles: string[]
}

export const useAuthStore = defineStore('auth', () => {
  const apiUrl = ref<string>('')
  const apiToken = ref<string>('')
  const user = ref<User | null>(null)
  const isOnline = ref<boolean>(false)
  const settingsLoaded = ref<boolean>(false)

  const isConfigured = computed(() => !!apiUrl.value && !!apiToken.value && !!user.value)

  async function loadSettings(): Promise<void> {
    try {
      const settings = await window.api.getApiSettings()
      if (settings) {
        apiUrl.value = settings.apiUrl
        apiToken.value = settings.apiToken

        // Try to validate the token
        if (settings.apiUrl && settings.apiToken) {
          const result = await window.api.testApiConnection(settings.apiUrl, settings.apiToken)
          if (result.success && result.user) {
            user.value = result.user
          }
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      settingsLoaded.value = true
    }
  }

  async function saveSettings(url: string, token: string): Promise<boolean> {
    try {
      await window.api.saveApiSettings({ apiUrl: url, apiToken: token })
      apiUrl.value = url
      apiToken.value = token
      return true
    } catch (error) {
      console.error('Failed to save settings:', error)
      return false
    }
  }

  function setUser(userData: User): void {
    user.value = userData
  }

  function setNetworkStatus(status: boolean): void {
    isOnline.value = status
  }

  function setApiConfig(url: string, token: string): void {
    apiUrl.value = url
    apiToken.value = token
  }

  async function logout(): Promise<void> {
    await window.api.clearApiSettings()
    apiUrl.value = ''
    apiToken.value = ''
    user.value = null
  }

  return {
    apiUrl,
    apiToken,
    user,
    isOnline,
    settingsLoaded,
    isConfigured,
    loadSettings,
    saveSettings,
    setUser,
    setNetworkStatus,
    setApiConfig,
    logout
  }
})
