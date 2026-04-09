<template>
  <div class="clientes-container">
    <header class="page-header">
      <div class="header-content">
        <h1>Gestión de Clientes</h1>
      </div>
      <button @click="openModal()" class="btn-primary">
        <span class="icon">+</span> Nuevo Cliente
      </button>
    </header>

    <div class="search-bar">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Buscar por nombre o correo..."
        class="search-input"
      />
    </div>

    <div v-if="clientesStore.loading" class="loading-state">
      <div class="loader"></div>
      <p>Cargando clientes...</p>
    </div>

    <div v-else-if="clientesStore.error" class="error-state">
      <p>Error: {{ clientesStore.error }}</p>
      <button @click="clientesStore.fetchClientes()">Reintentar</button>
    </div>

    <div v-else class="clientes-grid">
      <div v-for="cliente in filteredClientes" :key="cliente.id" class="cliente-card">
        <div class="card-header">
          <h3>{{ cliente.full_name }}</h3>
          <div class="actions">
            <button @click="openModal(cliente)" class="btn-icon" title="Editar">
              ✏️
            </button>
            <button @click="confirmDelete(cliente)" class="btn-icon btn-danger" title="Eliminar">
              🗑️
            </button>
          </div>
        </div>
        <div class="card-body">
          <p v-if="cliente.email" class="info-item">
            <span class="label">📧</span> {{ cliente.email }}
          </p>
          <p v-if="cliente.phone" class="info-item">
            <span class="label">📞</span> {{ cliente.phone }}
          </p>
          <p class="role-badge">Creador</p>
        </div>
      </div>
      
      <div v-if="filteredClientes.length === 0" class="empty-state">
        <p>No se encontraron clientes.</p>
      </div>
    </div>

    <!-- Modal for Create/Edit -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h2>{{ editingId ? 'Editar Cliente' : 'Nuevo Cliente' }}</h2>
        <form @submit.prevent="saveCliente" class="client-form">
          <div class="form-group">
            <label for="full_name">Nombre Completo *</label>
            <input v-model="form.full_name" id="full_name" type="text" required />
          </div>
          <div class="form-group">
            <label for="email">Correo Electrónico (Solo Lectura)</label>
            <input :value="form.email" id="email" type="email" disabled placeholder="El email se gestiona desde Auth" />
          </div>
          <div class="form-group">
            <label for="phone">Teléfono / WhatsApp</label>
            <input v-model="form.phone" id="phone" type="tel" placeholder="+57..." />
          </div>
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? 'Actualizando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useClientesStore } from '../stores/clientes'
import type { Cliente } from '../services/clientes.service'

const clientesStore = useClientesStore()
const searchQuery = ref('')
const showModal = ref(false)
const editingId = ref<string | null>(null)
const loading = ref(false)

const form = reactive<Partial<Cliente>>({
  full_name: '',
  phone: '',
  email: ''
})

onMounted(() => {
  clientesStore.fetchClientes()
})

const filteredClientes = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return clientesStore.clientes.filter(c => {
    const name = c.full_name?.toLowerCase() || ''
    const email = c.email?.toLowerCase() || ''
    return name.includes(query) || email.includes(query)
  })
})

function openModal(cliente?: Cliente) {
  if (cliente) {
    editingId.value = cliente.id || null
    form.full_name = cliente.full_name
    form.phone = cliente.phone || ''
    form.email = cliente.email || ''
  } else {
    editingId.value = null
    form.full_name = ''
    form.phone = ''
    form.email = ''
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveCliente() {
  loading.value = true
  try {
    if (editingId.value) {
      await clientesStore.updateCliente(editingId.value, { 
        full_name: form.full_name, 
        phone: form.phone 
      })
    } else {
      // Nota: Para profiles, la creación suele ser vía Auth SignUp
      await clientesStore.addCliente({
        full_name: form.full_name!,
        phone: form.phone
      } as Cliente)
    }
    closeModal()
  } catch (err: any) {
    console.error('Error saving client:', err)
    alert('Error al guardar: ' + (err.message || err.details || JSON.stringify(err)))
  } finally {
    loading.value = false
  }
}

async function confirmDelete(cliente: Cliente) {
  if (confirm(`¿Estás seguro de eliminar el perfil de ${cliente.full_name}? Esto podría afectar su acceso.`)) {
    try {
      await clientesStore.removeCliente(cliente.id!)
    } catch (error) {
      alert('Error al eliminar: ' + error)
    }
  }
}
</script>

<style scoped>
.clientes-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  color: #e2e8f0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-content h1 {
  font-size: 2.5rem;
  margin: 0;
  background: linear-gradient(135deg, #646cff 0%, #a855f7 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-content p {
  color: #94a3b8;
  margin: 0.5rem 0 0 0;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.search-bar {
  margin-bottom: 2rem;
}

.search-input {
  width: 100%;
  padding: 1rem 1.5rem;
  border-radius: 15px;
  border: 1px solid #334155;
  background: #1e293b;
  color: white;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
}

.clientes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.cliente-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 1.5rem;
  transition: transform 0.2s, border-color 0.2s;
}

.cliente-card:hover {
  transform: translateY(-4px);
  border-color: #475569;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #f8fafc;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: #334155;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #475569;
}

.btn-danger:hover {
  background: #ef4444;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.5rem 0;
  color: #94a3b8;
  font-size: 0.9rem;
}

.label {
  font-size: 1.1rem;
}

.role-badge {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.2rem 0.6rem;
  background: rgba(99, 102, 241, 0.1);
  color: #818cf8;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1e293b;
  padding: 2.5rem;
  border-radius: 24px;
  width: 100%;
  max-width: 500px;
  border: 1px solid #334155;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #f8fafc;
}

.client-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #94a3b8;
}

.form-group input, .form-group textarea {
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 1px solid #334155;
  background: #0f172a;
  color: white;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #334155;
  color: #94a3b8;
  padding: 0.8rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 4rem 0;
  color: #64748b;
}

.loader {
  border: 4px solid #1e293b;
  border-top: 4px solid #6366f1;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
