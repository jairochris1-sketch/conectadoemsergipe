
-- Add interaction_type to marketplace_views to differentiate impressions vs clicks
ALTER TABLE public.marketplace_views ADD COLUMN interaction_type text NOT NULL DEFAULT 'view';

-- Create category access tracking table
CREATE TABLE public.category_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  access_count integer NOT NULL DEFAULT 1,
  last_accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

ALTER TABLE public.category_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own category access" ON public.category_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own category access" ON public.category_access FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own category access" ON public.category_access FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_category_access_user ON public.category_access(user_id);
CREATE INDEX idx_marketplace_views_type ON public.marketplace_views(interaction_type);
