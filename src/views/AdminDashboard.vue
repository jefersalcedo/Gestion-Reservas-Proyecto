<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../services/supabase'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const totalUsers = ref(0)
const activeReservations = ref(0)
const loading = ref(true)

const fetchStats = async () => {
  try {
    loading.value = true
    
    // Función auxiliar para timeout
    const withTimeout = (promise: PromiseLike<any>, ms: number) => {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), ms)
      );
      return Promise.race([promise, timeout]);
    };

    // Fetch total users (profiles)
    try {
      const { count: usersCount, error: usersError } = await withTimeout(
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        3000
      ) as any;
      if (!usersError) totalUsers.value = usersCount || 0
    } catch (e) {
      console.warn('Error/Timeout fetching users count:', e)
    }

    // Fetch active reservations (not cancelled)
    try {
      const { count: reservationsCount, error: reservationsError } = await withTimeout(
        supabase.from('reservas').select('*', { count: 'exact', head: true }).neq('estado', 'cancelada'),
        3000
      ) as any;
      if (!reservationsError) activeReservations.value = reservationsCount || 0
    } catch (e) {
      console.warn('Error/Timeout fetching reservations count:', e)
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
})

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="dashboard-container admin-theme">
    <nav class="navbar">
      <div class="logo">Reservent <span>Admin</span></div>
      <div class="nav-links">
        <router-link to="/servicios" class="nav-btn">Servicios</router-link>
        <router-link to="/clientes" class="nav-btn">Clientes</router-link>
        <button @click="handleLogout" class="logout-btn">Cerrar Sesión</button>
      </div>
    </nav>
    
    <main class="content">
      <div class="welcome-card">
        <div class="badge">Admin Access</div>
        <h1>¡Hola, {{ authStore.fullName || authStore.user?.email }}!</h1>
        <p>Gestiona usuarios, roles y configuraciones críticas del sistema desde tu panel central.</p>
        
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Usuarios Totales</span>
            <span class="stat-value">{{ totalUsers }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Reservas Activas</span>
            <span class="stat-value">{{ activeReservations }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Estado Sistema</span>
            <span class="stat-value status-ok">Óptimo</span>
          </div>
        </div>

        <div class="admin-actions">
          <h3>Acciones Rápidas</h3>
          <div class="actions-grid">
            <button class="action-btn" @click="router.push('/servicios')">Gestionar Servicios</button>
            <button class="action-btn" @click="router.push('/clientes')">Gestionar Clientes</button>
            <button class="action-btn">Reportes Globales</button>
            <button class="action-btn btn-warning" @click="router.push('/configuracion')">Configuración Avanzada</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: #020617;
  color: white;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2.5rem;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
}

.logo {
  font-size: 1.75rem;
  font-weight: 900;
  letter-spacing: -0.025em;
  background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.logo span {
  font-size: 0.75rem;
  text-transform: uppercase;
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  -webkit-text-fill-color: #818cf8;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  margin-left: 0.75rem;
  vertical-align: middle;
}

.nav-btn {
  color: #94a3b8;
  text-decoration: none;
  font-weight: 500;
  margin-right: 1.5rem;
  transition: color 0.2s;
}

.nav-btn:hover {
  color: #818cf8;
}

.logout-btn {
  background: transparent;
  color: #94a3b8;
  border: 1px solid #334155;
  padding: 0.5rem 1.25rem;
  border-radius: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

.content {
  padding: 3rem;
  max-width: 1200px;
  margin: 0 auto;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

h1 {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  letter-spacing: -0.05em;
}

p {
  color: #64748b;
  font-size: 1.125rem;
  margin-bottom: 3rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.stat-card {
  padding: 2rem;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 1.5rem;
  display: flex;
  flex-direction: column;
}

.stat-label {
  color: #94a3b8;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
}

.status-ok {
  color: #10b981;
}

.admin-actions {
  text-align: left;
}

h3 {
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
}

.actions-grid {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 1rem 2rem;
  background: #1e293b;
  border: 1px solid #334155;
  color: white;
  border-radius: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #334155;
  transform: translateY(-2px);
}

.btn-warning {
  border-color: #f59e0b;
  color: #f59e0b;
}

.btn-warning:hover {
  background: rgba(245, 158, 11, 0.1);
}
</style>
