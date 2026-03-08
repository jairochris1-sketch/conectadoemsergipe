
ALTER TABLE public.banner_ads 
ADD COLUMN starts_at timestamp with time zone NOT NULL DEFAULT now(),
ADD COLUMN ends_at timestamp with time zone;
