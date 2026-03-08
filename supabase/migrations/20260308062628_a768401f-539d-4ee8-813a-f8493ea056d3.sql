
-- Credits system for sellers
CREATE TABLE public.ad_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  balance integer NOT NULL DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.ad_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.ad_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credits" ON public.ad_credits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credits" ON public.ad_credits FOR UPDATE USING (auth.uid() = user_id);

-- Sponsored campaigns
CREATE TABLE public.sponsored_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  budget integer NOT NULL DEFAULT 10,
  spent integer NOT NULL DEFAULT 0,
  target_city text DEFAULT '',
  target_category text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.sponsored_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns" ON public.sponsored_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own campaigns" ON public.sponsored_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON public.sponsored_campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view active campaigns for display" ON public.sponsored_campaigns FOR SELECT USING (status = 'active');

-- Index
CREATE INDEX idx_sponsored_campaigns_status ON public.sponsored_campaigns(status);
CREATE INDEX idx_sponsored_campaigns_item ON public.sponsored_campaigns(item_id);
