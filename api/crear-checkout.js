import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { servicio_id, reserva_id } = req.body;

    if (!servicio_id) {
      return res.status(400).json({ error: 'servicio_id es requerido' });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    // 1. Consultar precio en DB
    const { data: servicio, error: dbError } = await supabase
      .from('servicios')
      .select(`
        nombre,
        precios_servicios (
          precio,
          estado
        )
      `)
      .eq('id', servicio_id)
      .eq('precios_servicios.estado', true)
      .order('created_at', { foreignTable: 'precios_servicios', ascending: false })
      .limit(1)
      .single();

    if (dbError || !servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado o sin precio activo' });
    }

    const precio = servicio.precios_servicios[0].precio;
    const nombre = servicio.nombre;

    // 2. Crear sesión en Stripe
    const appUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/` : 'http://localhost:5173/');
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cop',
            product_data: { name: nombre },
            unit_amount: Math.round(precio * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}servicios`,
      metadata: { 
        servicio_id,
        reserva_id: reserva_id || '' 
      },
    });

    // 3. Registrar pago pendiente
    await supabase.from('pagos').insert({
      servicio_id,
      reserva_id: reserva_id || null,
      stripe_session_id: session.id,
      monto: precio,
      estado: 'pendiente'
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('❌ Error en checkout:', error);
    res.status(500).json({ error: error.message });
  }
}
