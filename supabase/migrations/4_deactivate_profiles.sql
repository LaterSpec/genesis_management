-- =============================================================================
-- GenesisGym Migration: Add is_active flag to profiles for soft deletion
-- =============================================================================

ALTER TABLE profiles ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
