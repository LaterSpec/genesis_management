CREATE TABLE client_attendances (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  registered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  attendance_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attendance_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX client_attendances_attendance_date_idx
  ON client_attendances (attendance_date DESC, attendance_at DESC);

CREATE INDEX client_attendances_client_id_attendance_date_idx
  ON client_attendances (client_id, attendance_date DESC);

ALTER TABLE client_attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow ALL for anon on client_attendances"
  ON client_attendances FOR ALL USING (true) WITH CHECK (true);
