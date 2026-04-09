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
            placeholder="Ej. Corte de Cabello"
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
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  margin: 0;
  color: #1a202c;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #a0aec0;
  transition: color 0.2s;
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
  font-weight: 600;
  color: #4a5568;
  font-size: 0.9rem;
}

input[type="text"],
input[type="number"],
textarea {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #f7fafc;
  color: #4a5568;
  padding: 0.75rem 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.error-message {
  color: #e53e3e;
  background: #fff5f5;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  border: 1px solid #feb2b2;
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
