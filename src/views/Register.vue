<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../services/supabase'
import { useRouter } from 'vue-router'

const email = ref('')
const fullName = ref('')
const phone = ref('+57') // Default with country code example
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  // Validación básica de teléfono (mínimo indicativo + algunos números)
  if (!phone.value.startsWith('+') || phone.value.length < 8) {
    error.value = 'Por favor ingresa un teléfono válido con indicativo (ej: +57300...)'
    return
  }

  loading.value = true
  error.value = ''
  
  // Sanitizar teléfono: asegurar que tenga el '+'
  let sanitizedPhone = phone.value.trim()
  if (sanitizedPhone && !sanitizedPhone.startsWith('+')) {
    sanitizedPhone = '+' + sanitizedPhone
  }

  // 1. Registro en Supabase Auth con Metadata
  const { data, error: registerError } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      data: {
        full_name: fullName.value,
        phone: sanitizedPhone,
        role: 'creator' // Cambiado a 'creator' para cumplir con la constraint de la DB
      }
    }
  })

  if (registerError) {
    error.value = registerError.message
    loading.value = false
    return
  }

  if (data.user) {
    // 2. Actualización forzada en 'profiles'
    // Usamos update en lugar de insert para evitar conflictos con Triggers existentes
    // que crean el perfil automáticamente con datos incompletos.
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.value,
          phone: sanitizedPhone,
          email: email.value,
          // Cambiado a 'creator' para cumplir con la constraint de la DB
          role: 'creator' 
        })
        .eq('id', data.user.id)
      
      if (profileError) {
        console.error('Error actualizando perfil:', profileError.message)
      }
    } catch (err) {
      console.error('Error crítico al actualizar perfil:', err)
    }

    alert('Usuario registrado con éxito. Si se requiere confirmación, revisa tu correo. De lo contrario, ya puedes iniciar sesión.')
    router.push('/login')
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Reservent</h1>
      <p>Crea tu cuenta para reservar servicios</p>
      
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="fullName">Nombre Completo</label>
          <input 
            id="fullName" 
            v-model="fullName" 
            type="text" 
            placeholder="Juan Pérez" 
            required
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input 
            id="email" 
            v-model="email" 
            type="email" 
            placeholder="correo@ejemplo.com" 
            required
          />
        </div>

        <div class="form-group">
          <label for="phone">Teléfono (con indicativo)</label>
          <input 
            id="phone" 
            v-model="phone" 
            type="tel" 
            placeholder="+573001234567" 
            required
          />
          <small class="help-text">Ejemplo: +57 para Colombia, +34 para España</small>
        </div>
        
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input 
            id="password" 
            v-model="password" 
            type="password" 
            placeholder="••••••••" 
            required
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirmar Contraseña</label>
          <input 
            id="confirmPassword" 
            v-model="confirmPassword" 
            type="password" 
            placeholder="••••••••" 
            required
          />
        </div>
        
        <p v-if="error" class="error-message">{{ error }}</p>
        
        <button type="submit" :disabled="loading">
          {{ loading ? 'Registrando...' : 'Crear Cuenta' }}
        </button>
      </form>
      
      <p class="auth-footer">
        ¿Ya tienes cuenta? <router-link to="/login">Inicia sesión</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
}

.auth-card {
  width: 100%;
  max-width: 450px;
  padding: 2.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

h1 {
  margin-bottom: 0.5rem;
  font-size: 2.75rem;
  background: linear-gradient(135deg, #D4AF37 0%, #E5D3B3 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.02em;
}

p {
  color: #94a3b8;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.25rem;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #e2e8f0;
}

input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  color: white;
  transition: all 0.2s;
}

input:focus {
  outline: none;
  border-color: #D4AF37;
  box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1);
}

.help-text {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
  display: block;
}

button {
  width: 100%;
  padding: 0.85rem;
  margin-top: 1rem;
  background: linear-gradient(135deg, #D4AF37 0%, #E5D3B3 100%);
  border: none;
  border-radius: 0.75rem;
  color: #0B0B0C;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
}

button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: -0.5rem;
  margin-bottom: 1rem;
}

.auth-footer {
  margin-top: 2rem;
  margin-bottom: 0;
  font-size: 0.875rem;
}

.auth-footer a {
  color: #D4AF37;
  text-decoration: none;
  font-weight: 600;
}

.auth-footer a:hover {
  text-decoration: underline;
}
</style>
