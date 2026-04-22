import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// El webhook necesita el body en crudo (raw) para validar la firma
app.post('/api/webhook-stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Supabase Client (usando service role para asegurar acceso)
  // Nota: Asegúrate de tener SUPABASE_SERVICE_ROLE_KEY en el .env
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

    // Si hay una reserva_id, actualizar el estado de la reserva a 'confirmada'
    if (reserva_id) {
      const { error: errorReserva } = await supabase
        .from('reservas')
        .update({ estado: 'confirmada' })
        .eq('id', reserva_id);
      
      if (errorReserva) {
        console.error('❌ Error actualizando reserva:', errorReserva);
      } else {
        console.log(`✨ Reserva ${reserva_id} confirmada exitosamente.`);
      }
    }
  }

  res.json({ received: true });
});

// Middleware para el resto de rutas
app.use(cors());
app.use(express.json());

app.post('/api/crear-checkout', async (req, res) => {
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
      success_url: `${process.env.APP_URL}success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}servicios`,
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
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
