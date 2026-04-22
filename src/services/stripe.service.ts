import { supabase } from './supabase'

export const stripeService = {
  /**
   * Inicializa un proceso de pago creando una sesión en Stripe via Edge Function
   * @param servicioId ID del servicio a pagar
   */
  async crearCheckout(servicioId: string, reservaId?: string) {
    try {
      // Llamamos a la API (Vercel maneja la ruta /api automáticamente)
      const response = await fetch('/api/crear-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          servicio_id: servicioId,
          reserva_id: reservaId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al conectar con la pasarela de pagos');
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (error: any) {
      console.error('Error en stripeService:', error);
      throw error;
    }
  },

  /**
   * Obtiene el historial de pagos (opcional para el dashboard)
   */
  async getPagos() {
    const { data, error } = await supabase
      .from('pagos')
      .select(`
        *,
        servicios (nombre)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}
