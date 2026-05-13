-- Feed social — check-ins automáticos + fotos + likes

CREATE TABLE feed_posts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workout_log_id      uuid REFERENCES workout_logs(id) ON DELETE SET NULL,
  -- denormalizados para evitar join com RLS restritivo de profiles e workout_sheets
  student_name        text NOT NULL,
  student_avatar_url  text,
  sheet_name          text,
  photo_url           text,
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos veem posts" ON feed_posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Aluno gerencia seus posts" ON feed_posts
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Trainer pode deletar qualquer post (moderação)
CREATE POLICY "Trainer modera posts" ON feed_posts
  FOR DELETE TO authenticated USING (is_trainer());

CREATE TABLE post_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, student_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos veem likes" ON post_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuário gerencia seus likes" ON post_likes
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());
