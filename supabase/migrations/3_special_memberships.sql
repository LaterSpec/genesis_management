-- Migration: Add special memberships (entry-limited) support
-- 1. Add allowed_entries to membership_plans and memberships, and used_entries to memberships
ALTER TABLE membership_plans ADD COLUMN allowed_entries INTEGER NULL;
ALTER TABLE memberships ADD COLUMN allowed_entries INTEGER NULL;
ALTER TABLE memberships ADD COLUMN used_entries INTEGER NOT NULL DEFAULT 0;

-- 2. Trigger function to handle attendance check-in insert
CREATE OR REPLACE FUNCTION handle_attendance_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_membership_id BIGINT;
BEGIN
  -- Encontrar la membresía limitada por ingresos que esté activa para este cliente y fecha
  SELECT id INTO v_membership_id
  FROM memberships
  WHERE client_id = NEW.client_id
    AND status = 'active'
    AND start_date <= NEW.attendance_at
    AND end_date >= NEW.attendance_at
    AND allowed_entries IS NOT NULL
    AND used_entries < allowed_entries
  ORDER BY start_date ASC
  LIMIT 1;

  IF v_membership_id IS NOT NULL THEN
    -- Incrementar entradas usadas
    UPDATE memberships
    SET used_entries = used_entries + 1
    WHERE id = v_membership_id;

    -- Cambiar estado a vencida automáticamente si se consumieron todos los ingresos
    UPDATE memberships
    SET status = 'expired'
    WHERE id = v_membership_id AND used_entries >= allowed_entries;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger function to handle attendance check-in delete
CREATE OR REPLACE FUNCTION handle_attendance_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_membership_id BIGINT;
BEGIN
  -- Encontrar la última membresía por ingresos del cliente donde se descontaron entradas
  SELECT id INTO v_membership_id
  FROM memberships
  WHERE client_id = OLD.client_id
    AND start_date <= OLD.attendance_at
    AND end_date >= OLD.attendance_at
    AND allowed_entries IS NOT NULL
    AND used_entries > 0
  ORDER BY end_date DESC
  LIMIT 1;

  IF v_membership_id IS NOT NULL THEN
    -- Decrementar entradas usadas y restaurar estado activo si venció pero aún está en plazo temporal
    UPDATE memberships
    SET used_entries = used_entries - 1,
        status = CASE
          WHEN status = 'expired' AND end_date >= NOW() THEN 'active'::membership_status
          ELSE status
        END
    WHERE id = v_membership_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Triggers
CREATE TRIGGER tr_attendance_insert
AFTER INSERT ON client_attendances
FOR EACH ROW
EXECUTE FUNCTION handle_attendance_insert();

CREATE TRIGGER tr_attendance_delete
AFTER DELETE ON client_attendances
FOR EACH ROW
EXECUTE FUNCTION handle_attendance_delete();
