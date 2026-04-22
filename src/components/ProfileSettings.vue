<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../services/supabase'
import { useAuthStore } from '../stores/auth'

const emit = defineEmits(['close', 'updated'])
const authStore = useAuthStore()

const fullName = ref('')
const phone = ref('')
const loading = ref(false)
const message = ref({ text: '', type: '' })

onMounted(async () => {
  if (authStore.user) {
    fullName.value = authStore.fullName || ''
    // Fetch latest phone from DB
    const { data } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', authStore.user.id)
      .single()
    
    if (data) {
      phone.value = data.phone || ''
    }
  }
})

const handleUpdate = async () => {
  if (!authStore.user) return

  loading.value = true
  message.value = { text: '', type: '' }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.value,
        phone: phone.value,
        updated_at: new Date().toISOString()
      })
      .eq('id', authStore.user.id)

    if (error) throw error

    // Also update Auth Metadata for consistency
    await supabase.auth.updateUser({
      data: { full_name: fullName.value }
    })

    // Refresh store
    await authStore.setUser((await supabase.auth.getSession()).data.session)
    
    message.value = { text: 'Perfil actualizado con éxito', type: 'success' }
    setTimeout(() => emit('updated'), 1500)
  } catch (err: any) {
    message.value = { text: err.message || 'Error al actualizar', type: 'error' }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Configuración de Perfil</h2>
        <button @click="emit('close')" class="close-btn">&times;</button>
      </div>

      <form @submit.prevent="handleUpdate" class="settings-form">
        <div class="form-group">
          <label>Nombre Completo</label>
          <input v-model="fullName" type="text" placeholder="Tu nombre" required>
        </div>

        <div class="form-group">
          <label>Teléfono</label>
          <input v-model="phone" type="tel" placeholder="+57...">
        </div>

        <div v-if="message.text" :class="['message', message.type]">
          {{ message.text }}
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-save" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
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
  animation: scaleIn 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
}

.modal-header h2 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  color: var(--ivory);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 1.25rem;
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.3s;
}

.close-btn:hover {
  color: var(--wine);
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

input {
  background: var(--base-black);
  border: 1px solid var(--border);
  padding: 1rem;
  color: var(--ivory);
  border-radius: 4px;
  font-family: 'Montserrat', sans-serif;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: var(--primary);
}

.btn-save {
  background: var(--primary);
  color: var(--base-black);
  border: none;
  padding: 1rem;
  border-radius: 4px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  cursor: pointer;
  width: 100%;
  margin-top: 1rem;
  transition: all 0.3s;
}

.btn-save:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.message {
  padding: 1rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
}

.success {
  background: rgba(6, 95, 70, 0.1);
  color: var(--success);
  border: 1px solid var(--success);
}

.error {
  background: rgba(127, 29, 29, 0.1);
  color: var(--error);
  border: 1px solid var(--error);
}
</style>
