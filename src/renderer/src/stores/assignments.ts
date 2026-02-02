import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Assignment {
  id: number
  remote_id: string
  permohonan_id: number
  status_id: number
  kaedah: string
  no_ruj_surat_lulus?: string
  status_tanah?: string
  daerah?: string
  kompartmen?: string
  sync_status: string
  sync_at: string | null
}

export const useAssignmentsStore = defineStore('assignments', () => {
  const assignments = ref<Assignment[]>([])
  const currentAssignment = ref<Assignment | null>(null)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  async function fetchAssignments(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const data = await window.api.getAssignments()
      assignments.value = data
    } catch (e) {
      error.value = 'Gagal memuatkan senarai tugasan'
      console.error('Failed to fetch assignments:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchAssignment(id: number): Promise<Assignment | null> {
    loading.value = true
    error.value = null
    try {
      const data = await window.api.getAssignment(id)
      currentAssignment.value = data
      return data
    } catch (e) {
      error.value = 'Gagal memuatkan maklumat tugasan'
      console.error('Failed to fetch assignment:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  function clearCurrent(): void {
    currentAssignment.value = null
  }

  return {
    assignments,
    currentAssignment,
    loading,
    error,
    fetchAssignments,
    fetchAssignment,
    clearCurrent
  }
})
