
-- Track item views by users
CREATE TABLE public.marketplace_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own views"
  ON public.marketplace_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own views"
  ON public.marketplace_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add a view_count column to marketplace_items for popularity
ALTER TABLE public.marketplace_items ADD COLUMN view_count integer NOT NULL DEFAULT 0;

-- Index for fast lookups
CREATE INDEX idx_marketplace_views_user ON public.marketplace_views(user_id);
CREATE INDEX idx_marketplace_views_item ON public.marketplace_views(item_id);
CREATE INDEX idx_marketplace_items_category ON public.marketplace_items(category);
CREATE INDEX idx_marketplace_items_city ON public.marketplace_items(city);
CREATE INDEX idx_marketplace_items_view_count ON public.marketplace_items(view_count DESC);
