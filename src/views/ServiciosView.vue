<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useServiciosStore } from '../stores/servicios'
import type { Servicio } from '../services/servicios.service'
import ServicioForm from '../components/ServicioForm.vue'
import PreciosServicio from '../components/PreciosServicio.vue'
import { stripeService } from '../services/stripe.service'

const router = useRouter()
const authStore = useAuthStore()
const store = useServiciosStore()

const handleBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/dashboard-admin')
  }
}
const payingId = ref<string | null>(null)

// State for modals
const showForm = ref(false)
const showHistory = ref(false)
const selectedServicio = ref<Servicio | null>(null)

onMounted(async () => {
  await store.fetchServicios()
})

const openCreate = () => {
  selectedServicio.value = null
  showForm.value = true
}

const openEdit = (servicio: Servicio) => {
  selectedServicio.value = servicio
  showForm.value = true
}

const openHistory = (servicio: Servicio) => {
  selectedServicio.value = servicio
  showHistory.value = true
}

const handleDeleted = async (id: string) => {
  if (confirm('¿Estás seguro de que deseas eliminar este servicio? Todos los precios asociados se borrarán.')) {
    await store.deleteServicio(id)
  }
}

const refreshData = async () => {
  showForm.value = false
  await store.fetchServicios()
}

const handlePagar = async (servicio: Servicio) => {
  try {
    payingId.value = servicio.id
    await stripeService.crearCheckout(servicio.id)
  } catch (error: any) {
    alert('Error al procesar el pago: ' + error.message)
  } finally {
    payingId.value = null
  }
}
</script>

<template>
  <div class="servicios-container">
    <div class="top-nav">
      <button @click="handleBack" class="btn-back-link">
        Regresar
      </button>
      <button @click="openCreate" class="btn-create-mini">
        NUEVO SERVICIO
      </button>
    </div>

    <header class="view-header">
      <div class="header-content">
        <h1>Gestión de Servicios</h1>
        <p>Administra los servicios de tu negocio y sus precios.</p>
      </div>
    </header>

    <div v-if="store.loading && !store.servicios.length" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando servicios...</p>
    </div>

    <div v-else-if="store.error" class="error-container">
      <p>{{ store.error }}</p>
      <button @click="store.fetchServicios" class="btn-retry">Reintentar</button>
    </div>

    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Precio Actual</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="servicio in store.servicios" :key="servicio.id">
              <td>
                <div class="servicio-info">
                  <span class="servicio-name">{{ servicio.nombre }}</span>
                </div>
              </td>
              <td>
                <p class="description-text">{{ servicio.descripcion || 'Sin descripción' }}</p>
              </td>
              <td>
                <span :class="['badge', servicio.estado ? 'badge-active' : 'badge-inactive']">
                  {{ servicio.estado ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <span class="current-price">${{ (servicio.precio_actual || 0).toFixed(2) }}</span>
              </td>
              <td class="actions-cell">
                <button 
                  v-if="authStore.role !== 'admin'"
                  @click="handlePagar(servicio)" 
                  class="btn-icon btn-pay" 
                  title="Pagar servicio"
                  :disabled="payingId === servicio.id"
                >
                  <span v-if="payingId === servicio.id" class="loader-sm"></span>
                  <span v-else>💳</span>
                </button>
                <button @click="openHistory(servicio)" class="btn-icon" title="Historial de precios">
                  📊
                </button>
                <button @click="openEdit(servicio)" class="btn-icon" title="Editar">
                  ✏️
                </button>
                <button @click="handleDeleted(servicio.id)" class="btn-icon btn-delete" title="Eliminar">
                  🗑️
                </button>
              </td>
            </tr>
            <tr v-if="!store.servicios.length">
              <td colspan="5" class="empty-row">No hay servicios registrados. Comienza creando uno nuevo.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <ServicioForm 
      v-if="showForm" 
      :servicio="selectedServicio" 
      @close="showForm = false" 
      @saved="refreshData"
    />

    <PreciosServicio 
      v-if="showHistory && selectedServicio"
      :servicio="selectedServicio"
      @close="showHistory = false"
    />
  </div>
</template>

<style scoped>
.servicios-container {
  padding: 4rem 2rem;
  max-width: 100%;
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

.btn-create-mini {
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

.btn-create-mini:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.view-header {
  text-align: center;
  margin-bottom: 5rem;
}

.view-header h1 {
  font-family: 'Montserrat', sans-serif;
  font-size: 2.5rem;
  font-weight: 900;
  margin: 0;
  color: var(--ivory);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.view-header p {
  color: var(--text-muted);
  margin: 0;
  font-size: 1.1rem;
  font-weight: 300;
}

.btn-create {
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

.btn-create:hover {
  background-color: var(--primary-hover);
  transform: translateY(-3px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
}

.table-card {
  background: var(--charcoal);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
  width: 100%;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: rgba(255, 255, 255, 0.02);
  padding: 1.5rem 2rem;
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  border-bottom: 1px solid var(--border);
  font-weight: 600;
}

.data-table td {
  padding: 2rem;
  border-bottom: 1px solid var(--border);
  color: var(--ivory);
}

.servicio-name {
  font-family: 'Montserrat', sans-serif;
  font-weight: 800;
  font-size: 1.35rem;
  color: var(--ivory);
}

.description-text {
  color: var(--text-muted);
  font-weight: 300;
}

.current-price {
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  color: var(--primary);
  font-size: 1.5rem;
}

.badge {
  padding: 0.5rem 1.25rem;
  border-radius: 0;
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

.badge-active {
  background: rgba(6, 95, 70, 0.1);
  color: var(--success);
  border: 1px solid rgba(6, 95, 70, 0.3);
}

.badge-inactive {
  background: rgba(127, 29, 29, 0.1);
  color: var(--error);
  border: 1px solid rgba(127, 29, 29, 0.3);
}

.btn-icon {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  border-radius: 4px;
  padding: 0.75rem;
  transition: all 0.3s;
}

.btn-icon:hover {
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-3px);
}

.btn-delete:hover {
  border-color: var(--error);
  color: var(--error);
  background: rgba(127, 29, 29, 0.05);
}


</style>
