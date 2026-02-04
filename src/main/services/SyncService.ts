import { EventEmitter } from 'events'
import axios, { AxiosInstance } from 'axios'
import { DatabaseService } from './DatabaseService'
import { BrowserWindow } from 'electron'

export class SyncService extends EventEmitter {
  private static instance: SyncService
  private axiosInstance: AxiosInstance | null = null
  private isSyncing: boolean = false

  private constructor() {
    super()
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  setApiConfig(apiUrl: string, apiToken: string): void {
    this.axiosInstance = axios.create({
      baseURL: `${apiUrl}/api/offline`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    })
  }

  private getMainWindow(): BrowserWindow | null {
    const windows = BrowserWindow.getAllWindows()
    return windows.length > 0 ? windows[0] : null
  }

  private sendProgress(current: number, total: number): void {
    const mainWindow = this.getMainWindow()
    if (mainWindow) {
      mainWindow.webContents.send('sync-progress', { current, total })
    }
    this.emit('progress', { current, total })
  }

  private sendComplete(success: boolean, synced: number): void {
    const mainWindow = this.getMainWindow()
    if (mainWindow) {
      mainWindow.webContents.send('sync-complete', { success, synced })
    }
    this.emit('complete', { success, synced })
  }

  // Get count of pending (unsynced) records
  private getPendingCount(): number {
    const db = DatabaseService.getInstance()
    const status = db.getSyncStatus()
    return status.pending
  }

  async pullData(): Promise<{ success: boolean; error?: string }> {
    if (!this.axiosInstance) {
      return { success: false, error: 'API tidak dikonfigurasi' }
    }

    try {
      const db = DatabaseService.getInstance()

      // Check for pending records and warn user
      const pendingCount = this.getPendingCount()
      if (pendingCount > 0) {
        console.log(`Warning: ${pendingCount} pending records exist. They will be preserved during pull.`)
      }

      // Pull reference data
      console.log('Pulling reference data...')
      const refResponse = await this.axiosInstance.get('/reference-data')
      if (refResponse.data.success) {
        const refData = refResponse.data.data
        if (refData.spesies) db.insertReferenceData('ref_spesies', refData.spesies)
        if (refData.negeri) db.insertReferenceData('ref_negeri', refData.negeri)
        if (refData.daerah) db.insertReferenceData('ref_daerah', refData.daerah)
        if (refData.daerah_hutan) db.insertReferenceData('ref_daerah_hutan', refData.daerah_hutan)
        if (refData.hutan_simpan) db.insertReferenceData('ref_hutan_simpan', refData.hutan_simpan)
        console.log('Reference data pulled successfully')
      } else {
        console.error('Reference data pull failed:', refResponse.data.error)
        return { success: false, error: refResponse.data.error || 'Gagal memuat turun data rujukan' }
      }

      // Pull assignments
      console.log('Pulling assignments...')
      const assignResponse = await this.axiosInstance.get('/assignments')
      if (assignResponse.data.success) {
        for (const assignment of assignResponse.data.data) {
          db.insertAssignment({
            remote_id: String(assignment.id || ''),
            permohonan_id: assignment.permohonan_id || null,
            status_id: assignment.status_id || null,
            kaedah: assignment.kaedah || null,
            no_ruj_surat_lulus: assignment.no_ruj_surat_lulus || null,
            no_fail: assignment.no_fail || assignment.no_ruj_fail || null,
            status_tanah: assignment.status_tanah || null,
            daerah: assignment.daerah_hutan || assignment.daerah || null,
            kompartmen: assignment.kompartmen || null
          })
        }
        console.log(`Pulled ${assignResponse.data.data.length} assignments`)
      } else {
        console.error('Assignments pull failed:', assignResponse.data.error)
        return { success: false, error: assignResponse.data.error || 'Gagal memuat turun senarai tugasan' }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Pull data error:', error.response?.data || error.message)
      
      // Extract error message from response
      let errorMessage = 'Gagal memuat turun data'
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return { success: false, error: errorMessage }
    }
  }

  async pushData(): Promise<{ success: boolean; synced: number; error?: string }> {
    if (!this.axiosInstance) {
      return { success: false, synced: 0, error: 'API tidak dikonfigurasi' }
    }

    if (this.isSyncing) {
      return { success: false, synced: 0, error: 'Sinkronisasi sedang berjalan' }
    }

    this.isSyncing = true
    let syncedCount = 0

    try {
      const db = DatabaseService.getInstance()
      const pending = db.getPendingRecords()

      const total = pending.tags.length + pending.lokasi.length + pending.aktiviti.length
      let current = 0

      // Push tag records
      for (const tag of pending.tags) {
        try {
          const response = await this.axiosInstance.post('/sync/tag-pokok', tag)
          if (response.data.success) {
            db.markTagSynced(tag.id, response.data.remote_id)
            syncedCount++
          }
        } catch (error) {
          console.error('Failed to sync tag:', tag.id, error)
        }
        current++
        this.sendProgress(current, total)
      }

      // Push lokasi records
      for (const lokasi of pending.lokasi) {
        try {
          const response = await this.axiosInstance.post('/sync/lokasi', lokasi)
          if (response.data.success) {
            db.markLokasiSynced(lokasi.id, response.data.remote_id)
            syncedCount++
          }
        } catch (error) {
          console.error('Failed to sync lokasi:', lokasi.id, error)
        }
        current++
        this.sendProgress(current, total)
      }

      // Push aktiviti records
      for (const aktiviti of pending.aktiviti) {
        try {
          const response = await this.axiosInstance.post('/sync/aktiviti', aktiviti)
          if (response.data.success) {
            db.markAktivitiSynced(aktiviti.id, response.data.remote_id)
            syncedCount++
          }
        } catch (error) {
          console.error('Failed to sync aktiviti:', aktiviti.id, error)
        }
        current++
        this.sendProgress(current, total)
      }

      this.sendComplete(true, syncedCount)
      return { success: true, synced: syncedCount }
    } catch (error: any) {
      console.error('Push data error:', error)
      this.sendComplete(false, syncedCount)
      return {
        success: false,
        synced: syncedCount,
        error: error.response?.data?.message || error.message || 'Gagal menghantar data'
      }
    } finally {
      this.isSyncing = false
    }
  }

  async syncAll(): Promise<{ success: boolean; error?: string }> {
    // First push pending data
    const pushResult = await this.pushData()
    if (!pushResult.success && pushResult.synced === 0) {
      return { success: false, error: pushResult.error }
    }

    // Then pull new data
    const pullResult = await this.pullData()
    if (!pullResult.success) {
      return { success: false, error: pullResult.error }
    }

    return { success: true }
  }

  async verifyToken(): Promise<{ success: boolean; user?: any; error?: string }> {
    if (!this.axiosInstance) {
      return { success: false, error: 'API tidak dikonfigurasi' }
    }

    try {
      const response = await this.axiosInstance.get('/verify-token')
      return {
        success: true,
        user: response.data.user
      }
    } catch (error: any) {
      let errorMessage = 'Sambungan gagal'

      if (error.response?.status === 401) {
        errorMessage = 'Token tidak sah atau telah tamat tempoh'
      } else if (error.response?.status === 403) {
        errorMessage = 'Token tidak mempunyai kebenaran'
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Pelayan tidak dapat dihubungi'
      }

      return { success: false, error: errorMessage }
    }
  }
}
