-- =============================================================================
-- GenesisGym Migration: Cash Register Sessions (Apertura y Cierre de Caja)
-- =============================================================================

-- Table: cash_sessions
CREATE TABLE cash_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  initial_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

-- Alter Table: sales to associate with a cash session
ALTER TABLE sales ADD COLUMN cash_session_id BIGINT REFERENCES cash_sessions(id) ON DELETE SET NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;

-- Development policies: Allow ALL for anonymous/public access.
CREATE POLICY "Allow ALL for anon on cash_sessions" ON cash_sessions FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX cash_sessions_user_id_idx ON cash_sessions(user_id);
CREATE INDEX cash_sessions_opened_at_idx ON cash_sessions(opened_at DESC);
CREATE INDEX sales_cash_session_id_idx ON sales(cash_session_id);
