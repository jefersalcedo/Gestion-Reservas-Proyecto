import { supabase } from './supabase'

export interface Reserva {
  id: string
  usuario_id: string
  servicio_id: string
  fecha: string // 'YYYY-MM-DD'
  hora: string  // 'HH:mm:ss'
  estado: 'pendiente' | 'confirmada' | 'cancelada'
  created_at: string
  updated_at: string
  // Join fields
  servicios?: {
    nombre: string
  }
}

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || ''

async function triggerN8N(data: any) {
  if (!N8N_WEBHOOK_URL) {
    console.warn('VITE_N8N_WEBHOOK_URL no está configurada.')
    return
  }
  
  try {
    // No bloqueamos el flujo principal, disparamos y olvidamos (o logueamos error)
    fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(err => console.error('Error enviando a n8n:', err))
  } catch (error) {
    console.error('Error al intentar disparar el webhook de n8n:', error)
  }
}

export const reservasService = {
  async getMisReservas() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('reservas')
      .select(`
        *,
        servicios (
          nombre
        )
      `)
      .eq('usuario_id', user.id)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })

    if (error) throw error
    return data as (Reserva & { servicios: { nombre: string } })[]
  },

  async getReservaById(id: string) {
    const { data, error } = await supabase
      .from('reservas')
      .select(`
        *,
        servicios (
          nombre
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as (Reserva & { servicios: { nombre: string } })
  },

  async checkDuplicateSchedule(fecha: string, hora: string, excludeId?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    let query = supabase
      .from('reservas')
      .select('id')
      .eq('usuario_id', user.id)
      .eq('fecha', fecha)
      .eq('hora', hora)
      .neq('estado', 'cancelada')

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return data && data.length > 0
  },

  async createReserva(reserva: Partial<Reserva>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    // Validar duplicados antes de insertar
    const isDuplicate = await this.checkDuplicateSchedule(reserva.fecha!, reserva.hora!)
    if (isDuplicate) {
      throw new Error('Ya tienes una reserva para esta fecha y hora.')
    }

    // 1. Insertar la reserva (obteniendo el nombre del servicio en el mismo paso)
    const { data, error } = await supabase
      .from('reservas')
      .insert([{
        ...reserva,
        usuario_id: user.id,
        estado: 'pendiente'
      }])
      .select(`
        *,
        servicios (
          nombre
        )
      `)
      .single()

    if (error) throw error

    // 2. Obtener datos del perfil para la notificación
    // Nota: Asumimos que los campos son full_name y phone en la tabla profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()

    // 3. Disparar notificación a n8n
    // Construimos el objeto con el formato solicitado
    triggerN8N({
      accion: 'crear',
      nombre: profile?.full_name || user.email?.split('@')[0] || 'Cliente',
      telefono: profile?.phone || '',
      correo: user.email,
      servicio: data.servicios?.nombre || 'Servicio General',
      fecha: data.fecha,
      hora: data.hora.substring(0, 5),
      reserva_id: data.id,
      timestamp: new Date().toISOString()
    })

    return data as Reserva
  },

  async updateReserva(id: string, updates: Partial<Reserva>) {
    // Si se actualiza fecha u hora, validar duplicados
    if (updates.fecha || updates.hora) {
      const current = await this.getReservaById(id)
      const newFecha = updates.fecha || current.fecha
      const newHora = updates.hora || current.hora
      
      const isDuplicate = await this.checkDuplicateSchedule(newFecha, newHora, id)
      if (isDuplicate) {
        throw new Error('Ya tienes una reserva para esta fecha y hora.')
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('reservas')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        servicios (
          nombre
        )
      `)
      .single()

    if (error) throw error

    // Obtener datos del perfil para la notificación de edición
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()

    // Disparar notificación de edición a n8n
    triggerN8N({
      accion: 'editar',
      nombre: profile?.full_name || user.email?.split('@')[0] || 'Cliente',
      telefono: profile?.phone || '',
      correo: user.email,
      servicio: data.servicios?.nombre || 'Servicio General',
      fecha: data.fecha,
      hora: data.hora.substring(0, 5),
      reserva_id: data.id,
      timestamp: new Date().toISOString()
    })

    return data as Reserva
  },

  async cancelReserva(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('reservas')
      .update({
        estado: 'cancelada',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        servicios (
          nombre
        )
      `)
      .single()

    if (error) throw error

    // Obtener datos del perfil para la notificación de cancelación
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()

    // Disparar notificación de cancelación a n8n
    triggerN8N({
      accion: 'cancelar',
      nombre: profile?.full_name || user.email?.split('@')[0] || 'Cliente',
      telefono: profile?.phone || '',
      correo: user.email,
      servicio: data.servicios?.nombre || 'Servicio General',
      fecha: data.fecha,
      hora: data.hora.substring(0, 5),
      reserva_id: data.id,
      timestamp: new Date().toISOString()
    })

    return data as Reserva
  }
}
