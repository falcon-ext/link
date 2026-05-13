-- Fase 6 — Ranking Mensal (SECURITY DEFINER bypassa RLS p/ agregar dados de todos os alunos)

CREATE OR REPLACE FUNCTION get_monthly_ranking()
RETURNS TABLE(
  student_id    uuid,
  student_name  text,
  avatar_url    text,
  workout_count int,
  rank          int
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    wl.student_id,
    p.name        AS student_name,
    p.avatar_url,
    COUNT(*)::int AS workout_count,
    RANK() OVER (ORDER BY COUNT(*) DESC)::int AS rank
  FROM public.workout_logs wl
  JOIN public.profiles p ON p.id = wl.student_id
  WHERE
    wl.finished_at IS NOT NULL
    AND p.role = 'student'
    AND p.is_active = true
    AND date_trunc('month', wl.finished_at) = date_trunc('month', now())
  GROUP BY wl.student_id, p.name, p.avatar_url
  ORDER BY workout_count DESC
$$;

GRANT EXECUTE ON FUNCTION get_monthly_ranking() TO authenticated;
