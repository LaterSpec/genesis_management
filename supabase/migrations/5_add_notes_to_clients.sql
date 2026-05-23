-- =============================================================================
-- GenesisGym Migration: Add notes column to clients table
-- =============================================================================

ALTER TABLE clients ADD COLUMN notes TEXT;
