CREATE POLICY "Trainer gerencia qualquer post" ON public.feed_posts
  FOR ALL
  TO authenticated
  USING (public.is_trainer())
  WITH CHECK (public.is_trainer());
