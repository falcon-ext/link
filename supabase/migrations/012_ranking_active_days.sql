-- Ranking por dias únicos de treino (alinhado com sistema de XP)

CREATE OR REPLACE FUNCTION get_ranking(period text DEFAULT 'month')
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
    p.name       AS student_name,
    p.avatar_url,
    COUNT(DISTINCT DATE(wl.finished_at))::int AS workout_count,
    RANK() OVER (ORDER BY COUNT(DISTINCT DATE(wl.finished_at)) DESC)::int AS rank
  FROM public.workout_logs wl
  JOIN public.profiles p ON p.id = wl.student_id
  WHERE
    wl.finished_at IS NOT NULL
    AND p.role      = 'student'
    AND p.is_active = true
    AND CASE
      WHEN period = 'month' THEN
        date_trunc('month', wl.finished_at) = date_trunc('month', now())

      WHEN period = 'semester' THEN
        EXTRACT(year  FROM wl.finished_at) = EXTRACT(year FROM now())
        AND CEIL(EXTRACT(month FROM wl.finished_at) / 6.0)
          = CEIL(EXTRACT(month FROM now()) / 6.0)

      WHEN period = 'year' THEN
        EXTRACT(year FROM wl.finished_at) = EXTRACT(year FROM now())

      ELSE
        date_trunc('month', wl.finished_at) = date_trunc('month', now())
    END
  GROUP BY wl.student_id, p.name, p.avatar_url
  ORDER BY workout_count DESC
$$;

GRANT EXECUTE ON FUNCTION get_ranking(text) TO authenticated;
