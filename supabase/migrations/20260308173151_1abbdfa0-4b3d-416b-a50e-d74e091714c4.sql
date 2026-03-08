
CREATE OR REPLACE FUNCTION public.increment_banner_impressions(_banner_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE banner_ads SET impression_count = impression_count + 1 WHERE id = _banner_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_banner_clicks(_banner_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE banner_ads SET click_count = click_count + 1 WHERE id = _banner_id;
$$;
