-- Fase 3 — Biblioteca de exercícios

CREATE TABLE exercises (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  muscle_group  text NOT NULL,
  equipment     text,
  description   text,
  thumbnail_url text,
  video_url     text,
  is_custom     boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado lê exercícios
CREATE POLICY "Autenticado lê exercícios" ON exercises
  FOR SELECT TO authenticated USING (true);

-- Só trainer cria, edita e deleta
CREATE POLICY "Trainer gerencia exercícios" ON exercises
  FOR ALL TO authenticated USING (is_trainer()) WITH CHECK (is_trainer());

-- Seed: exercícios pré-cadastrados
INSERT INTO exercises (name, muscle_group, equipment, is_custom) VALUES
  ('Supino Reto', 'chest', 'barbell', false),
  ('Supino Inclinado', 'chest', 'barbell', false),
  ('Crucifixo', 'chest', 'dumbbell', false),
  ('Crossover', 'chest', 'cable', false),
  ('Flexão de Braço', 'chest', 'bodyweight', false),
  ('Puxada Frontal', 'back', 'machine', false),
  ('Remada Curvada', 'back', 'barbell', false),
  ('Remada Unilateral', 'back', 'dumbbell', false),
  ('Pull-up', 'back', 'bodyweight', false),
  ('Levantamento Terra', 'back', 'barbell', false),
  ('Agachamento Livre', 'legs', 'barbell', false),
  ('Leg Press', 'legs', 'machine', false),
  ('Extensão de Perna', 'legs', 'machine', false),
  ('Mesa Flexora', 'legs', 'machine', false),
  ('Avanço', 'legs', 'dumbbell', false),
  ('Panturrilha em Pé', 'legs', 'machine', false),
  ('Desenvolvimento', 'shoulders', 'barbell', false),
  ('Elevação Lateral', 'shoulders', 'dumbbell', false),
  ('Elevação Frontal', 'shoulders', 'dumbbell', false),
  ('Rosca Direta', 'biceps', 'barbell', false),
  ('Rosca Alternada', 'biceps', 'dumbbell', false),
  ('Rosca Concentrada', 'biceps', 'dumbbell', false),
  ('Tríceps Testa', 'triceps', 'barbell', false),
  ('Tríceps Corda', 'triceps', 'cable', false),
  ('Mergulho', 'triceps', 'bodyweight', false),
  ('Prancha', 'core', 'bodyweight', false),
  ('Abdominal Crunch', 'core', 'bodyweight', false),
  ('Elevação de Pernas', 'core', 'bodyweight', false),
  ('Corrida', 'cardio', null, false),
  ('Bicicleta', 'cardio', 'machine', false),
  ('Pular Corda', 'cardio', null, false);
