<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import ProfileSettings from '../components/ProfileSettings.vue'

const authStore = useAuthStore()
const router = useRouter()
const showSettings = ref(false)

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="dashboard-container">
    <nav class="navbar">
      <div class="logo">Reservent</div>
      <div class="nav-links">
        <router-link to="/mis-reservas" class="nav-btn">Mis Reservas</router-link>
        <button @click="handleLogout" class="logout-btn">Cerrar Sesión</button>
      </div>
    </nav>
    
    <main class="content">
      <div class="welcome-card">
        <div class="badge">Creator Access</div>
        <h1>¡Bienvenido, <span class="highlight">{{ authStore.fullName || 'Usuario' }}</span>!</h1>
        <p>Este es tu panel de control personalizado.</p>
        
        <div class="grid">
          <div class="card clickable" @click="router.push('/mis-reservas')">
            <span class="card-value">Mis Reservas</span>
          </div>
          <div class="card clickable" @click="showSettings = true">
            <span class="card-value">Edita tu información personal</span>
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
}

.content {
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.welcome-card {
  text-align: center;
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
}

p {
  color: var(--text-muted);
  font-size: 1.1rem;
  margin: 0 auto 3.5rem;
  max-width: 600px;
  font-weight: 300;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  justify-content: center;
  max-width: 1100px;
  margin: 0 auto;
}

.card {
  padding: 1rem 2rem;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 90px;
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  border-color: var(--primary);
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

h3 {
  font-family: 'Montserrat', sans-serif;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 1rem;
}

.card-value {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--ivory);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

strong {
  color: var(--primary);
  font-weight: 700;
  letter-spacing: 0.05em;
}


.mt-2 {
  margin-top: 0.5rem;
}

</style>
