-- Fase 7: fotos de avaliação + colunas adicionais

ALTER TABLE public.physical_assessments
  ADD COLUMN IF NOT EXISTS abdomen_cm  numeric(5,1),
  ADD COLUMN IF NOT EXISTS skinfolds   text;

CREATE TABLE IF NOT EXISTS public.assessment_photos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.physical_assessments(id) ON DELETE CASCADE,
  position      text NOT NULL DEFAULT 'Frente',
  photo_url     text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.assessment_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Aluno vê suas fotos de avaliação"   ON public.assessment_photos;
DROP POLICY IF EXISTS "Trainer gerencia fotos de avaliação" ON public.assessment_photos;

CREATE POLICY "Aluno vê suas fotos de avaliação" ON public.assessment_photos
  FOR SELECT TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM public.physical_assessments WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "Trainer gerencia fotos de avaliação" ON public.assessment_photos
  FOR ALL TO authenticated
  USING (is_trainer()) WITH CHECK (is_trainer());
