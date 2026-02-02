import { ElectronAPI } from '@electron-toolkit/preload'

interface ApiSettings {
  apiUrl: string
  apiToken: string
}

interface SyncStatus {
  pending: number
  synced: number
  lastSync: string | null
}

interface Api {
  // API Settings
  getApiSettings: () => Promise<ApiSettings | null>
  saveApiSettings: (settings: ApiSettings) => Promise<{ success: boolean }>
  testApiConnection: (
    apiUrl: string,
    apiToken: string
  ) => Promise<{ success: boolean; user?: any; error?: string }>
  clearApiSettings: () => Promise<void>

  // Database operations
  getAssignments: () => Promise<any[]>
  getAssignment: (id: number) => Promise<any>
  getReferenceData: (table: string) => Promise<any[]>
  saveTagRecord: (data: any) => Promise<{ success: boolean; id: number }>
  saveLokasiRecord: (data: any) => Promise<{ success: boolean; id: number }>
  saveAktivitiRecord: (data: any) => Promise<{ success: boolean; id: number }>
  getPendingRecords: () => Promise<{
    tags: any[]
    lokasi: any[]
    aktiviti: any[]
  }>

  // Sync operations
  pullData: () => Promise<{ success: boolean; error?: string }>
  pushData: () => Promise<{ success: boolean; synced: number; error?: string }>
  syncAll: () => Promise<{ success: boolean; error?: string }>
  getSyncStatus: () => Promise<SyncStatus>

  // Network status
  getNetworkStatus: () => Promise<boolean>
  onNetworkStatus: (callback: (status: boolean) => void) => void
  onSyncProgress: (callback: (progress: { current: number; total: number }) => void) => void
  onSyncComplete: (callback: (result: { success: boolean; synced: number }) => void) => void

  // Draft/auto-save for data persistence
  saveDraft: (formType: string, assignmentId: number, data: any) => Promise<{ success: boolean }>
  getDraft: (formType: string, assignmentId: number) => Promise<any | null>
  clearDraft: (formType: string, assignmentId: number) => Promise<{ success: boolean }>
  getAllDrafts: () => Promise<any[]>

  // Database maintenance
  createBackup: () => Promise<{ success: boolean }>
  checkpoint: () => Promise<{ success: boolean }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
