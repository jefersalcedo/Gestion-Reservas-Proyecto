<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useServiciosStore } from '../stores/servicios'
import type { Servicio } from '../services/servicios.service'

const props = defineProps<{
  servicio?: Servicio | null
}>()

const emit = defineEmits(['close', 'saved'])

const store = useServiciosStore()
const loading = ref(false)
const error = ref('')

const form = ref({
  nombre: '',
  descripcion: '',
  estado: true,
  precio: 0
})

onMounted(() => {
  if (props.servicio) {
    form.value.nombre = props.servicio.nombre
    form.value.descripcion = props.servicio.descripcion || ''
    form.value.estado = props.servicio.estado
    form.value.precio = props.servicio.precio_actual || 0
  }
})

const handleSubmit = async () => {
  if (!form.value.nombre) {
    error.value = 'El nombre es obligatorio'
    return
  }
  if (!props.servicio && form.value.precio <= 0) {
    error.value = 'El precio inicial debe ser mayor a 0'
    return
  }

  loading.value = true
  error.value = ''
  
  try {
    if (props.servicio) {
      await store.updateServicio(props.servicio.id, {
        nombre: form.value.nombre,
        descripcion: form.value.descripcion,
        estado: form.value.estado
      })
    } else {
      await store.createServicio({
        nombre: form.value.nombre,
        descripcion: form.value.descripcion,
        estado: form.value.estado
      }, form.value.precio)
    }
    emit('saved')
  } catch (err: any) {
    error.value = err.message || 'Error al guardar el servicio'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ servicio ? 'Editar Servicio' : 'Nuevo Servicio' }}</h2>
        <button @click="emit('close')" class="close-btn">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="service-form">
        <div class="form-group">
          <label for="nombre">Nombre del Servicio</label>
          <input 
            id="nombre" 
            v-model="form.nombre" 
            type="text" 
            placeholder="Ingrese el nombre"
            required
          >
        </div>

        <div class="form-group">
          <label for="descripcion">Descripción</label>
          <textarea 
            id="descripcion" 
            v-model="form.descripcion" 
            placeholder="Describe el servicio..."
            rows="3"
          ></textarea>
        </div>

        <div v-if="!servicio" class="form-group">
          <label for="precio">Precio Inicial</label>
          <input 
            id="precio" 
            v-model.number="form.precio" 
            type="number" 
            step="0.01"
            min="0"
            required
          >
        </div>

        <div v-if="servicio" class="form-group checkbox-group">
          <label class="switch">
            <input type="checkbox" v-model="form.estado">
            <span class="slider round"></span>
          </label>
          <span>{{ form.estado ? 'Activo' : 'Inactivo' }}</span>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="form-actions">
          <button type="button" @click="emit('close')" class="btn-secondary" :disabled="loading">
            Cancelar
          </button>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Guardar Servicio' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
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
  max-width: 500px;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
  animation: slideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
}

.modal-header h2 {
  margin: 0;
  color: var(--ivory);
  font-size: 1.25rem;
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
  transition: color 0.3s;
}

.close-btn:hover {
  color: var(--wine);
}

.close-btn:hover {
  color: #4a5568;
}

.service-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 700;
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

input[type="text"],
input[type="number"],
textarea {
  background: var(--base-black);
  border: 1px solid var(--border);
  padding: 1rem;
  color: var(--ivory);
  border-radius: 4px;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary);
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
  gap: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-primary {
  background: var(--primary);
  color: var(--base-black);
  padding: 1rem 2rem;
  border: none;
  border-radius: 4px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: var(--text-muted);
  padding: 1rem 2rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  border-color: var(--ivory);
  color: var(--ivory);
}

.error-message {
  color: var(--error);
  background: rgba(127, 29, 29, 0.1);
  padding: 1rem;
  border-radius: 4px;
  font-size: 0.85rem;
  border: 1px solid var(--error);
  text-align: center;
}

/* Switch Styles */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #667eea;
}

input:focus + .slider {
  box-shadow: 0 0 1px #667eea;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>
