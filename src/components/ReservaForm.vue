<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useReservasStore } from '../stores/reservas'
import { useServiciosStore } from '../stores/servicios'
import type { Reserva } from '../services/reservas.service'

const props = defineProps<{
  reserva?: Reserva | null
}>()

const emit = defineEmits(['close', 'saved'])

const reservasStore = useReservasStore()
const serviciosStore = useServiciosStore()

const loading = ref(false)
const error = ref('')

const form = ref({
  servicio_id: '',
  fecha: '',
  hora: '',
})

// Mínimo mañana para reservas
const minDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
})

onMounted(async () => {
  if (serviciosStore.servicios.length === 0) {
    await serviciosStore.fetchServicios()
  }

  if (props.reserva) {
    form.value.servicio_id = props.reserva.servicio_id
    form.value.fecha = props.reserva.fecha
    // Formato de hora de Supabase puede ser HH:mm:ss o HH:mm
    form.value.hora = props.reserva.hora.substring(0, 5)
  }
})

const handleSubmit = async () => {
  if (!form.value.servicio_id || !form.value.fecha || !form.value.hora) {
    error.value = 'Todos los campos son obligatorios'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const payload = {
      servicio_id: form.value.servicio_id,
      fecha: form.value.fecha,
      hora: form.value.hora + ':00', // Asegurar formato HH:mm:ss
    }

    if (props.reserva) {
      await reservasStore.updateReserva(props.reserva.id, payload)
    } else {
      await reservasStore.createReserva(payload)
    }
    emit('saved')
  } catch (err: any) {
    error.value = err.message || 'Error al procesar la reserva'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ reserva ? 'Editar Reserva' : 'Nueva Reserva' }}</h2>
        <button @click="emit('close')" class="close-btn">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="reserva-form">
        <div class="form-group">
          <label for="servicio">Servicio</label>
          <select id="servicio" v-model="form.servicio_id" required :disabled="!!reserva">
            <option value="" disabled>Seleccione un servicio</option>
            <option 
              v-for="servicio in serviciosStore.servicios" 
              :key="servicio.id" 
              :value="servicio.id"
            >
              {{ servicio.nombre }} - ${{ servicio.precio_actual?.toFixed(2) }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label for="fecha">Fecha</label>
            <input 
              id="fecha" 
              v-model="form.fecha" 
              type="date" 
              :min="minDate"
              required
            >
          </div>

          <div class="form-group flex-1">
            <label for="hora">Hora</label>
            <input 
              id="hora" 
              v-model="form.hora" 
              type="time" 
              step="1800"
              required
            >
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="form-actions">
          <button type="button" @click="emit('close')" class="btn-secondary" :disabled="loading">
            Cancelar
          </button>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Procesando...' : (reserva ? 'Actualizar Reserva' : 'Confirmar Reserva') }}
          </button>
        </div>
      </form>
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
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  padding: 2.5rem;
  border-radius: 24px;
  width: 100%;
  max-width: 550px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-in {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.025em;
}

.close-btn {
  background: #f1f5f9;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.reserva-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: flex;
  gap: 1.5rem;
}

.flex-1 { flex: 1; }

label {
  font-weight: 700;
  color: #475569;
  font-size: 0.9rem;
}

select, input {
  padding: 0.875rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  color: #1e293b;
  transition: all 0.2s;
}

select:focus, input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.error-message {
  background: #fff1f2;
  color: #e11d48;
  padding: 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid #fecdd3;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
}

.btn-secondary {
  background: #f8fafc;
  color: #64748b;
  padding: 1rem 2rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #f1f5f9;
}
</style>
