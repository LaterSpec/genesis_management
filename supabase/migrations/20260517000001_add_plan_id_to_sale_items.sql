-- =============================================================================
-- Migración: Añadir plan_id a sale_items para registrar qué plan se vendió
-- sin necesidad de crear una membresía (ej. Visitantes ocasionales)
-- =============================================================================

ALTER TABLE sale_items
ADD COLUMN IF NOT EXISTS plan_id BIGINT REFERENCES membership_plans(id) ON DELETE SET NULL;
