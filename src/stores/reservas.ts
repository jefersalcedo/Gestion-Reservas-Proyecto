import { defineStore } from 'pinia'
import { reservasService, type Reserva } from '../services/reservas.service'

export const useReservasStore = defineStore('reservas', {
  state: () => ({
    reservas: [] as Reserva[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchReservas() {
      this.loading = true
      this.error = null
      try {
        const data = await reservasService.getMisReservas()
        this.reservas = data
      } catch (err: any) {
        this.error = err.message || 'Error al cargar reservas'
      } finally {
        this.loading = false
      }
    },

    async createReserva(reserva: Partial<Reserva>) {
      this.loading = true
      this.error = null
      try {
        await reservasService.createReserva(reserva)
        await this.fetchReservas()
      } catch (err: any) {
        this.error = err.message || 'Error al crear la reserva'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateReserva(id: string, updates: Partial<Reserva>) {
      this.loading = true
      this.error = null
      try {
        await reservasService.updateReserva(id, updates)
        await this.fetchReservas()
      } catch (err: any) {
        this.error = err.message || 'Error al actualizar la reserva'
        throw err
      } finally {
        this.loading = false
      }
    },

    async cancelReserva(id: string) {
      this.loading = true
      this.error = null
      try {
        await reservasService.cancelReserva(id)
        await this.fetchReservas()
      } catch (err: any) {
        this.error = err.message || 'Error al cancelar la reserva'
        throw err
      } finally {
        this.loading = false
      }
    }
  }
})
