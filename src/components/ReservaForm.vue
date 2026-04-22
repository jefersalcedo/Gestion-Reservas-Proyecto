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
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  background: var(--base-black);
  padding: 4rem;
  border-radius: 8px;
  width: 100%;
  max-width: 650px;
  border: 1px solid var(--border);
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8);
  animation: modal-in 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
}

@keyframes modal-in {
  from { opacity: 0; transform: translateY(40px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3.5rem;
}

.modal-header h2 {
  font-family: 'Montserrat', sans-serif;
  margin: 0;
  font-size: 2.25rem;
  font-weight: 900;
  color: var(--ivory);
}

.close-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 44px;
  height: 44px;
  border-radius: 4px;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.close-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.reserva-form {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: flex;
  gap: 2rem;
}

.flex-1 { flex: 1; }

label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--text-muted);
}

select, input {
  padding: 1.25rem;
  background: var(--charcoal);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 1rem;
  color: var(--ivory);
  transition: all 0.3s;
  font-family: 'Montserrat', sans-serif;
}

select:focus, input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary);
}

.error-message {
  background: rgba(127, 29, 29, 0.1);
  color: var(--error);
  padding: 1.25rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid rgba(127, 29, 29, 0.3);
  text-align: center;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1.5rem;
  margin-top: 2rem;
}

.btn-primary {
  background-color: var(--primary);
  color: var(--base-black);
  padding: 1.25rem 2.5rem;
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  border: none;
}

.btn-secondary {
  background: transparent;
  color: var(--text-muted);
  padding: 1.25rem 2.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.btn-secondary:hover {
  border-color: var(--primary);
  color: var(--primary);
}

</style>
