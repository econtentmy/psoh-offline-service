import { safeStorage } from 'electron'
import Store from 'electron-store'

const store = new Store({
  name: 'psoh-offline-config',
  encryptionKey: 'psoh-offline-2024'
})

export class SecureStorage {
  private static readonly API_URL_KEY = 'apiUrl'
  private static readonly API_TOKEN_KEY = 'apiToken_encrypted'

  static saveApiSettings(apiUrl: string, apiToken: string): void {
    store.set(this.API_URL_KEY, apiUrl)

    // Encrypt token using OS-level encryption
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(apiToken)
      store.set(this.API_TOKEN_KEY, encrypted.toString('base64'))
      // Clear fallback if exists
      store.delete('apiToken_fallback')
    } else {
      // Fallback: store with electron-store encryption
      store.set('apiToken_fallback', apiToken)
    }
  }

  static getApiSettings(): { apiUrl: string; apiToken: string } | null {
    const apiUrl = store.get(this.API_URL_KEY) as string
    if (!apiUrl) return null

    let apiToken = ''
    const encryptedToken = store.get(this.API_TOKEN_KEY) as string

    if (encryptedToken && safeStorage.isEncryptionAvailable()) {
      try {
        const buffer = Buffer.from(encryptedToken, 'base64')
        apiToken = safeStorage.decryptString(buffer)
      } catch (error) {
        console.error('Failed to decrypt token:', error)
        // Try fallback
        apiToken = (store.get('apiToken_fallback') as string) || ''
      }
    } else {
      apiToken = (store.get('apiToken_fallback') as string) || ''
    }

    if (!apiToken) return null

    return { apiUrl, apiToken }
  }

  static clearApiSettings(): void {
    store.delete(this.API_URL_KEY)
    store.delete(this.API_TOKEN_KEY)
    store.delete('apiToken_fallback')
  }

  static hasApiSettings(): boolean {
    return !!store.get(this.API_URL_KEY)
  }
}
