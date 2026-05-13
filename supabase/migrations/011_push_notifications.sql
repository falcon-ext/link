-- Fase 8: push token nos perfis + dicas direcionadas por aluno

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_token text;

ALTER TABLE public.tips
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Substitui a policy anterior que liberava para todos
DROP POLICY IF EXISTS "Todos autenticados leem dicas" ON public.tips;

-- Aluno vê dicas para todos (student_id IS NULL) ou para si mesmo
CREATE POLICY "Alunos leem suas dicas" ON public.tips
  FOR SELECT TO authenticated
  USING (
    is_trainer()
    OR student_id IS NULL
    OR student_id = auth.uid()
  );
