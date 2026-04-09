import { defineStore } from 'pinia'
import { supabase } from '../services/supabase'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    role: null as string | null,
    fullName: null as string | null,
    loading: true,
  }),
  actions: {
    async setUser(session: any) {
      if (session) {
        this.user = session.user
        
        try {
          // Timeout de seguridad: Si el perfil tarda más de 3 segundos, usamos metadatos
          const profilePromise = supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', session.user.id)
            .single()

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
          )

          const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any
          
          if (!error && data) {
            this.role = data.role
            this.fullName = data.full_name
          } else {
            throw new Error('Profile fetch failed')
          }
        } catch (err) {
          console.warn('Usando fallback de metadatos por lentitud o error en perfiles:', err)
          this.role = session.user.user_metadata.role || 'creator'
          this.fullName = session.user.user_metadata.full_name || null
        }
      } else {
        this.user = null
        this.role = null
        this.fullName = null
      }
      this.loading = false
    },
    async initialize() {
      const { data: { session } } = await supabase.auth.getSession()
      await this.setUser(session)

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await this.setUser(session)
        } else if (event === 'SIGNED_OUT') {
          this.user = null
          this.role = null
        }
      })
    },
    async signOut() {
      await supabase.auth.signOut()
      this.user = null
      this.role = null
      this.fullName = null
    }
  }
})
