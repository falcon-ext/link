-- Fase 5 — Execução do Treino

CREATE TABLE workout_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sheet_id         uuid NOT NULL REFERENCES workout_sheets(id) ON DELETE CASCADE,
  started_at       timestamptz DEFAULT now(),
  finished_at      timestamptz,
  duration_seconds int
);

CREATE TABLE set_logs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id     uuid NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  sheet_exercise_id  uuid NOT NULL REFERENCES sheet_exercises(id) ON DELETE CASCADE,
  set_number         int NOT NULL,
  load_used          text,
  completed_at       timestamptz DEFAULT now()
);

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;

-- Aluno gerencia seus próprios logs
CREATE POLICY "Aluno gerencia seus logs" ON workout_logs
  FOR ALL TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

-- Trainer lê logs de todos
CREATE POLICY "Trainer lê todos os logs" ON workout_logs
  FOR SELECT TO authenticated USING (is_trainer());

-- Set logs via workout_log
CREATE POLICY "Aluno gerencia seus set_logs" ON set_logs
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM workout_logs wl WHERE wl.id = set_logs.workout_log_id AND wl.student_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM workout_logs wl WHERE wl.id = set_logs.workout_log_id AND wl.student_id = auth.uid()
  ));

CREATE POLICY "Trainer lê todos os set_logs" ON set_logs
  FOR SELECT TO authenticated USING (is_trainer());
