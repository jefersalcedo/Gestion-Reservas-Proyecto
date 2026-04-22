import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Desactivar el body parser automático de Vercel para esta ruta
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Supabase Client (usando service role para asegurar acceso)
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { servicio_id, reserva_id } = session.metadata;

    console.log(`✅ Pago completado para servicio: ${servicio_id}${reserva_id ? ` y reserva: ${reserva_id}` : ''}`);

    const { error: errorPago } = await supabase
      .from('pagos')
      .update({ 
        estado: 'completado',
        fecha_pago: new Date().toISOString()
      })
      .eq('stripe_session_id', session.id);

    if (errorPago) {
      console.error('❌ Error actualizando pago:', errorPago);
      return res.status(500).json({ error: 'Error actualizando base de datos' });
    }

    if (reserva_id) {
      const { error: errorReserva } = await supabase
        .from('reservas')
        .update({ estado: 'confirmada' })
        .eq('id', reserva_id);
      
      if (errorReserva) {
        console.error('❌ Error actualizando reserva:', errorReserva);
      }
    }
  }

  res.json({ received: true });
}
