-- Migration 013: dobras individuais, perimetria expandida, indices corporais
ALTER TABLE public.physical_assessments
  ADD COLUMN IF NOT EXISTS sex               text,
  ADD COLUMN IF NOT EXISTS age_years         integer,
  ADD COLUMN IF NOT EXISTS skinfold_protocol text,
  ADD COLUMN IF NOT EXISTS sf_peitoral       numeric,
  ADD COLUMN IF NOT EXISTS sf_axilar_media   numeric,
  ADD COLUMN IF NOT EXISTS sf_triceps        numeric,
  ADD COLUMN IF NOT EXISTS sf_subescapular   numeric,
  ADD COLUMN IF NOT EXISTS sf_abdominal      numeric,
  ADD COLUMN IF NOT EXISTS sf_suprailiaca    numeric,
  ADD COLUMN IF NOT EXISTS sf_coxa           numeric,
  ADD COLUMN IF NOT EXISTS braco_contraido_cm numeric,
  ADD COLUMN IF NOT EXISTS coxa_medial_cm    numeric;
