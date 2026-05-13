-- Fase 6/7 — Avaliações Físicas e Dicas

CREATE TABLE IF NOT EXISTS physical_assessments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assessed_at   date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg     numeric(5,2),
  height_cm     numeric(5,1),
  body_fat_pct  numeric(4,1),
  chest_cm      numeric(5,1),
  waist_cm      numeric(5,1),
  hip_cm        numeric(5,1),
  bicep_cm      numeric(5,1),
  thigh_cm      numeric(5,1),
  notes         text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE physical_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Aluno vê suas avaliações" ON physical_assessments;
DROP POLICY IF EXISTS "Trainer gerencia avaliações" ON physical_assessments;

CREATE POLICY "Aluno vê suas avaliações" ON physical_assessments
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "Trainer gerencia avaliações" ON physical_assessments
  FOR ALL TO authenticated USING (is_trainer()) WITH CHECK (is_trainer());

CREATE TABLE IF NOT EXISTS tips (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  body       text NOT NULL,
  category   text NOT NULL DEFAULT 'Geral',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos autenticados leem dicas" ON tips;
DROP POLICY IF EXISTS "Trainer gerencia dicas" ON tips;

CREATE POLICY "Todos autenticados leem dicas" ON tips
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Trainer gerencia dicas" ON tips
  FOR ALL TO authenticated USING (is_trainer()) WITH CHECK (is_trainer());
