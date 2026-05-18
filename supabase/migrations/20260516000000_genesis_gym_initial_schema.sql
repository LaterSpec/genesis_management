-- =============================================================================
-- GenesisGym Initial Schema
-- Recreado para tener todo en una única migración de inicio
-- =============================================================================

-- Enums
CREATE TYPE role_enum AS ENUM ('administrator', 'receptionist');
CREATE TYPE membership_status AS ENUM ('active', 'expired', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- Table: profiles (Extends auth.users, debe mantener UUID por compatibilidad con Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role role_enum NOT NULL DEFAULT 'receptionist',
  birth_date DATE,
  registration_date TIMESTAMPTZ,
  gender TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: clients (IDs convertidos a BIGSERIAL)
CREATE TABLE clients (
  id BIGSERIAL PRIMARY KEY,
  dni TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  join_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: membership_plans
CREATE TABLE membership_plans (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL
);

-- Table: memberships
CREATE TABLE memberships (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  plan_id BIGINT NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status membership_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: categories
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

-- Table: products
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  price NUMERIC(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT
);

-- Table: sales
CREATE TABLE sales (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'completed',
  seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Table: sale_items
CREATE TABLE sale_items (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  membership_id BIGINT REFERENCES memberships(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL
);

-- Table: financial_transactions
CREATE TABLE financial_transactions (
  id BIGSERIAL PRIMARY KEY,
  type transaction_type NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  category TEXT,
  sale_id BIGINT REFERENCES sales(id) ON DELETE SET NULL
);

-- Table: client_credits
CREATE TABLE client_credits (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT UNIQUE NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  balance NUMERIC(10, 2) NOT NULL DEFAULT 0, -- Deuda actual del cliente
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: activity_logs
CREATE TABLE activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  is_error BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Row Level Security (RLS) - Basic Setup & Dev Policies
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de desarrollo: Permiten acceso completo al rol anon.
-- IMPORTANTE: Cambiar en producción con políticas restrictivas basadas en el rol.
CREATE POLICY "Allow ALL for anon on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL for anon on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL for anon on membership_plans" ON membership_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL for anon on memberships" ON memberships FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL for anon on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL for anon on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL for anon on sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL for anon on sale_items" ON sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL for anon on financial_transactions" ON financial_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL for anon on client_credits" ON client_credits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL for anon on activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
WA