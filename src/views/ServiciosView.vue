<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useServiciosStore } from '../stores/servicios'
import type { Servicio } from '../services/servicios.service'
import ServicioForm from '../components/ServicioForm.vue'
import PreciosServicio from '../components/PreciosServicio.vue'

const store = useServiciosStore()

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
</script>

<template>
  <div class="servicios-container">
    <header class="view-header">
      <div>
        <h1>Gestión de Servicios</h1>
        <p>Administra los servicios de tu negocio y sus precios.</p>
      </div>
      <button @click="openCreate" class="btn-create">
        <span class="icon">+</span> Nuevo Servicio
      </button>
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
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
}

.view-header h1 {
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.view-header p {
  color: #718096;
  margin: 0.5rem 0 0;
}

.btn-create {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.table-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border: 1px solid #edf2f7;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: #f8fafc;
  padding: 1.25rem 1.5rem;
  text-align: left;
  font-weight: 700;
  color: #4a5568;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #edf2f7;
}

.data-table td {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #edf2f7;
  vertical-align: middle;
}

.servicio-name {
  font-weight: 700;
  color: #1a202c;
  font-size: 1.1rem;
}

.description-text {
  color: #718096;
  font-size: 0.95rem;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.current-price {
  font-weight: 800;
  color: #2c5282;
  font-size: 1.1rem;
}

.badge {
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  display: inline-block;
}

.badge-active {
  background: #c6f6d5;
  color: #22543d;
}

.badge-inactive {
  background: #fed7d7;
  color: #822727;
}

.actions-cell {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-icon {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.1rem;
}

.btn-icon:hover {
  background: #edf2f7;
  transform: translateY(-2px);
}

.btn-delete:hover {
  background: #fff5f5;
  border-color: #feb2b2;
}

.empty-row {
  padding: 4rem;
  text-align: center;
  color: #a0aec0;
  font-style: italic;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5rem;
  color: #718096;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  text-align: center;
  padding: 3rem;
  color: #e53e3e;
  background: #fff5f5;
  border-radius: 16px;
  margin-top: 2rem;
}

.btn-retry {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
</style>
