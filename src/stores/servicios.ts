import { defineStore } from 'pinia'
import { serviciosService, type Servicio, type PrecioServicio } from '../services/servicios.service'

export const useServiciosStore = defineStore('servicios', {
  state: () => ({
    servicios: [] as Servicio[],
    preciosHistorial: {} as Record<string, PrecioServicio[]>,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchServicios() {
      this.loading = true
      this.error = null
      try {
        const data = await serviciosService.getServicios()
        this.servicios = data
      } catch (err: any) {
        this.error = err.message || 'Error al cargar servicios'
      } finally {
        this.loading = false
      }
    },

    async createServicio(servicio: Partial<Servicio>, precioInicial: number) {
      this.loading = true
      this.error = null
      try {
        await serviciosService.createServicio(servicio, precioInicial)
        await this.fetchServicios()
      } catch (err: any) {
        this.error = err.message || 'Error al crear servicio'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateServicio(id: string, updates: Partial<Servicio>) {
      this.loading = true
      this.error = null
      try {
        await serviciosService.updateServicio(id, updates)
        await this.fetchServicios()
      } catch (err: any) {
        this.error = err.message || 'Error al actualizar servicio'
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteServicio(id: string) {
      this.loading = true
      this.error = null
      try {
        await serviciosService.deleteServicio(id)
        this.servicios = this.servicios.filter(s => s.id !== id)
      } catch (err: any) {
        this.error = err.message || 'Error al eliminar servicio'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchPrecios(servicioId: string) {
      this.loading = true
      try {
        const data = await serviciosService.getPreciosByServicio(servicioId)
        this.preciosHistorial[servicioId] = data
      } catch (err: any) {
        this.error = err.message || 'Error al cargar historial de precios'
      } finally {
        this.loading = false
      }
    },

    async addPrecio(servicioId: string, precio: number) {
      this.loading = true
      try {
        await serviciosService.addPrecioServicio(servicioId, precio)
        await this.fetchPrecios(servicioId)
        // Actualizar el precio en la lista general también
        const index = this.servicios.findIndex(s => s.id === servicioId)
        if (index !== -1) {
          this.servicios[index].precio_actual = precio
        }
      } catch (err: any) {
        this.error = err.message || 'Error al agregar precio'
        throw err
      } finally {
        this.loading = false
      }
    }
  }
})
