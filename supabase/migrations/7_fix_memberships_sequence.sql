-- Realinear la secuencia de memberships para evitar colisiones de PK
-- cuando existan inserts manuales/seed con id explicito.
SELECT setval(
  pg_get_serial_sequence('memberships', 'id'),
  COALESCE((SELECT MAX(id) FROM memberships), 1),
  (SELECT MAX(id) IS NOT NULL FROM memberships)
);
