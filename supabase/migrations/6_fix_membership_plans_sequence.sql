-- Realinear la secuencia de membership_plans para evitar colisiones de PK
-- cuando existan inserts manuales/seed con id explícito.
SELECT setval(
  pg_get_serial_sequence('membership_plans', 'id'),
  COALESCE((SELECT MAX(id) FROM membership_plans), 1),
  (SELECT MAX(id) IS NOT NULL FROM membership_plans)
);
