-- =============================================================================
-- Migración: Método de pago en ventas + Cliente Visitante
-- =============================================================================

-- 1. Añadir columna de método de pago a la tabla sales
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS payment_method TEXT
  NOT NULL DEFAULT 'efectivo'
  CHECK (payment_method IN ('efectivo', 'tarjeta', 'yape'));

-- 2. Insertar cliente comodín "Visitante" para pases de día sin registro
--    DNI: 00000000 — Este cliente NO debe eliminarse ni modificarse.
INSERT INTO clients (dni, first_name, last_name, email, phone, status, join_date)
VALUES ('00000000', 'Visitante', 'Ocasional', NULL, NULL, 'active', NOW())
ON CONFLICT (dni) DO NOTHING;

-- Habilitar política RLS para la nueva columna (ya cubierta por la política existente)
