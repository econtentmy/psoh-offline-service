import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // API Settings
  getApiSettings: (): Promise<{ apiUrl: string; apiToken: string } | null> =>
    ipcRenderer.invoke('get-api-settings'),

  saveApiSettings: (settings: { apiUrl: string; apiToken: string }): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('save-api-settings', settings),

  testApiConnection: (
    apiUrl: string,
    apiToken: string
  ): Promise<{ success: boolean; user?: any; error?: string }> =>
    ipcRenderer.invoke('test-api-connection', apiUrl, apiToken),

  clearApiSettings: (): Promise<void> => ipcRenderer.invoke('clear-api-settings'),

  // Database operations
  getAssignments: (): Promise<any[]> => ipcRenderer.invoke('db-get-assignments'),

  getAssignment: (id: number): Promise<any> => ipcRenderer.invoke('db-get-assignment', id),

  getReferenceData: (table: string): Promise<any[]> =>
    ipcRenderer.invoke('db-get-reference-data', table),

  saveTagRecord: (data: any): Promise<{ success: boolean; id: number }> =>
    ipcRenderer.invoke('db-save-tag-record', data),

  saveLokasiRecord: (data: any): Promise<{ success: boolean; id: number }> =>
    ipcRenderer.invoke('db-save-lokasi-record', data),

  saveAktivitiRecord: (data: any): Promise<{ success: boolean; id: number }> =>
    ipcRenderer.invoke('db-save-aktiviti-record', data),

  getPendingRecords: (): Promise<{
    tags: any[]
    lokasi: any[]
    aktiviti: any[]
  }> => ipcRenderer.invoke('db-get-pending-records'),

  // Sync operations
  pullData: (): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('sync-pull'),

  pushData: (): Promise<{ success: boolean; synced: number; error?: string }> =>
    ipcRenderer.invoke('sync-push'),

  syncAll: (): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('sync-all'),

  getSyncStatus: (): Promise<{
    pending: number
    synced: number
    lastSync: string | null
  }> => ipcRenderer.invoke('sync-get-status'),

  // Network status
  getNetworkStatus: (): Promise<boolean> => ipcRenderer.invoke('get-network-status'),

  onNetworkStatus: (callback: (status: boolean) => void): void => {
    ipcRenderer.on('network-status', (_, status) => callback(status))
  },

  // Sync progress events
  onSyncProgress: (callback: (progress: { current: number; total: number }) => void): void => {
    ipcRenderer.on('sync-progress', (_, progress) => callback(progress))
  },

  onSyncComplete: (callback: (result: { success: boolean; synced: number }) => void): void => {
    ipcRenderer.on('sync-complete', (_, result) => callback(result))
  },

  // Draft/auto-save for data persistence
  saveDraft: (formType: string, assignmentId: number, data: any): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('save-draft', formType, assignmentId, data),

  getDraft: (formType: string, assignmentId: number): Promise<any | null> =>
    ipcRenderer.invoke('get-draft', formType, assignmentId),

  clearDraft: (formType: string, assignmentId: number): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('clear-draft', formType, assignmentId),

  getAllDrafts: (): Promise<any[]> => ipcRenderer.invoke('get-all-drafts'),

  // Database maintenance
  createBackup: (): Promise<{ success: boolean }> => ipcRenderer.invoke('create-backup'),

  checkpoint: (): Promise<{ success: boolean }> => ipcRenderer.invoke('checkpoint')
}

// Use `contextBridge` APIs to expose Electron APIs to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
