ALTER TABLE public.seller_reviews ADD COLUMN seller_reply text DEFAULT NULL;
ALTER TABLE public.seller_reviews ADD COLUMN seller_reply_at timestamp with time zone DEFAULT NULL;