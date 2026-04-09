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
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // Esperar a que el store termine de inicializarse si todavía está cargando
  if (authStore.loading) {
    await new Promise<void>((resolve) => {
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
    });
  }

  const isAuthenticated = !!authStore.user
  const userRole = authStore.role

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next('/login')
  }

  if (to.meta.guest && isAuthenticated) {
    const target = userRole === 'admin' ? '/dashboard-admin' : '/dashboard-user'
    return to.path === target ? next() : next(target)
  }

  if (to.meta.role && to.meta.role !== userRole) {
    let target = '/login'
    if (userRole === 'admin') target = '/dashboard-admin'
    else if (userRole === 'creator') target = '/dashboard-user'
    
    return to.path === target ? next() : next(target)
  }

  next()
})

export default router
