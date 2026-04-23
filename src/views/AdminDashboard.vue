<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../services/supabase'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import ProfileSettings from '../components/ProfileSettings.vue'

const authStore = useAuthStore()
const router = useRouter()
const showSettings = ref(false)

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
        supabase.from('profiles').select('*', { count: 'exact' }).eq('role', 'creator'),
        5000
      ) as any;
      if (usersError) throw usersError
      totalUsers.value = usersCount || 0
    } catch (e) {
      console.warn('Error fetching users count:', e)
    }

    // Fetch active reservations (pendientes + confirmadas)
    try {
      const { data: resData, error: reservationsError } = await withTimeout(
        supabase.from('reservas').select('id, estado').neq('estado', 'cancelada'),
        5000
      ) as any;
      if (reservationsError) throw reservationsError
      activeReservations.value = resData?.length || 0
    } catch (e: any) {
      console.error('Error fetching reservations count. Details:', e)
      // Log more details if it's a Supabase error
      if (e.code) console.error('Error Code:', e.code, 'Message:', e.message)
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  console.log('Admin Dashboard Mounted - User Role:', authStore.role)
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
      <div class="logo">Reservent</div>
      <div class="nav-links">
        <router-link to="/servicios" class="nav-btn">Servicios</router-link>
        <router-link to="/clientes" class="nav-btn">Clientes</router-link>
        <button @click="handleLogout" class="logout-btn">Cerrar Sesión</button>
      </div>
    </nav>
    
    <main class="content">
      <div class="welcome-card">
        <div class="badge">Admin Access</div>
        <h1>¡Hola, <span class="highlight">{{ authStore.fullName || 'Usuario' }}</span>!</h1>
        <p>Gestiona usuarios y roles desde tu panel central.</p>
        
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Usuarios Totales</span>
            <span class="stat-value">{{ totalUsers }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Reservas Activas</span>
            <span class="stat-value">{{ activeReservations }}</span>
          </div>
        </div>

        <div class="admin-actions">
          <h3>Acciones Rápidas</h3>
          <div class="actions-grid">
            <button class="action-btn" @click="router.push('/servicios')">Gestionar Servicios</button>
            <button class="action-btn" @click="router.push('/clientes')">Gestionar Clientes</button>
            <button class="action-btn" @click="router.push('/reportes')">Reportes</button>
            <button class="action-btn" @click="showSettings = true">Configuración de Perfil</button>
          </div>
        </div>
      </div>
    </main>

    <ProfileSettings 
      v-if="showSettings" 
      @close="showSettings = false" 
      @updated="showSettings = false"
    />
  </div>
</template>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: var(--background);
  color: var(--text-main);
  font-family: 'Montserrat', sans-serif;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 4rem;
  background: rgba(11, 11, 12, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.75rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  color: var(--primary);
}

.logo span {
  font-family: 'Inter', sans-serif;
  font-size: 0.65rem;
  text-transform: uppercase;
  background: rgba(212, 175, 55, 0.1);
  color: var(--primary);
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  margin-left: 0.75rem;
  letter-spacing: 0.2em;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2.5rem;
}

.nav-btn {
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.3s;
}

.nav-btn:hover {
  color: var(--primary);
}

.logout-btn {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.6rem 1.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s;
}

.logout-btn:hover {
  border-color: var(--error);
  color: var(--error);
  background: rgba(127, 29, 29, 0.05);
}

.content {
  padding: 5rem 2rem;
  max-width: 1100px;
  margin: 0 auto;
  text-align: center;
}

.welcome-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 4rem;
}

.badge {
  display: inline-block;
  padding: 0.5rem 1.25rem;
  background: rgba(212, 175, 55, 0.05);
  color: var(--primary);
  border: 1px solid var(--border);
  border-radius: 0;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  margin-bottom: 2rem;
}

.highlight {
  color: var(--primary);
}

h1 {
  font-family: 'Montserrat', sans-serif;
  font-size: 2.75rem;
  font-weight: 900;
  margin-bottom: 1rem;
  line-height: 1.2;
}

p {
  color: var(--text-muted);
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto 3.5rem;
  font-weight: 300;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin: 0 auto 3rem;
  max-width: 1000px;
}

.stat-card {
  padding: 2rem;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.4s ease;
}

.stat-card:hover {
  border-color: var(--primary);
  transform: translateY(-8px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
}

.stat-label {
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 1rem;
}

.stat-value {
  font-family: 'Montserrat', sans-serif;
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--ivory);
}

.status-ok {
  color: var(--success);
}

.admin-actions {
  margin-top: 1rem;
}

h3 {
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  margin-bottom: 2.5rem;
}

.actions-grid {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: nowrap;
  margin-top: 2rem;
}

.action-btn {
  padding: 1rem 2rem;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--primary);
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  background: var(--primary);
  color: var(--base-black);
  border-color: var(--primary);
  transform: translateY(-3px);
}

.btn-warning {
  border-color: var(--error);
  color: var(--error);
}

.btn-warning:hover {
  background: var(--error);
  color: var(--ivory);
  border-color: var(--error);
}


</style>
