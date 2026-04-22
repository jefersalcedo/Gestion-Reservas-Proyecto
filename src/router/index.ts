import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import UserDashboard from '../views/UserDashboard.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import ServiciosView from '../views/ServiciosView.vue'
import ReservasView from '../views/ReservasView.vue'

import ClientesView from '../views/ClientesView.vue'
import SuccessView from '../views/SuccessView.vue'
import ReportsView from '../views/ReportsView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: Login, meta: { guest: true } },
  { path: '/register', name: 'Register', component: Register, meta: { guest: true } },
  { 
    path: '/dashboard-user', 
    name: 'UserDashboard', 
    component: UserDashboard, 
    meta: { requiresAuth: true, role: 'creator' } 
  },
  { 
    path: '/mis-reservas', 
    name: 'MisReservas', 
    component: ReservasView, 
    meta: { requiresAuth: true, role: 'creator' } 
  },
  { 
    path: '/success', 
    name: 'Success', 
    component: SuccessView, 
    meta: { requiresAuth: true, role: 'creator' } 
  },
  { 
    path: '/dashboard-admin', 
    name: 'AdminDashboard', 
    component: AdminDashboard, 
    meta: { requiresAuth: true, role: 'admin' } 
  },
  { 
    path: '/servicios', 
    name: 'Servicios', 
    component: ServiciosView, 
    meta: { requiresAuth: true, role: 'admin' } 
  },
  { 
    path: '/clientes', 
    name: 'Clientes', 
    component: ClientesView, 
    meta: { requiresAuth: true, role: 'admin' } 
  },
  { 
    path: '/reportes', 
    name: 'Reportes', 
    component: ReportsView, 
    meta: { requiresAuth: true, role: 'admin' } 
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  
  // Esperar a que el store termine de inicializarse con un timeout de seguridad
  if (authStore.loading) {
    await Promise.race([
      new Promise<void>((resolve) => {
        const stopWatch = watch(
          () => authStore.loading,
          (isLoading) => {
            if (!isLoading) {
              stopWatch();
              resolve();
            }
          },
          { immediate: true }
        );
      }),
      new Promise<void>((resolve) => setTimeout(resolve, 3000))
    ]);
  }

  const isAuthenticated = !!authStore.user
  const userRole = authStore.role

  // 1. Si requiere autenticación y no está logueado -> Login
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'Login' }
  }

  // 2. Si es para invitados (login/register) y ya está logueado -> Dashboard correspondiente
  if (to.meta.guest && isAuthenticated) {
    return userRole === 'admin' ? { name: 'AdminDashboard' } : { name: 'UserDashboard' }
  }

  // 3. Verificación de roles (si el usuario está autenticado pero no tiene el rol correcto)
  if (to.meta.role && to.meta.role !== userRole) {
    // Evitar bucles: Si ya estamos yendo al destino correcto, permitirlo
    const targetName = userRole === 'admin' ? 'AdminDashboard' : 'UserDashboard'
    if (to.name === targetName) return true
    
    return { name: targetName }
  }

  // Permitir la navegación
  return true
})

export default router
