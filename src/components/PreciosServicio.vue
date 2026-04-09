<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useServiciosStore } from '../stores/servicios'
import type { Servicio } from '../services/servicios.service'

const props = defineProps<{
  servicio: Servicio
}>()

const emit = defineEmits(['close'])

const store = useServiciosStore()
const newPrecio = ref(0)
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  await store.fetchPrecios(props.servicio.id)
})

const handleAddPrecio = async () => {
  if (newPrecio.value <= 0) {
    error.value = 'El precio debe ser mayor a 0'
    return
  }

  loading.value = true
  error.value = ''
  try {
    await store.addPrecio(props.servicio.id, newPrecio.value)
    newPrecio.value = 0
  } catch (err: any) {
    error.value = err.message || 'Error al agregar precio'
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h2>Historial de Precios</h2>
          <p class="service-name">{{ servicio.nombre }}</p>
        </div>
        <button @click="emit('close')" class="close-btn">&times;</button>
      </div>

      <div class="add-price-section">
        <div class="form-group">
          <label>Nuevo Precio</label>
          <div class="input-with-button">
            <input 
              v-model.number="newPrecio" 
              type="number" 
              step="0.01" 
              placeholder="0.00"
              :disabled="loading"
            >
            <button 
              @click="handleAddPrecio" 
              class="btn-primary" 
              :disabled="loading || newPrecio <= 0"
            >
              {{ loading ? '...' : 'Agregar' }}
            </button>
          </div>
        </div>
        <p v-if="error" class="error-text">{{ error }}</p>
      </div>

      <div class="history-table-container">
        <table class="history-table">
          <thead>
            <tr>
              <th>Precio</th>
              <th>Fecha de Registro</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="precio in store.preciosHistorial[servicio.id] || []" :key="precio.id">
              <td class="price-cell">${{ precio.precio.toFixed(2) }}</td>
              <td>{{ formatDate(precio.created_at) }}</td>
              <td>
                <span :class="['badge', precio.estado ? 'badge-active' : 'badge-inactive']">
                  {{ precio.estado ? 'Vigente' : 'Inactivo' }}
                </span>
              </td>
            </tr>
            <tr v-if="!(store.preciosHistorial[servicio.id]?.length)">
              <td colspan="3" class="empty-state">No hay historial disponible</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  margin: 0;
  color: #1a202c;
  font-size: 1.5rem;
}

.service-name {
  color: #718096;
  margin: 0.25rem 0 0;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #a0aec0;
}

.add-price-section {
  background: #f7fafc;
  padding: 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.input-with-button {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.input-with-button input {
  flex: 1;
  padding: 0.6rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.error-text {
  color: #e53e3e;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.history-table-container {
  overflow-y: auto;
  flex: 1;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th {
  text-align: left;
  padding: 0.75rem;
  border-bottom: 2px solid #edf2f7;
  color: #4a5568;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.history-table td {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #edf2f7;
  color: #2d3748;
}

.price-cell {
  font-weight: 700;
  color: #2b6cb0;
}

.badge {
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-active {
  background: #c6f6d5;
  color: #22543d;
}

.badge-inactive {
  background: #fed7d7;
  color: #822727;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #a0aec0;
}
</style>
