-- Remove a FK constraint de feed_posts.workout_log_id
-- Posts do feed são conteúdo social independente — não devem ser afetados
-- pela exclusão de treinos, fichas ou programas.
-- O campo workout_log_id continua existindo como referência simples (uuid sem constraint).
ALTER TABLE public.feed_posts DROP CONSTRAINT IF EXISTS feed_posts_workout_log_id_fkey;
