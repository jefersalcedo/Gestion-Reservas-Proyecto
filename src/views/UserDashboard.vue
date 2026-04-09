<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="dashboard-container">
    <nav class="navbar">
      <div class="nav-links">
        <router-link to="/mis-reservas" class="nav-btn">Mis Reservas</router-link>
        <button @click="handleLogout" class="logout-btn">Cerrar Sesión</button>
      </div>
    </nav>
    
    <main class="content">
      <div class="welcome-card">
        <h1>¡Bienvenido, {{ authStore.fullName || authStore.user?.email }}!</h1>
        <p>Este es tu panel de control personalizado.</p>
        
        <div class="grid">
          <div class="card clickable" @click="router.push('/mis-reservas')">
            <h3>Mis Reservas</h3>
            <p>Gestiona tus citas y servicios programados.</p>
          </div>
          <div class="card">
            <h3>Perfil</h3>
            <p>Rol: <strong>{{ authStore.role }}</strong></p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: #0f172a;
  color: white;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.logo {
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.logo span {
  font-size: 0.875rem;
  background: #334155;
  -webkit-text-fill-color: #94a3b8;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  margin-left: 0.5rem;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-btn {
  color: #94a3b8;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-btn:hover {
  color: white;
}

.logout-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #ef4444;
  color: white;
}

.content {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.welcome-card {
  text-align: left;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

p {
  color: #94a3b8;
  margin-bottom: 2rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.card {
  padding: 1.5rem;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  transition: all 0.2s;
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.3);
  transform: translateY(-2px);
}

h3 {
  margin-bottom: 1rem;
  color: #6366f1;
}

strong {
  color: #a855f7;
}
</style>
