-- Fase 4 — Fichas e Programas de Treino

CREATE TABLE programs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        text NOT NULL,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE workout_sheets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name        text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE sheet_exercises (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id     uuid NOT NULL REFERENCES workout_sheets(id) ON DELETE CASCADE,
  exercise_id  uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  sets         int NOT NULL DEFAULT 3,
  reps         text NOT NULL DEFAULT '12',
  load         text,
  rest_seconds int,
  notes        text,
  order_index  int NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheet_exercises ENABLE ROW LEVEL SECURITY;

-- Programs
CREATE POLICY "Trainer gerencia programas" ON programs
  FOR ALL TO authenticated USING (is_trainer()) WITH CHECK (is_trainer());

CREATE POLICY "Aluno vê seu programa" ON programs
  FOR SELECT TO authenticated USING (student_id = auth.uid());

-- Workout sheets
CREATE POLICY "Trainer gerencia fichas" ON workout_sheets
  FOR ALL TO authenticated USING (is_trainer()) WITH CHECK (is_trainer());

CREATE POLICY "Aluno vê fichas do seu programa" ON workout_sheets
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM programs p
    WHERE p.id = workout_sheets.program_id AND p.student_id = auth.uid()
  ));

-- Sheet exercises
CREATE POLICY "Trainer gerencia exercícios da ficha" ON sheet_exercises
  FOR ALL TO authenticated USING (is_trainer()) WITH CHECK (is_trainer());

CREATE POLICY "Aluno vê exercícios da sua ficha" ON sheet_exercises
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM workout_sheets ws
    JOIN programs p ON p.id = ws.program_id
    WHERE ws.id = sheet_exercises.sheet_id AND p.student_id = auth.uid()
  ));
