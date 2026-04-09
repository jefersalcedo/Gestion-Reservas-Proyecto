<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useReservasStore } from '../stores/reservas'
import type { Reserva } from '../services/reservas.service'
import ReservaForm from '../components/ReservaForm.vue'

const store = useReservasStore()
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
    <header class="page-header">
      <div>
        <h1>Mis Reservas</h1>
        <p>Gestiona tus citas y servicios programados.</p>
        <button @click="showCancelled = !showCancelled" class="btn-history">
          {{ showCancelled ? '🙈 Ocultar canceladas' : '📂 Ver historial / canceladas' }}
        </button>
      </div>
      <button @click="openCreate" class="btn-new">
        <span>+</span> Nueva Reserva
      </button>
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
            {{ reserva.estado.toUpperCase() }}
          </span>
          <span class="reserva-date">{{ formatDate(reserva.fecha) }}</span>
        </div>
        
        <div class="card-body">
          <h3 class="servicio-name">{{ reserva.servicios?.nombre }}</h3>
          <div class="reserva-time">
            <span class="clock-icon">🕒</span>
            {{ formatTime(reserva.hora) }} hs
          </div>
        </div>

        <div class="card-footer" v-if="reserva.estado !== 'cancelada'">
          <button @click="openEdit(reserva)" class="btn-action btn-edit">
            Editar
          </button>
          <button @click="handleCancel(reserva.id)" class="btn-action btn-cancel">
            Cancelar
          </button>
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
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.05em;
}

.page-header p {
  color: #64748b;
  margin: 0.5rem 0 1rem;
  font-size: 1.1rem;
}

.btn-history {
  background: transparent;
  border: 1px solid #e2e8f0;
  color: #6366f1;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-history:hover {
  background: #f1f5f9;
  border-color: #6366f1;
}

.card-cancelled {
  opacity: 0.6;
  filter: grayscale(0.5);
  border-style: dashed;
}

.btn-new {
  background: #6366f1;
  color: white;
  padding: 0.875rem 1.75rem;
  border: none;
  border-radius: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
}

.btn-new:hover {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(99, 102, 241, 0.4);
}

.reservas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
}

.reserva-card {
  background: white;
  border-radius: 24px;
  padding: 1.5rem;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.reserva-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border-color: #e2e8f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.status-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.status-pending { background: #fef3c7; color: #92400e; }
.status-confirmed { background: #dcfce7; color: #166534; }
.status-cancelled { background: #fee2e2; color: #991b1b; }

.reserva-date {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
}

.servicio-name {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: #1e293b;
}

.reserva-time {
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #475569;
  font-weight: 600;
}

.card-footer {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
  display: flex;
  gap: 1rem;
}

.btn-action {
  flex: 1;
  padding: 0.75rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn-edit:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.btn-cancel {
  background: white;
  color: #e11d48;
  border: 1px solid #fecdd3;
}

.btn-cancel:hover {
  background: #fff1f2;
}

.cancelled-msg {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.9rem;
  text-align: center;
  width: 100%;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 5rem 2rem;
  background: #f8fafc;
  border-radius: 32px;
  border: 2px dashed #e2e8f0;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.mt-4 { margin-top: 1rem; }
</style>
