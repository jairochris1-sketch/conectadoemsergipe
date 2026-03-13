
CREATE TABLE public.store_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.store_products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.store_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active stories" ON public.store_stories
  FOR SELECT TO public
  USING (expires_at > now());

CREATE POLICY "Store owners can create stories" ON public.store_stories
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid()
  ));

CREATE POLICY "Store owners can delete stories" ON public.store_stories
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid()
  ));

CREATE INDEX idx_store_stories_expires ON public.store_stories(expires_at);
CREATE INDEX idx_store_stories_store ON public.store_stories(store_id);
