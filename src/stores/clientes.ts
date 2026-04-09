import { defineStore } from 'pinia'
import { ref } from 'vue'
import { clientesService, type Cliente } from '../services/clientes.service'

export const useClientesStore = defineStore('clientes', () => {
  const clientes = ref<Cliente[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchClientes() {
    loading.value = true
    error.value = null
    try {
      clientes.value = await clientesService.getAll()
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function addCliente(cliente: Cliente) {
    loading.value = true
    try {
      const newCliente = await clientesService.create(cliente)
      clientes.value.push(newCliente)
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateCliente(id: string, cliente: Partial<Cliente>) {
    loading.value = true
    try {
      const updated = await clientesService.update(id, cliente)
      const index = clientes.value.findIndex(c => c.id === id)
      if (index !== -1) {
        clientes.value[index] = updated
      }
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function removeCliente(id: string) {
    loading.value = true
    try {
      await clientesService.delete(id)
      clientes.value = clientes.value.filter(c => c.id !== id)
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    clientes,
    loading,
    error,
    fetchClientes,
    addCliente,
    updateCliente,
    removeCliente
  }
})
