import { ipcMain } from 'electron'
import axios from 'axios'
import https from 'https'
import { SecureStorage } from '../services/SecureStorage'

// HTTPS agent that accepts self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
})
import { DatabaseService } from '../services/DatabaseService'
import { NetworkMonitor } from '../services/NetworkMonitor'
import { SyncService } from '../services/SyncService'

// API Settings handlers
ipcMain.handle('get-api-settings', async () => {
  return SecureStorage.getApiSettings()
})

ipcMain.handle('save-api-settings', async (_, settings: { apiUrl: string; apiToken: string }) => {
  SecureStorage.saveApiSettings(settings.apiUrl, settings.apiToken)

  // Update sync service with new config
  const syncService = SyncService.getInstance()
  syncService.setApiConfig(settings.apiUrl, settings.apiToken)

  return { success: true }
})

ipcMain.handle('clear-api-settings', async () => {
  SecureStorage.clearApiSettings()
})

ipcMain.handle('test-api-connection', async (_, apiUrl: string, apiToken: string) => {
  try {
    const response = await axios.get(`${apiUrl}/api/offline/verify-token`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json'
      },
      timeout: 10000,
      httpsAgent
    })

    if (response.data.success === false) {
      return { success: false, error: response.data.error || 'Pengesahan gagal' }
    }

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
    } else if (error.response?.status === 404) {
      errorMessage = 'API endpoint tidak dijumpai. Sila pastikan URL pelayan betul.'
    } else if (error.response?.status === 500) {
      // Check for specific server errors
      const serverError = error.response?.data?.error || error.response?.data?.message
      if (serverError?.includes('str_ends_with') || serverError?.includes('TypeError')) {
        errorMessage = 'Token rosak. Sila minta Pentadbir Sistem untuk mencipta token baharu.'
      } else {
        errorMessage = serverError || 'Ralat pelayan. Sila cuba lagi.'
      }
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Pelayan tidak dapat dihubungi. Sila pastikan pelayan PSOH sedang berjalan.'
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'URL pelayan tidak sah atau tidak dapat dihubungi'
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Sambungan tamat masa. Sila cuba lagi.'
    } else if (error.code === 'ERR_NETWORK') {
      errorMessage = 'Tiada sambungan rangkaian. Sila semak sambungan internet anda.'
    } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || error.message?.includes('certificate')) {
      errorMessage = 'Sijil SSL tidak sah. Sila hubungi pentadbir sistem.'
    }

    console.error('API Connection Error:', error.code, error.message, error.response?.data)
    return { success: false, error: errorMessage }
  }
})

// Database handlers
ipcMain.handle('db-get-assignments', async () => {
  const db = DatabaseService.getInstance()
  return db.getAssignments()
})

ipcMain.handle('db-get-assignment', async (_, id: number) => {
  const db = DatabaseService.getInstance()
  return db.getAssignment(id)
})

ipcMain.handle('db-get-reference-data', async (_, table: string) => {
  const db = DatabaseService.getInstance()
  return db.getReferenceData(table)
})

ipcMain.handle('db-save-tag-record', async (_, data: any) => {
  const db = DatabaseService.getInstance()
  const id = db.saveTagRecord(data)
  return { success: true, id }
})

ipcMain.handle('db-save-lokasi-record', async (_, data: any) => {
  const db = DatabaseService.getInstance()
  const id = db.saveLokasiRecord(data)
  return { success: true, id }
})

ipcMain.handle('db-save-aktiviti-record', async (_, data: any) => {
  const db = DatabaseService.getInstance()
  const id = db.saveAktivitiRecord(data)
  return { success: true, id }
})

ipcMain.handle('db-get-pending-records', async () => {
  const db = DatabaseService.getInstance()
  return db.getPendingRecords()
})

// Sync handlers
ipcMain.handle('sync-pull', async () => {
  const syncService = SyncService.getInstance()
  return syncService.pullData()
})

ipcMain.handle('sync-push', async () => {
  const syncService = SyncService.getInstance()
  return syncService.pushData()
})

ipcMain.handle('sync-all', async () => {
  const syncService = SyncService.getInstance()
  return syncService.syncAll()
})

ipcMain.handle('sync-get-status', async () => {
  const db = DatabaseService.getInstance()
  return db.getSyncStatus()
})

// Network status handler
ipcMain.handle('get-network-status', async () => {
  const networkMonitor = NetworkMonitor.getInstance()
  return networkMonitor.getStatus()
})

// Draft/auto-save handlers for data persistence
ipcMain.handle('save-draft', async (_, formType: string, assignmentId: number, data: any) => {
  const db = DatabaseService.getInstance()
  db.saveDraft(formType, assignmentId, data)
  return { success: true }
})

ipcMain.handle('get-draft', async (_, formType: string, assignmentId: number) => {
  const db = DatabaseService.getInstance()
  return db.getDraft(formType, assignmentId)
})

ipcMain.handle('clear-draft', async (_, formType: string, assignmentId: number) => {
  const db = DatabaseService.getInstance()
  db.clearDraft(formType, assignmentId)
  return { success: true }
})

ipcMain.handle('get-all-drafts', async () => {
  const db = DatabaseService.getInstance()
  return db.getAllDrafts()
})

// Force database backup
ipcMain.handle('create-backup', async () => {
  const db = DatabaseService.getInstance()
  db.createBackup()
  return { success: true }
})

// Force checkpoint
ipcMain.handle('checkpoint', async () => {
  const db = DatabaseService.getInstance()
  db.checkpoint()
  return { success: true }
})
