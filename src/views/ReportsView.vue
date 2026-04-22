<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../services/supabase'

const router = useRouter()
const loading = ref(true)
const error = ref('')
const reports = ref<any[]>([])
const searchQuery = ref('')

const fetchReports = async () => {
  try {
    loading.value = true
    const { data, error: fetchError } = await supabase
      .from('reservas')
      .select(`
        id,
        fecha,
        hora,
        estado,
        created_at,
        profiles (
          full_name,
          email,
          phone
        ),
        servicios (
          nombre,
          precios_servicios (
            precio,
            estado
          )
        )
      `)
      .order('fecha', { ascending: false })

    if (fetchError) throw fetchError
    reports.value = data || []
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchReports()
})

const filteredReports = computed(() => {
  if (!searchQuery.value) return reports.value
  const query = searchQuery.value.toLowerCase()
  return reports.value.filter(r => 
    r.profiles?.full_name?.toLowerCase().includes(query) ||
    r.servicios?.nombre?.toLowerCase().includes(query) ||
    r.profiles?.email?.toLowerCase().includes(query)
  )
})

const formatDate = (dateStr: string) => {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatTime = (timeStr: string) => {
  return timeStr.substring(0, 5)
}

const getStatusLabel = (estado: string) => {
  switch (estado) {
    case 'confirmada': return 'CONFIRMADA'
    case 'cancelada': return 'CANCELADA'
    default: return 'PENDIENTE'
  }
}

const handleBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/dashboard-admin')
  }
}
</script>

<template>
  <div class="reports-container">
    <div class="top-nav">
      <button @click="handleBack" class="btn-back-link">
        Regresar
      </button>
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Filtrar por cliente o servicio..."
          class="search-input"
        />
      </div>
    </div>

    <header class="view-header">
      <div class="header-content">
        <h1>Reporte de Reservas</h1>
        <p>Historial detallado de todas las operaciones realizadas en la plataforma.</p>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Generando reporte...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button @click="fetchReports" class="btn-retry">Reintentar</button>
    </div>

    <div v-else class="table-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Servicio</th>
              <th>Fecha y Hora</th>
              <th>Estado</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in filteredReports" :key="report.id">
              <td>
                <div class="client-info">
                  <span class="client-name">{{ report.profiles?.full_name || 'Usuario desconocido' }}</span>
                  <span class="client-email">{{ report.profiles?.email }}</span>
                </div>
              </td>
              <td>
                <span class="service-name">{{ report.servicios?.nombre }}</span>
              </td>
              <td>
                <div class="datetime-info">
                  <span>{{ formatDate(report.fecha) }}</span>
                  <span class="time-badge">{{ formatTime(report.hora) }} hs</span>
                </div>
              </td>
              <td>
                <span :class="['status-badge', report.estado]">
                  {{ getStatusLabel(report.estado) }}
                </span>
              </td>
              <td class="text-right">
                <span class="price-value">${{ (report.servicios?.precios_servicios?.find((p: any) => p.estado === true)?.precio || 0).toFixed(2) }}</span>
              </td>
            </tr>
            <tr v-if="!filteredReports.length">
              <td colspan="5" class="empty-row">No se encontraron registros que coincidan con la búsqueda.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reports-container {
  padding: 4rem 2rem;
  max-width: 1400px;
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

.search-input {
  background: var(--charcoal);
  border: 1px solid var(--border);
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  color: var(--ivory);
  width: 300px;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
}

.view-header {
  text-align: center;
  margin-bottom: 5rem;
}

.view-header h1 {
  font-family: 'Montserrat', sans-serif;
  font-size: 2.5rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.view-header p {
  color: var(--text-muted);
  font-weight: 300;
}

.table-card {
  background: var(--charcoal);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: rgba(255, 255, 255, 0.02);
  padding: 1.5rem 2rem;
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.data-table td {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border);
}

.client-info {
  display: flex;
  flex-direction: column;
}

.client-name {
  font-weight: 700;
  color: var(--ivory);
}

.client-email {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.service-name {
  color: var(--primary);
  font-weight: 600;
}

.datetime-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.time-badge {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.status-badge {
  padding: 0.4rem 0.8rem;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  border-radius: 2px;
}

.status-badge.confirmada { background: rgba(6, 95, 70, 0.2); color: var(--success); border: 1px solid var(--success); }
.status-badge.cancelada { background: rgba(127, 29, 29, 0.2); color: var(--error); border: 1px solid var(--error); }
.status-badge.pendiente { background: rgba(212, 175, 55, 0.1); color: var(--primary); border: 1px solid var(--primary); }

.price-value {
  font-family: 'Montserrat', sans-serif;
  font-weight: 800;
  color: var(--ivory);
}

.text-right { text-align: right !important; }

.loading-state {
  text-align: center;
  padding: 5rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(212, 175, 55, 0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-row {
  text-align: center;
  padding: 4rem;
  color: var(--text-muted);
  font-style: italic;
}
</style>
