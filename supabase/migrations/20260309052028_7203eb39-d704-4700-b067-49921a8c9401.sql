
-- Store followers table
CREATE TABLE public.store_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(store_id, user_id)
);

ALTER TABLE public.store_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view store followers" ON public.store_followers FOR SELECT USING (true);
CREATE POLICY "Users can follow stores" ON public.store_followers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unfollow stores" ON public.store_followers FOR DELETE USING (auth.uid() = user_id);
