<template>
  <div class="clientes-container">
    <div class="top-nav">
      <button @click="handleBack" class="btn-back-link">
        Regresar
      </button>
      <button @click="openModal()" class="btn-create-mini">
        NUEVO CLIENTE
      </button>
    </div>

    <header class="page-header">
      <div class="header-content">
        <h1>Gestión de Clientes</h1>
      </div>
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
        <div @click="openDetailModal(cliente)" class="card-clickable">
          <div class="card-header">
            <h3>{{ cliente.full_name }}</h3>
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
        <div class="card-footer">
          <div class="actions">
            <button @click.stop="openModal(cliente)" class="btn-icon" title="Editar">
              ✏️
            </button>
            <button @click.stop="confirmDelete(cliente)" class="btn-icon btn-danger" title="Eliminar">
              🗑️
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="filteredClientes.length === 0" class="empty-state">
        <p>No se encontraron clientes.</p>
      </div>
    </div>

    <!-- Modal for Create/Edit -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingId ? 'Editar Cliente' : 'Nuevo Cliente' }}</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        
        <form @submit.prevent="saveCliente" class="client-form">
          <div class="form-group">
            <label for="full_name">Nombre Completo *</label>
            <input v-model="form.full_name" id="full_name" type="text" required placeholder="Nombre del cliente" />
          </div>
          
          <div class="form-group">
            <label for="email">Correo Electrónico (Solo Lectura)</label>
            <input :value="form.email" id="email" type="email" disabled />
          </div>
          
          <div class="form-group">
            <label for="phone">Teléfono / WhatsApp</label>
            <input v-model="form.phone" id="phone" type="tel" placeholder="+57..." />
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? 'Actualizando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <!-- Modal de Perfil Detallado del Cliente -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal-content detail-modal">
        <div class="modal-header">
          <div class="header-info">
            <h2>Expediente de Cliente</h2>
            <p class="client-subtitle">{{ selectedCliente?.full_name }}</p>
          </div>
          <button @click="closeDetailModal" class="close-btn">&times;</button>
        </div>

        <div v-if="loadingHistory" class="loading-history">
          <div class="loader"></div>
          <p>Cargando historial...</p>
        </div>

        <div v-else class="detail-grid">
          <!-- Stats Cards -->
          <div class="stats-row">
            <div class="mini-stat">
              <span class="stat-label">Total</span>
              <span class="stat-value">{{ clientHistory.length }}</span>
            </div>
            <div class="mini-stat">
              <span class="stat-label">Confirmadas</span>
              <span class="stat-value text-success">{{ confirmedCount }}</span>
            </div>
            <div class="mini-stat">
              <span class="stat-label">Pendientes</span>
              <span class="stat-value text-warning">{{ pendingCount }}</span>
            </div>
            <div class="mini-stat">
              <span class="stat-label">Canceladas</span>
              <span class="stat-value text-error">{{ cancelledCount }}</span>
            </div>
          </div>

          <!-- History Table -->
          <div class="history-section">
            <h3>Historial Reciente</h3>
            <div class="table-wrapper">
              <table class="history-table">
                <thead>
                  <tr>
                    <th>Servicio</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="res in clientHistory" :key="res.id">
                    <td>{{ res.servicios?.nombre }}</td>
                    <td>{{ formatDate(res.fecha) }}</td>
                    <td>
                      <span :class="['status-badge-mini', res.estado]">
                        {{ res.estado.toUpperCase() }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="!clientHistory.length">
                    <td colspan="3" class="empty-history">No hay registros de reservas.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useClientesStore } from '../stores/clientes'
import { supabase } from '../services/supabase'
import type { Cliente } from '../services/clientes.service'

const router = useRouter()
const clientesStore = useClientesStore()

const handleBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/dashboard-admin')
  }
}
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

// Historial de Cliente
const showDetailModal = ref(false)
const selectedCliente = ref<Cliente | null>(null)
const clientHistory = ref<any[]>([])
const loadingHistory = ref(false)

const confirmedCount = computed(() => clientHistory.value.filter(r => r.estado === 'confirmada').length)
const pendingCount = computed(() => clientHistory.value.filter(r => r.estado === 'pendiente').length)
const cancelledCount = computed(() => clientHistory.value.filter(r => r.estado === 'cancelada').length)

async function openDetailModal(cliente: Cliente) {
  selectedCliente.value = cliente
  showDetailModal.value = true
  loadingHistory.value = true
  
  try {
    const { data, error } = await supabase
      .from('reservas')
      .select(`
        id,
        fecha,
        hora,
        estado,
        servicios (nombre)
      `)
      .eq('usuario_id', cliente.id)
      .order('fecha', { ascending: false })

    if (error) throw error
    clientHistory.value = data || []
  } catch (err) {
    console.error('Error fetching client history:', err)
  } finally {
    loadingHistory.value = false
  }
}

function closeDetailModal() {
  showDetailModal.value = false
  selectedCliente.value = null
  clientHistory.value = []
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short'
  })
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

.page-header {
  text-align: center;
  margin-bottom: 5rem;
}

.title-with-back {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.header-content h1 {
  font-family: 'Montserrat', sans-serif;
  font-size: 2.5rem;
  margin: 0;
  font-weight: 900;
  color: var(--ivory);
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
  cursor: pointer;
  transition: all 0.4s ease;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  transform: translateY(-3px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
}

.search-input {
  width: 100%;
  padding: 1.5rem 2.5rem;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--charcoal);
  color: var(--ivory);
  font-size: 1.1rem;
  transition: all 0.3s;
  margin-bottom: 5rem;
  font-family: 'Montserrat', sans-serif;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary);
}

.clientes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 3rem;
}

.cliente-card {
  background: var(--charcoal);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 3rem;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.cliente-card:hover {
  transform: translateY(-10px);
  border-color: var(--primary);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.card-header h3 {
  font-family: 'Montserrat', sans-serif;
  margin: 0;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--ivory);
  margin-bottom: 1.5rem;
}

.card-footer {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid rgba(212, 175, 55, 0.05);
  padding-top: 1.5rem;
}

.actions {
  display: flex;
  gap: 1rem;
}

.btn-icon {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 44px;
  height: 44px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1.1rem;
  color: var(--text-muted);
}

.btn-icon:hover {
  border-color: var(--primary);
  color: var(--primary);
  transform: scale(1.05);
}

.btn-danger:hover {
  border-color: var(--error);
  color: var(--error);
  background: rgba(127, 29, 29, 0.05);
}

.info-item {
  color: var(--text-muted);
  font-weight: 400;
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.role-badge {
  display: inline-block;
  margin-top: 2rem;
  padding: 0.4rem 1rem;
  background: rgba(212, 175, 55, 0.05);
  color: var(--primary);
  border: 1px solid var(--border);
  border-radius: 0;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

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
  padding: 3.5rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  width: 100%;
  max-width: 500px;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
  animation: modalSlideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

@keyframes modalSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
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

.client-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-group label {
  font-weight: 700;
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.form-group input {
  background: var(--base-black);
  border: 1px solid var(--border);
  padding: 1.25rem;
  color: var(--ivory);
  border-radius: 4px;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary);
}

.form-group input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-style: dashed;
}

.form-actions {
  margin-top: 1rem;
}

.form-actions .btn-primary {
  width: 100%;
  padding: 1.25rem;
}

.card-clickable {
  cursor: pointer;
  transition: opacity 0.3s;
}

.card-clickable:hover {
  opacity: 0.9;
}

.detail-modal {
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

/* Estilos para el scrollbar del modal */
.detail-modal::-webkit-scrollbar {
  width: 6px;
}

.detail-modal::-webkit-scrollbar-track {
  background: var(--base-black);
}

.detail-modal::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 10px;
}

.detail-modal::-webkit-scrollbar-thumb:hover {
  background: var(--primary);
}

.client-subtitle {
  color: var(--primary);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.loading-history {
  padding: 4rem;
  text-align: center;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 3rem;
}

.mini-stat {
  background: var(--base-black);
  padding: 1.5rem;
  border-radius: 4px;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--ivory);
  font-family: 'Montserrat', sans-serif;
}

.history-section h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--ivory);
  margin-bottom: 1.5rem;
  border-left: 2px solid var(--primary);
  padding-left: 1rem;
}

.table-wrapper {
  background: var(--base-black);
  border-radius: 4px;
  border: 1px solid var(--border);
  overflow: hidden;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.history-table th {
  text-align: left;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.7rem;
}

.history-table td {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border);
  color: var(--ivory);
}

.status-badge-mini {
  font-size: 0.6rem;
  padding: 0.25rem 0.6rem;
  border-radius: 2px;
  font-weight: 800;
}

.status-badge-mini.confirmada { background: rgba(6, 95, 70, 0.2); color: var(--success); }
.status-badge-mini.cancelada { background: rgba(127, 29, 29, 0.2); color: var(--error); }
.status-badge-mini.pendiente { background: rgba(212, 175, 55, 0.1); color: var(--primary); }

.empty-history {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
  font-style: italic;
}

.text-success { color: var(--success) !important; }
.text-warning { color: var(--primary) !important; }
.text-error { color: var(--error) !important; }

</style>
