-- Add reserva_id to pagos table
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS reserva_id UUID REFERENCES reservas(id) ON DELETE SET NULL;
