<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../services/supabase'

const router = useRouter()
const loading = ref(true)
const error = ref('')
const reports = ref<any[]>([])
const searchQuery = ref('')
const startDate = ref('')
const endDate = ref('')
const filterMode = ref<'servicio' | 'registro'>('servicio')

const fetchReports = async () => {
  try {
    loading.value = true
    const { data: resData, error: fetchError } = await supabase
      .from('reservas')
      .select(`
        id,
        fecha,
        hora,
        estado,
        created_at,
        updated_at,
        profiles (
          full_name,
          email,
          phone
        ),
        servicios (
          nombre
        )
      `)
      .order('fecha', { ascending: false })

    if (fetchError) throw fetchError
    
    let pagosData: any[] | null = []

    // Solo buscamos pagos si hay reservas para evitar el error 400
    if (resData && resData.length > 0) {
      const { data } = await supabase
        .from('pagos')
        .select('reserva_id, monto')
        .eq('estado', 'completado')
        .in('reserva_id', resData.map(r => r.id))
      pagosData = data
    }

    // Unir manualmente
    reports.value = (resData || []).map(res => ({
      ...res,
      pagos: pagosData?.filter(p => p.reserva_id === res.id) || []
    }))
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
  let result = reports.value

  // Filtro por fecha según el modo elegido
  if (startDate.value || endDate.value) {
    result = result.filter(r => {
      const dateToCompare = filterMode.value === 'servicio' 
        ? r.fecha 
        : r.created_at.split('T')[0]
      
      const matchStart = startDate.value ? dateToCompare >= startDate.value : true
      const matchEnd = endDate.value ? dateToCompare <= endDate.value : true
      
      return matchStart && matchEnd
    })
  }

  // Filtro por búsqueda de texto
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(r => 
      r.profiles?.full_name?.toLowerCase().includes(query) ||
      r.servicios?.nombre?.toLowerCase().includes(query) ||
      r.profiles?.email?.toLowerCase().includes(query)
    )
  }

  return result
})

const clearFilters = () => {
  searchQuery.value = ''
  startDate.value = ''
  endDate.value = ''
  filterMode.value = 'servicio'
}

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

// Stats computations based on FILTERED results
const totalRevenue = computed(() => {
  return filteredReports.value
    .filter(r => r.estado === 'confirmada')
    .reduce((acc, r) => acc + (r.pagos?.[0]?.monto || 0), 0)
})

const successRate = computed(() => {
  if (!filteredReports.value.length) return 0
  const confirmed = filteredReports.value.filter(r => r.estado === 'confirmada').length
  return (confirmed / filteredReports.value.length) * 100
})

const cancellationRate = computed(() => {
  if (!filteredReports.value.length) return 0
  const cancelled = filteredReports.value.filter(r => r.estado === 'cancelada').length
  return (cancelled / filteredReports.value.length) * 100
})
</script>

<template>
  <div class="reports-container">
    <div class="top-nav">
      <button @click="handleBack" class="btn-back-link">
        Regresar
      </button>
      
      <div class="filters-bar">
        <div class="filter-mode-toggle">
          <button 
            @click="filterMode = 'servicio'" 
            :class="['toggle-btn', { active: filterMode === 'servicio' }]"
          >
            Servicio
          </button>
          <button 
            @click="filterMode = 'registro'" 
            :class="['toggle-btn', { active: filterMode === 'registro' }]"
          >
            Venta
          </button>
        </div>

        <div class="filter-group">
          <label>Desde:</label>
          <input v-model="startDate" type="date" class="date-input" />
        </div>
        <div class="filter-group">
          <label>Hasta:</label>
          <input v-model="endDate" type="date" class="date-input" />
        </div>
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cliente o servicio..."
            class="search-input"
          />
        </div>
        <button v-if="startDate || endDate || searchQuery" @click="clearFilters" class="btn-clear">
          Limpiar
        </button>
      </div>
    </div>

    <header class="view-header">
      <div class="header-content">
        <h1>Reporte General de Operaciones</h1>
        <p>Análisis detallado de ingresos, reservas y comportamiento de clientes.</p>
      </div>
    </header>

    <div v-if="!loading && !error" class="global-stats">
      <div class="global-stat-card">
        <span class="stat-label">Ingresos Totales</span>
        <span class="stat-value text-primary">${{ totalRevenue.toFixed(2) }}</span>
      </div>
      <div class="global-stat-card">
        <span class="stat-label">Reservas Filtradas</span>
        <span class="stat-value">{{ filteredReports.length }}</span>
      </div>
      <div class="global-stat-card">
        <span class="stat-label">Tasa de Éxito</span>
        <span class="stat-value text-success">{{ successRate.toFixed(1) }}%</span>
      </div>
      <div class="global-stat-card">
        <span class="stat-label">Cancelaciones</span>
        <span class="stat-value text-error">{{ cancellationRate.toFixed(1) }}%</span>
      </div>
    </div>

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
              <th>Fecha Reserva</th>
              <th>Estado</th>
              <th>Fecha Acción</th>
              <th class="text-right">Monto</th>
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
              <td>
                <div class="action-date-info">
                  <span v-if="report.estado === 'cancelada'" class="text-error">
                    Canc: {{ formatDate(report.updated_at.split('T')[0]) }}
                  </span>
                  <span v-else-if="report.estado === 'confirmada'" class="text-success">
                    Conf: {{ formatDate(report.updated_at.split('T')[0]) }}
                  </span>
                  <span v-else class="text-muted">
                    Reg: {{ formatDate(report.created_at.split('T')[0]) }}
                  </span>
                </div>
              </td>
              <td class="text-right">
                <span class="price-value">${{ (report.pagos?.[0]?.monto || 0).toFixed(2) }}</span>
              </td>
            </tr>
            <tr v-if="!filteredReports.length">
              <td colspan="6" class="empty-row">No se encontraron registros que coincidan con la búsqueda.</td>
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
  background: var(--base-black);
  border: 1px solid var(--border);
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  color: var(--ivory);
  width: 250px;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
}

.filters-bar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: var(--charcoal);
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.filter-mode-toggle {
  display: flex;
  background: var(--base-black);
  padding: 0.25rem;
  border-radius: 6px;
  border: 1px solid var(--border);
}

.toggle-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s;
}

.toggle-btn.active {
  background: var(--primary);
  color: var(--base-black);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-group label {
  font-size: 0.65rem;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 700;
  letter-spacing: 0.1em;
}

.date-input {
  background: var(--base-black);
  border: 1px solid var(--border);
  color: var(--ivory);
  padding: 0.5rem;
  border-radius: 4px;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.8rem;
}

.btn-clear {
  background: transparent;
  border: 1px solid var(--error);
  color: var(--error);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-clear:hover {
  background: var(--error);
  color: white;
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
  margin-top: 3rem;
}

.global-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
}

.global-stat-card {
  background: var(--charcoal);
  border: 1px solid var(--border);
  padding: 2rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
}

.global-stat-card:hover {
  border-color: var(--primary);
  transform: translateY(-5px);
}

.stat-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 900;
  font-family: 'Montserrat', sans-serif;
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
.text-success { color: var(--success) !important; }
.text-error { color: var(--error) !important; }
.text-primary { color: var(--primary) !important; }

.action-date-info {
  display: flex;
  flex-direction: column;
  font-size: 0.75rem;
  font-weight: 500;
}

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
