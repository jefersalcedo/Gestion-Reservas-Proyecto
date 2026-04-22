<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useReservasStore } from '../stores/reservas'
import type { Reserva } from '../services/reservas.service'
import ReservaForm from '../components/ReservaForm.vue'
import { stripeService } from '../services/stripe.service'

const router = useRouter()
const store = useReservasStore()

const handleBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/dashboard-user')
  }
}
const payingId = ref<string | null>(null)
const showForm = ref(false)
const selectedReserva = ref<Reserva | null>(null)
const showCancelled = ref(false)

onMounted(async () => {
  await store.fetchReservas()
})

const filteredReservas = computed(() => {
  if (showCancelled.value) {
    return store.reservas
  }
  return store.reservas.filter(r => r.estado !== 'cancelada')
})

const openCreate = () => {
  selectedReserva.value = null
  showForm.value = true
}

const openEdit = (reserva: Reserva) => {
  selectedReserva.value = reserva
  showForm.value = true
}

const handleCancel = async (id: string) => {
  if (confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
    await store.cancelReserva(id)
  }
}

const onSaved = async () => {
  showForm.value = false
  await store.fetchReservas()
}

const handlePagarReserva = async (reserva: Reserva) => {
  try {
    payingId.value = reserva.id
    // Enviamos tanto el ID del servicio como el de la reserva
    await stripeService.crearCheckout(reserva.servicio_id, reserva.id)
  } catch (error: any) {
    alert('Error al procesar el pago: ' + error.message)
  } finally {
    payingId.value = null
  }
}

const getStatusClass = (estado: string) => {
  switch (estado) {
    case 'confirmada': return 'status-confirmed'
    case 'cancelada': return 'status-cancelled'
    default: return 'status-pending'
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatTime = (timeStr: string) => {
  return timeStr.substring(0, 5)
}
</script>

<template>
  <div class="reservas-container">
    <div class="top-nav">
      <button @click="handleBack" class="btn-back-link">
        Regresar
      </button>
      <button @click="openCreate" class="btn-new-mini">
        NUEVA RESERVA
      </button>
    </div>

    <header class="page-header">
      <div class="header-content">
        <h1>Mis Reservas</h1>
        <p>Gestiona tus citas y servicios programados.</p>
        <button @click="showCancelled = !showCancelled" class="btn-history">
          {{ showCancelled ? 'Ocultar canceladas' : 'Ver historial / canceladas' }}
        </button>
      </div>
    </header>

    <div v-if="store.loading && !store.reservas.length" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando tus reservas...</p>
    </div>

    <div v-else-if="store.error" class="error-card">
      <p>{{ store.error }}</p>
      <button @click="store.fetchReservas" class="btn-retry">Intentar de nuevo</button>
    </div>

    <div v-else class="reservas-grid">
      <div v-for="reserva in filteredReservas" :key="reserva.id" class="reserva-card" :class="{ 'card-cancelled': reserva.estado === 'cancelada' }">
        <div class="card-header">
          <span :class="['status-badge', getStatusClass(reserva.estado)]">
            {{ reserva.estado === 'pendiente' ? 'PENDIENTE DE PAGO' : reserva.estado.toUpperCase() }}
          </span>
          <div class="reserva-date">{{ formatDate(reserva.fecha) }}</div>
        </div>
        
        <div class="card-body">
          <h3 class="servicio-name">{{ reserva.servicios?.nombre }}</h3>
          <div class="reserva-time">
            <span class="clock-icon">🕒</span>
            {{ formatTime(reserva.hora) }} hs
          </div>
        </div>

        <div class="card-footer" v-if="reserva.estado !== 'cancelada'">
          <button 
            v-if="reserva.estado === 'pendiente'" 
            @click="handlePagarReserva(reserva)" 
            class="btn-action btn-pay full-width"
            :disabled="payingId === reserva.id"
          >
            <span v-if="payingId === reserva.id" class="loader-sm"></span>
            <span v-else>Pagar Reserva</span>
          </button>
          
          <div class="footer-actions">
            <button @click="openEdit(reserva)" class="btn-action btn-edit">
              Editar
            </button>
            <button @click="handleCancel(reserva.id)" class="btn-action btn-cancel">
              Cancelar
            </button>
          </div>
        </div>
        <div class="card-footer disabled" v-else>
          <p class="cancelled-msg">Esta reserva ha sido cancelada.</p>
        </div>
      </div>

      <div v-if="!store.reservas.length" class="empty-state">
        <div class="empty-icon">📅</div>
        <h3>No tienes reservas</h3>
        <p>Aún no has programado ningún servicio. ¡Comienza ahora!</p>
        <button @click="openCreate" class="btn-primary mt-4">Hacer mi primera reserva</button>
      </div>
    </div>

    <ReservaForm 
      v-if="showForm" 
      :reserva="selectedReserva" 
      @close="showForm = false" 
      @saved="onSaved"
    />
  </div>
</template>

<style scoped>
.reservas-container {
  padding: 4rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.btn-back-link {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: color 0.3s;
}

.btn-back-link:hover {
  color: var(--primary);
}

.btn-new-mini {
  background: var(--primary);
  color: var(--base-black);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 800;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-new-mini:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.page-header {
  text-align: center;
  margin-bottom: 5rem;
}

.page-header h1 {
  font-family: 'Montserrat', sans-serif;
  font-size: 2.5rem;
  font-weight: 900;
  margin: 0;
  color: var(--ivory);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.page-header p {
  color: var(--text-muted);
  margin-bottom: 2rem;
  font-size: 1.1rem;
  font-weight: 300;
}

.btn-history {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--primary);
  padding: 0.6rem 1.25rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-history:hover {
  background: rgba(212, 175, 55, 0.05);
  border-color: var(--primary-hover);
  color: var(--primary-hover);
}

.btn-new {
  background-color: var(--primary);
  color: var(--base-black);
  padding: 1.25rem 2.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: all 0.4s ease;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.btn-new:hover {
  background-color: var(--primary-hover);
  transform: translateY(-3px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
}

.reservas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 3rem;
}

.reserva-card {
  background: var(--charcoal);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 3rem;
  transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
  display: flex;
  flex-direction: column;
}

.reserva-card:hover {
  transform: translateY(-12px);
  border-color: var(--primary);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.status-badge {
  padding: 0.4rem 1rem;
  border-radius: 0;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  display: inline-block;
  width: fit-content;
}

.reserva-date {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  text-transform: capitalize;
}

.status-pending { background: rgba(212, 175, 55, 0.1); color: var(--primary); border: 1px solid rgba(212, 175, 55, 0.3); }
.status-confirmed { background: rgba(6, 95, 70, 0.1); color: var(--success); border: 1px solid rgba(6, 95, 70, 0.3); }
.status-cancelled { background: rgba(127, 29, 29, 0.1); color: var(--error); border: 1px solid rgba(127, 29, 29, 0.3); }

.servicio-name {
  font-family: 'Montserrat', sans-serif;
  color: var(--ivory);
  font-size: 1.75rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.reserva-time {
  color: var(--text-muted);
  font-weight: 300;
  letter-spacing: 0.05em;
}

.card-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.footer-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.btn-action {
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.8rem 1.5rem;
  font-size: 0.8rem;
  flex: 1;
}

.btn-pay.full-width {
  width: 100%;
}

.btn-pay {
  background: var(--primary);
  color: var(--base-black);
  border: none;
}

.btn-pay:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.btn-edit {
  background: transparent;
  color: var(--ivory);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-edit:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.btn-cancel {
  background: transparent;
  color: var(--error);
  border: 1px solid rgba(127, 29, 29, 0.3);
}

.btn-cancel:hover {
  background: rgba(127, 29, 29, 0.05);
}


</style>
