import { safeStorage, app } from 'electron'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

// Simple JSON file-based store (replaces electron-store to avoid bundling issues)
class SimpleStore {
  private data: Record<string, unknown> = {}
  private filePath: string

  constructor(name: string) {
    const userDataPath = app.getPath('userData')
    const configDir = join(userDataPath, 'config')

    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true })
    }

    this.filePath = join(configDir, `${name}.json`)
    this.load()
  }

  private load(): void {
    try {
      if (existsSync(this.filePath)) {
        const content = readFileSync(this.filePath, 'utf-8')
        this.data = JSON.parse(content)
      }
    } catch (error) {
      console.error('Failed to load config:', error)
      this.data = {}
    }
  }

  private save(): void {
    try {
      writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
    } catch (error) {
      console.error('Failed to save config:', error)
    }
  }

  get(key: string): unknown {
    return this.data[key]
  }

  set(key: string, value: unknown): void {
    this.data[key] = value
    this.save()
  }

  delete(key: string): void {
    delete this.data[key]
    this.save()
  }
}

let store: SimpleStore | null = null

function getStore(): SimpleStore {
  if (!store) {
    store = new SimpleStore('psoh-offline-config')
  }
  return store
}

export class SecureStorage {
  private static readonly API_URL_KEY = 'apiUrl'
  private static readonly API_TOKEN_KEY = 'apiToken_encrypted'

  static saveApiSettings(apiUrl: string, apiToken: string): void {
    const s = getStore()
    s.set(this.API_URL_KEY, apiUrl)

    // Encrypt token using OS-level encryption
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(apiToken)
      s.set(this.API_TOKEN_KEY, encrypted.toString('base64'))
      // Clear fallback if exists
      s.delete('apiToken_fallback')
    } else {
      // Fallback: store without encryption (not ideal but works)
      s.set('apiToken_fallback', apiToken)
    }
  }

  static getApiSettings(): { apiUrl: string; apiToken: string } | null {
    const s = getStore()
    const apiUrl = s.get(this.API_URL_KEY) as string
    if (!apiUrl) return null

    let apiToken = ''
    const encryptedToken = s.get(this.API_TOKEN_KEY) as string

    if (encryptedToken && safeStorage.isEncryptionAvailable()) {
      try {
        const buffer = Buffer.from(encryptedToken, 'base64')
        apiToken = safeStorage.decryptString(buffer)
      } catch (error) {
        console.error('Failed to decrypt token:', error)
        // Try fallback
        apiToken = (s.get('apiToken_fallback') as string) || ''
      }
    } else {
      apiToken = (s.get('apiToken_fallback') as string) || ''
    }

    if (!apiToken) return null

    return { apiUrl, apiToken }
  }

  static clearApiSettings(): void {
    const s = getStore()
    s.delete(this.API_URL_KEY)
    s.delete(this.API_TOKEN_KEY)
    s.delete('apiToken_fallback')
  }

  static hasApiSettings(): boolean {
    const s = getStore()
    return !!s.get(this.API_URL_KEY)
  }
}
