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
        
        // Prioritize metadata first as it's immediate
        this.fullName = session.user.user_metadata?.full_name || null
        this.role = session.user.user_metadata?.role || 'creator'

        try {
          // Then try to get the most up-to-date info from the database
          const { data, error } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', session.user.id)
            .single()
          
          if (!error && data) {
            this.role = data.role || this.role
            if (data.full_name) {
              this.fullName = data.full_name
            }
          }
        } catch (err) {
          console.warn('Error fetching profile from database, using metadata:', err)
        }
      } else {
        this.user = null
        this.role = null
        this.fullName = null
      }
      this.loading = false
    },
    async initialize() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        await this.setUser(session)
      } catch (err) {
        console.error('Error during auth initialization:', err)
        this.loading = false
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await this.setUser(session)
          } else if (event === 'SIGNED_OUT') {
            this.user = null
            this.role = null
            this.fullName = null
            this.loading = false
          }
        } catch (err) {
          console.error('Error in onAuthStateChange:', err)
          this.loading = false
        }
      })
    },
    async signOut() {
      try {
        await supabase.auth.signOut()
      } catch (err) {
        console.error('Error during sign out:', err)
      } finally {
        this.user = null
        this.role = null
        this.fullName = null
      }
    }
  }
})
