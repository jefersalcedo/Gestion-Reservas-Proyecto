import { supabase } from './supabase'

export interface Cliente {
  id?: string
  full_name: string
  phone?: string
  email?: string
  role?: string
  created_at?: string
}

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || ''

function triggerN8N(action: string, data: any) {
  if (!N8N_WEBHOOK_URL) return
  
  // Disparamos y olvidamos (Fire & Forget) para no bloquear la UI
  fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data, timestamp: new Date().toISOString() })
  }).catch(error => console.error('Error triggering n8n webhook:', error))
}

export const clientesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'creator')
      .order('full_name', { ascending: true })
    
    if (error) throw error
    return data as Cliente[]
  },

  async create(cliente: Cliente) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ ...cliente, role: 'creator' }])
      .select()
      .single()
    
    if (error) throw error
    
    triggerN8N('create', data) // No bloqueante
    return data as Cliente
  },

  async update(id: string, cliente: Partial<Cliente>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(cliente)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    triggerN8N('update', data) // No bloqueante
    return data as Cliente
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    triggerN8N('delete', { id }) // No bloqueante
  }
}
