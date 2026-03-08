
CREATE TABLE public.marketplace_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  price text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'Outros',
  city text DEFAULT '',
  image_url text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view marketplace items"
  ON public.marketplace_items FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own items"
  ON public.marketplace_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
  ON public.marketplace_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
  ON public.marketplace_items FOR DELETE
  USING (auth.uid() = user_id);
