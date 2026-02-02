import { EventEmitter } from 'events'
import { net } from 'electron'

export class NetworkMonitor extends EventEmitter {
  private static instance: NetworkMonitor
  private isOnline: boolean = false
  private checkInterval: NodeJS.Timeout | null = null
  private readonly CHECK_INTERVAL_MS = 10000 // 10 seconds
  private readonly PING_URL = 'https://www.google.com'

  private constructor() {
    super()
  }

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor()
    }
    return NetworkMonitor.instance
  }

  startMonitoring(): void {
    // Initial check
    this.checkConnection()

    // Setup interval checking
    this.checkInterval = setInterval(() => {
      this.checkConnection()
    }, this.CHECK_INTERVAL_MS)
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private async checkConnection(): Promise<void> {
    const wasOnline = this.isOnline

    try {
      // Use Electron's net module to check connectivity
      const online = net.isOnline()

      if (online) {
        // Double-check with actual request
        const response = await this.pingServer()
        this.isOnline = response
      } else {
        this.isOnline = false
      }
    } catch {
      this.isOnline = false
    }

    // Emit event if status changed
    if (wasOnline !== this.isOnline) {
      this.emit(this.isOnline ? 'online' : 'offline')
      this.emit('status-change', this.isOnline)
    }
  }

  private pingServer(): Promise<boolean> {
    return new Promise((resolve) => {
      const request = net.request({
        method: 'HEAD',
        url: this.PING_URL
      })

      request.on('response', () => {
        resolve(true)
      })

      request.on('error', () => {
        resolve(false)
      })

      // Timeout after 5 seconds
      setTimeout(() => {
        request.abort()
        resolve(false)
      }, 5000)

      request.end()
    })
  }

  getStatus(): boolean {
    return this.isOnline
  }

  async forceCheck(): Promise<boolean> {
    await this.checkConnection()
    return this.isOnline
  }
}
