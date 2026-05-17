-- =============================================================================
-- GenesisGym Seed Data
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── AUTH USERS & PROFILES ────────────────────────────────────────────────────
-- Insertar usuarios en auth.users (mockeando auth para desarrollo)
-- Administrador:
INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token,
  email_change_token_new, email_change_token_current,
  email_change, reauthentication_token, phone_change_token,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin@genesisgym.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}', '{}',
    NOW(), NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'reception@genesisgym.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}', '{}',
    NOW(), NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change_token_current = '',
  email_change = '',
  reauthentication_token = '',
  phone_change_token = '';


-- Insertar identidades de auth
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000001', 'admin@genesisgym.com')::jsonb, 'email', NOW(), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000002', 'reception@genesisgym.com')::jsonb, 'email', NOW(), NOW(), NOW())
ON CONFLICT (provider_id, provider) DO NOTHING;

-- Insertar sus correspondientes profiles
INSERT INTO profiles (id, first_name, last_name, role, birth_date, registration_date, gender, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'Principal', 'administrator', '1980-01-01', NOW(), 'masculino', NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Juan', 'Pérez', 'receptionist', '1995-05-15', NOW(), 'masculino', NOW())
ON CONFLICT (id) DO NOTHING;

-- ─── PLANS ────────────────────────────────────────────────────────────────────
INSERT INTO membership_plans (id, name, description, price, duration_days) VALUES
  (1, 'Plan Diario',    'Pase de acceso por un día.', 5.00, 1),
  (2, 'Plan Mensual',   'Acceso ilimitado a áreas de peso libre, cardio y clases grupales estándar.', 59.99, 30),
  (3, 'Plan Trimestral','Acceso completo por 3 meses con descuento.', 149.99, 90),
  (4, 'Plan Anual',     'Mejor precio por año completo con acceso a clases premium.', 450.00, 365)
ON CONFLICT (id) DO NOTHING;

-- Reiniciar la secuencia para la tabla
SELECT setval('membership_plans_id_seq', 4);

-- ─── CATEGORIES ───────────────────────────────────────────────────────────────
INSERT INTO categories (id, name) VALUES
  (1, 'Suplementos'),
  (2, 'Bebidas'),
  (3, 'Equipo')
ON CONFLICT (id) DO NOTHING;

SELECT setval('categories_id_seq', 3);

-- ─── PRODUCTS ─────────────────────────────────────────────────────────────────
INSERT INTO products (id, sku, name, category_id, price, stock, image_url) VALUES
  (1, 'ON-WHEY-01',  'Optimum Nutrition Gold Standard Whey', 1, 45.99, 85,  NULL),
  (2, 'ON-WHEY-02L', 'Whey Protein 2lbs',                   1, 34.50, 42,  NULL),
  (3, 'C4-ENR-12',   'C4 Energy',                           2, 3.50,  5,   NULL),
  (4, 'AQM-MIN-1L',  'Agua Mineral 1L',                     2, 2.50,  120, NULL),
  (5, 'ENB-CRO-12',  'Energy Boost Cero',                   2, 3.00,  60,  NULL),
  (6, 'RG-BLT-01',   'Rogue Ohio Lifting Belt',             3, 65.00, 24,  NULL),
  (7, 'MK-YGA-01',   'Manduka Pro Yoga Mat',                3, 120.00, 15, NULL)
ON CONFLICT (id) DO NOTHING;

SELECT setval('products_id_seq', 7);

-- ─── CLIENTS ──────────────────────────────────────────────────────────────────
INSERT INTO clients (id, dni, first_name, last_name, email, phone, status, join_date) VALUES
  (1, '0912345678', 'Carlos',   'Mendoza',  'carlos.m@email.com',   '0991234567', 'active',   NOW() - INTERVAL '2 years'),
  (2, '0923456789', 'Ana',      'Ramírez',  'ana.r92@email.com',    '0992345678', 'active',   NOW() - INTERVAL '1 year 7 months'),
  (3, '0934567890', 'Laura',    'Torres',   'ltorres@email.com',    '0993456789', 'inactive', NOW() - INTERVAL '3 years'),
  (4, '0945678901', 'Javier',   'Vargas',   'javier.v@email.com',   '0994567890', 'active',   NOW() - INTERVAL '1 year 4 months'),
  (5, '0956789012', 'Laura',    'Salazar',  'lsalazar@email.com',   '0995678901', 'active',   NOW() - INTERVAL '8 months'),
  (6, '0967890123', 'Roberto',  'Morales',  'r.morales@email.com',  '0996789012', 'active',   NOW() - INTERVAL '5 months'),
  (7, '0978901234', 'Lucia',    'Fernandez','l.fernandez@email.com','0997890123', 'active',   NOW() - INTERVAL '1 year'),
  (8, '0989012345', 'Roberto',  'Diaz',     'r.diaz@email.com',     '0998901234', 'inactive', NOW() - INTERVAL '6 months'),
  (9, '0990123456', 'Sofia',    'Castro',   'sofia.c@email.com',    '0999012345', 'active',   NOW() - INTERVAL '3 months'),
  (10,'0901234567', 'Ana',      'Gómez',    'ana.gomez@email.com',  '0990123456', 'active',   NOW() - INTERVAL '10 months'),
  (11,'0911234567', 'Luis',     'Gómez',    'luis.gomez@email.com', '0981234567', 'inactive', NOW() - INTERVAL '14 months')
ON CONFLICT (id) DO NOTHING;

SELECT setval('clients_id_seq', 11);

-- ─── MEMBERSHIPS ──────────────────────────────────────────────────────────────
INSERT INTO memberships (id, client_id, plan_id, start_date, end_date, status) VALUES
  (1, 1, 4, NOW() - INTERVAL '5 days', NOW() + INTERVAL '360 days', 'active'),
  (2, 2, 2, NOW() - INTERVAL '12 days', NOW() + INTERVAL '18 days', 'active'),
  (3, 3, 2, NOW() - INTERVAL '2 months', NOW() - INTERVAL '1 month', 'expired'),
  (4, 4, 3, NOW() - INTERVAL '15 days', NOW() + INTERVAL '75 days', 'active'),
  (5, 5, 2, NOW() - INTERVAL '20 days', NOW() + INTERVAL '10 days', 'active'),
  (6, 6, 2, NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 'active'),
  (7, 7, 4, NOW() - INTERVAL '6 months', NOW() + INTERVAL '6 months', 'active'),
  (8, 8, 2, NOW() - INTERVAL '35 days', NOW() - INTERVAL '5 days', 'expired'),
  (9, 10,2, NOW() - INTERVAL '1 day', NOW() + INTERVAL '29 days', 'active')
ON CONFLICT (id) DO NOTHING;

SELECT setval('memberships_id_seq', 9);

-- ─── CLIENT CREDITS (Deudas) ───────────────────────────────────────────────────
INSERT INTO client_credits (id, client_id, balance, last_updated) VALUES
  (1, 1, 1200.00, NOW() - INTERVAL '5 days'),
  (2, 5, 450.00,  NOW() - INTERVAL '2 days'),
  (3, 6, 80.50,   NOW() - INTERVAL '3 days'),
  (4, 4, 0.00,    NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('client_credits_id_seq', 4);

-- ─── SALES & TRANSACTIONS ──────────────────────────────────────────────────────
-- Venta 1: Renovación anual Carlos Mendoza
INSERT INTO sales (id, client_id, total, status, created_at, seller_id)
VALUES (1, 1, 450.00, 'completed', NOW() - INTERVAL '5 days', '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sale_items (id, sale_id, membership_id, quantity, unit_price)
VALUES (1, 1, 1, 1, 450.00)
ON CONFLICT DO NOTHING;

INSERT INTO financial_transactions (id, type, amount, description, category, sale_id, date)
VALUES (1, 'income', 450.00, 'Renovación Anual - Carlos M.', 'Membresía', 1, NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- Venta 2: Proteína Whey 2kg
INSERT INTO sales (id, client_id, total, status, created_at, seller_id)
VALUES (2, 2, 85.00, 'completed', NOW() - INTERVAL '2 hours', '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price)
VALUES (2, 2, 1, 1, 85.00)
ON CONFLICT DO NOTHING;

INSERT INTO financial_transactions (id, type, amount, description, category, sale_id, date)
VALUES (2, 'income', 85.00, 'Proteína Whey 2kg', 'Producto', 2, NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- Egreso: Mantenimiento de Equipos
INSERT INTO financial_transactions (id, type, amount, description, category, date)
VALUES (3, 'expense', 320.00, 'Mantenimiento Equipos', 'Operaciones', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Venta 3: Plan Mensual Ana Gómez
INSERT INTO sales (id, client_id, total, status, created_at, seller_id)
VALUES (3, 10, 45.00, 'completed', NOW() - INTERVAL '1 day', '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sale_items (id, sale_id, membership_id, quantity, unit_price)
VALUES (3, 3, 9, 1, 45.00)
ON CONFLICT DO NOTHING;

INSERT INTO financial_transactions (id, type, amount, description, category, sale_id, date)
VALUES (4, 'income', 45.00, 'Plan Mensual - Ana Gómez', 'Membresía', 3, NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Egresos varios
INSERT INTO financial_transactions (id, type, amount, description, category, date) VALUES
  (5, 'income',  1200.00, 'Membresias del día (lote)',  'Membresía',   NOW() - INTERVAL '6 days'),
  (6, 'expense',  400.00, 'Compra suplementos proveedor','Inventario',  NOW() - INTERVAL '6 days'),
  (7, 'income',   800.00, 'Membresias del día (lote)',  'Membresía',   NOW() - INTERVAL '5 days'),
  (8, 'expense',  200.00, 'Servicios básicos',           'Operaciones', NOW() - INTERVAL '4 days'),
  (9, 'income',  1500.00, 'Ventas del día',              'Producto',    NOW() - INTERVAL '3 days'),
  (10,'expense',  350.00, 'Nómina parcial',              'Nómina',      NOW() - INTERVAL '2 days'),
  (11,'income',   950.00, 'Membresias + productos',      'Mixto',       NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

SELECT setval('sales_id_seq', 3);
SELECT setval('sale_items_id_seq', 3);
SELECT setval('financial_transactions_id_seq', 11);

-- ─── ACTIVITY LOGS ────────────────────────────────────────────────────────────
INSERT INTO activity_logs (id, client_id, action_type, description, is_error, created_at) VALUES
  (1, 1,  'ACCESS_GRANTED',    'Ingreso al gimnasio. Membresía activa.',             false, NOW() - INTERVAL '18 minutes'),
  (2, 2,  'SALE_CREATED',      'Compró Batido Proteína $85.00.',                     false, NOW() - INTERVAL '45 minutes'),
  (3, 11, 'ACCESS_DENIED',     'Membresía Vencida. Acceso denegado.',                true,  NOW() - INTERVAL '1 hour 10 minutes'),
  (4, 9,  'ACCESS_GRANTED',    'Ingreso al gimnasio. Membresía activa.',             false, NOW() - INTERVAL '1 hour 30 minutes'),
  (5, 1,  'MEMBERSHIP_CREATED','Renovación Plan Anual - $450.00 (Pagado Tarjeta).',  false, NOW() - INTERVAL '5 days'),
  (6, 7,  'ACCESS_GRANTED',    'Entrada por torniquete principal. Membresía activa.',false, NOW() - INTERVAL '1 day 45 minutes'),
  (7, NULL,'STOCK_ADJUSTMENT',  'Ingreso: 24x Bebida Energética (Lote B-99).',        false, NOW() - INTERVAL '1 day 2 hours'),
  (8, 8,  'ACCESS_DENIED',     'Membresía Vencida (Venció 5 días atrás).',           true,  NOW() - INTERVAL '1 day 3 hours')
ON CONFLICT DO NOTHING;

SELECT setval('activity_logs_id_seq', 8);
