
-- Seller reviews table
CREATE TABLE public.seller_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  product_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(seller_id, reviewer_id, product_id)
);

ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seller reviews" ON public.seller_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.seller_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update own reviews" ON public.seller_reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Users can delete own reviews" ON public.seller_reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- Price alerts table
CREATE TABLE public.price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL,
  item_type text NOT NULL DEFAULT 'marketplace_item',
  original_price numeric NOT NULL,
  notified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts" ON public.price_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own alerts" ON public.price_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON public.price_alerts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.price_alerts FOR UPDATE USING (auth.uid() = user_id);

-- Store plans table
CREATE TABLE public.store_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  plan_type text NOT NULL DEFAULT 'free',
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);

ALTER TABLE public.store_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view store plans" ON public.store_plans FOR SELECT USING (true);
CREATE POLICY "Users can manage own store plan" ON public.store_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
);

-- Add delivery options to store_products
ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS delivery_options jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS delivery_cost text DEFAULT '';

-- Add view tracking columns to store_products
ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS contact_count integer DEFAULT 0;
