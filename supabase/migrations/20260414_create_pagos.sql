-- Migration to create the payments table
CREATE TABLE IF NOT EXISTS pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id UUID REFERENCES servicios(id) ON DELETE SET NULL,
    stripe_session_id TEXT UNIQUE,
    estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'completado', 'fallido'
    monto NUMERIC NOT NULL,
    moneda TEXT DEFAULT 'cop',
    fecha_pago TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users (or public if requested)
CREATE POLICY "Enable read access for all users" ON pagos FOR SELECT USING (true);

-- Functions and Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pagos_updated_at
    BEFORE UPDATE ON pagos
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
