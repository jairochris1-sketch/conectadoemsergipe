
CREATE TABLE public.banner_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  link_url text NOT NULL DEFAULT '',
  position text NOT NULL DEFAULT 'both',
  is_active boolean NOT NULL DEFAULT true,
  click_count integer NOT NULL DEFAULT 0,
  impression_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.banner_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners" ON public.banner_ads
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage banners" ON public.banner_ads
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
