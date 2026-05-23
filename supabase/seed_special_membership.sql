-- 1. Insertar Plan Especial de 30 Ingresos / 2 Meses
INSERT INTO membership_plans (id, name, description, price, duration_days, allowed_entries)
VALUES (5, 'Membresía Especial (30 ingresos)', 'Plan especial de 30 ingresos al gimnasio con validez de 2 meses (60 días).', 150.00, 60, 30)
ON CONFLICT (id) DO NOTHING;

-- Reiniciar la secuencia de ID de planes de membresía
SELECT setval('membership_plans_id_seq', GREATEST((SELECT MAX(id) FROM membership_plans), 5));

-- 2. Activar al cliente Luis Gómez (ID 11) y asignarle la membresía especial
UPDATE clients SET status = 'active' WHERE id = 11;

-- Asignar membresía con 12 entradas ya consumidas para simular progreso parcial
INSERT INTO memberships (id, client_id, plan_id, start_date, end_date, status, allowed_entries, used_entries)
VALUES (10, 11, 5, NOW() - INTERVAL '10 days', NOW() + INTERVAL '50 days', 'active', 30, 12)
ON CONFLICT (id) DO NOTHING;

SELECT setval('memberships_id_seq', GREATEST((SELECT MAX(id) FROM memberships), 10));

-- 3. Registrar algunas asistencias para comprobar triggers y listado
INSERT INTO client_attendances (client_id, attendance_at, attendance_date)
VALUES
  (11, NOW() - INTERVAL '8 days 4 hours', (CURRENT_DATE - INTERVAL '8 days')::date),
  (11, NOW() - INTERVAL '5 days 2 hours', (CURRENT_DATE - INTERVAL '5 days')::date),
  (11, NOW() - INTERVAL '2 days 1 hour',  (CURRENT_DATE - INTERVAL '2 days')::date)
ON CONFLICT DO NOTHING;
