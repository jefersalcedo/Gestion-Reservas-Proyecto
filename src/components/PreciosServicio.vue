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
              {{ loading ? 'Cargando' : 'Agregar' }}
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
                  {{ precio.estado ? 'Vigente' : 'Anterior' }}
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
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: var(--charcoal);
  padding: 3rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  width: 100%;
  max-width: 700px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
  animation: slideUp 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2.5rem;
}

.modal-header h2 {
  margin: 0;
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  color: var(--ivory);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 1.5rem;
}

.service-name {
  color: var(--primary);
  margin: 0.5rem 0 0;
  font-weight: 600;
  font-size: 1.1rem;
  font-family: 'Montserrat', sans-serif;
}

.close-btn {
  background: transparent;
  border: 1px solid var(--border);
  width: 35px;
  height: 35px;
  border-radius: 50%;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.close-btn:hover {
  background: var(--wine);
  border-color: var(--wine);
  color: white;
}

.add-price-section {
  background: rgba(255, 255, 255, 0.02);
  padding: 2rem;
  border-radius: 4px;
  margin-bottom: 2.5rem;
  border: 1px solid var(--border);
}

.input-with-button {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.input-with-button input {
  flex: 1;
  background: var(--base-black);
  border: 1px solid var(--border);
  padding: 1rem;
  color: var(--ivory);
  border-radius: 4px;
  font-family: 'Montserrat', sans-serif;
}

.btn-primary {
  padding: 0.75rem 2rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  font-size: 0.8rem;
}

.error-text {
  color: var(--wine);
  font-size: 0.85rem;
  margin-top: 0.75rem;
  font-weight: 500;
}

.history-table-container {
  overflow-y: auto;
  flex: 1;
  margin-right: -1rem;
  padding-right: 1rem;
}

/* Scrollbar styling */
.history-table-container::-webkit-scrollbar { width: 4px; }
.history-table-container::-webkit-scrollbar-track { background: transparent; }
.history-table-container::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

.history-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 0.75rem;
}

.history-table th {
  text-align: left;
  padding: 0 1rem 1rem;
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-weight: 700;
}

.history-table td {
  padding: 1.25rem 1rem;
  background: rgba(255, 255, 255, 0.01);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  color: var(--ivory);
  font-size: 0.9rem;
}

.history-table tr td:first-child { border-left: 1px solid var(--border); border-radius: 4px 0 0 4px; }
.history-table tr td:last-child { border-right: 1px solid var(--border); border-radius: 0 4px 4px 0; }

.price-cell {
  font-weight: 800;
  color: var(--primary);
  font-size: 1.1rem;
}

.badge {
  padding: 0.4rem 1rem;
  border-radius: 2px;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.badge-active {
  background: rgba(6, 95, 70, 0.15);
  color: var(--success);
  border: 1px solid var(--success);
}

.badge-inactive {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
  font-style: italic;
}
</style>
