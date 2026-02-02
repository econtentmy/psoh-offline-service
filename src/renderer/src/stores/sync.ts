import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface SyncStatus {
  pending: number
  synced: number
  lastSync: string | null
}

export interface PendingRecord {
  id: number
  type: 'tag' | 'lokasi' | 'aktiviti'
  data: any
  created_at: string
}

export const useSyncStore = defineStore('sync', () => {
  const status = ref<SyncStatus>({
    pending: 0,
    synced: 0,
    lastSync: null
  })
  const isSyncing = ref<boolean>(false)
  const syncProgress = ref<{ current: number; total: number }>({ current: 0, total: 0 })
  const pendingRecords = ref<{
    tags: any[]
    lokasi: any[]
    aktiviti: any[]
  }>({
    tags: [],
    lokasi: [],
    aktiviti: []
  })
  const error = ref<string | null>(null)

  const hasPendingRecords = computed(
    () =>
      pendingRecords.value.tags.length > 0 ||
      pendingRecords.value.lokasi.length > 0 ||
      pendingRecords.value.aktiviti.length > 0
  )

  const totalPending = computed(
    () =>
      pendingRecords.value.tags.length +
      pendingRecords.value.lokasi.length +
      pendingRecords.value.aktiviti.length
  )

  async function fetchSyncStatus(): Promise<void> {
    try {
      const data = await window.api.getSyncStatus()
      status.value = data
    } catch (e) {
      console.error('Failed to fetch sync status:', e)
    }
  }

  async function fetchPendingRecords(): Promise<void> {
    try {
      const data = await window.api.getPendingRecords()
      pendingRecords.value = data
    } catch (e) {
      console.error('Failed to fetch pending records:', e)
    }
  }

  async function pullData(): Promise<boolean> {
    isSyncing.value = true
    error.value = null
    try {
      const result = await window.api.pullData()
      if (result.success) {
        await fetchSyncStatus()
        return true
      } else {
        error.value = result.error || 'Gagal memuat turun data'
        return false
      }
    } catch (e) {
      error.value = 'Gagal memuat turun data'
      console.error('Pull data failed:', e)
      return false
    } finally {
      isSyncing.value = false
    }
  }

  async function pushData(): Promise<boolean> {
    isSyncing.value = true
    error.value = null
    try {
      const result = await window.api.pushData()
      if (result.success) {
        await fetchSyncStatus()
        await fetchPendingRecords()
        return true
      } else {
        error.value = result.error || 'Gagal menghantar data'
        return false
      }
    } catch (e) {
      error.value = 'Gagal menghantar data'
      console.error('Push data failed:', e)
      return false
    } finally {
      isSyncing.value = false
    }
  }

  async function syncAll(): Promise<boolean> {
    isSyncing.value = true
    error.value = null
    try {
      const result = await window.api.syncAll()
      if (result.success) {
        await fetchSyncStatus()
        await fetchPendingRecords()
        return true
      } else {
        error.value = result.error || 'Sinkronisasi gagal'
        return false
      }
    } catch (e) {
      error.value = 'Sinkronisasi gagal'
      console.error('Sync all failed:', e)
      return false
    } finally {
      isSyncing.value = false
    }
  }

  function setSyncProgress(current: number, total: number): void {
    syncProgress.value = { current, total }
  }

  // Setup listeners
  function setupListeners(): void {
    window.api.onSyncProgress((progress) => {
      syncProgress.value = progress
    })

    window.api.onSyncComplete(async () => {
      isSyncing.value = false
      await fetchSyncStatus()
      await fetchPendingRecords()
    })
  }

  return {
    status,
    isSyncing,
    syncProgress,
    pendingRecords,
    error,
    hasPendingRecords,
    totalPending,
    fetchSyncStatus,
    fetchPendingRecords,
    pullData,
    pushData,
    syncAll,
    setSyncProgress,
    setupListeners
  }
})
