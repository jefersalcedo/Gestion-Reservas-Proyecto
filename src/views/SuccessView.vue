<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const sessionId = ref(route.query.session_id)

onMounted(() => {
  // Redirigir automáticamente al Dashboard después de 5 segundos
  setTimeout(() => {
    router.replace('/dashboard-user')
  }, 5000)
})
</script>

<template>
  <div class="success-container">
    <div class="success-card">
      <div class="icon-wrapper">
        <div class="check-icon">✓</div>
      </div>
      <h1>¡Pago Exitoso!</h1>
      <p>Tu reserva ha sido confirmada correctamente.</p>
      <div class="details" v-if="sessionId">
        <small>ID de Sesión: {{ sessionId.toString().slice(0, 20) }}...</small>
      </div>
      <button @click="router.replace('/dashboard-user')" class="btn-primary">
        Ir al Panel Principal
      </button>
      <p class="auto-redirect">Redirigiendo al panel principal en unos segundos...</p>
    </div>
  </div>
</template>

<style scoped>
.success-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  background: var(--base-black);
}

.success-card {
  background: var(--charcoal);
  padding: 5rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  text-align: center;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
  animation: slideUp 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.icon-wrapper {
  width: 100px;
  height: 100px;
  background: rgba(6, 95, 70, 0.1);
  border: 1px solid var(--emerald);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 3rem;
}

.check-icon {
  font-size: 3.5rem;
  color: var(--emerald);
}

h1 {
  font-family: 'Montserrat', sans-serif;
  font-size: 3rem;
  font-weight: 900;
  color: var(--ivory);
  margin-bottom: 1.5rem;
}

p {
  color: var(--text-muted);
  font-size: 1.25rem;
  margin-bottom: 3rem;
  font-weight: 300;
}

.details {
  background: rgba(255, 255, 255, 0.02);
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 3rem;
  border: 1px solid var(--border);
}

.btn-primary {
  width: 100%;
  padding: 1.25rem;
}

.auto-redirect {
  font-size: 0.85rem;
  margin-top: 2rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

</style>
