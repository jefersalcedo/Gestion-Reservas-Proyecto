import { supabase } from './supabase'

export interface Servicio {
  id: string
  nombre: string
  descripcion: string | null
  estado: boolean
  created_at: string
  updated_at: string
  precio_actual?: number
}

export interface PrecioServicio {
  id: string
  servicio_id: string
  precio: number
  estado: boolean
  created_at: string
  updated_at: string
}

export const serviciosService = {
  async getServicios() {
    // Para obtener el precio más reciente, podemos usar una subconsulta o 
    // simplemente obtener los servicios y luego sus precios.
    // Una forma eficiente en Supabase es usar select con order y limit en la relación
    const { data, error } = await supabase
      .from('servicios')
      .select(`
        *,
        precios_servicios (
          precio,
          created_at
        )
      `)
      .order('created_at', { foreignTable: 'precios_servicios', ascending: false })

    if (error) throw error

    return data.map(s => ({
      ...s,
      precio_actual: s.precios_servicios?.[0] ? Number(s.precios_servicios[0].precio) : 0
    })) as (Servicio & { precio_actual: number })[]
  },

  async createServicio(servicio: Partial<Servicio>, precioInicial: number) {
    // 1. Insertar el servicio
    const { data: nuevoServicio, error: errorServicio } = await supabase
      .from('servicios')
      .insert([servicio])
      .select()
      .single()

    if (errorServicio) throw errorServicio

    // 2. Insertar el precio inicial
    const { error: errorPrecio } = await supabase
      .from('precios_servicios')
      .insert([{
        servicio_id: nuevoServicio.id,
        precio: precioInicial
      }])

    if (errorPrecio) throw errorPrecio

    return nuevoServicio as Servicio
  },

  async updateServicio(id: string, updates: Partial<Servicio>) {
    const { data, error } = await supabase
      .from('servicios')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Servicio
  },

  async deleteServicio(id: string) {
    const { error } = await supabase
      .from('servicios')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getPreciosByServicio(servicioId: string) {
    const { data, error } = await supabase
      .from('precios_servicios')
      .select('*')
      .eq('servicio_id', servicioId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as PrecioServicio[]
  },

  async addPrecioServicio(servicioId: string, precio: number) {
    const { data, error } = await supabase
      .from('precios_servicios')
      .insert([{
        servicio_id: servicioId,
        precio: precio
      }])
      .select()
      .single()

    if (error) throw error
    return data as PrecioServicio
  }
}
