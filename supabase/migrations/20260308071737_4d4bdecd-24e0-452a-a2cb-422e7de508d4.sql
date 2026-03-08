
ALTER TABLE public.marketplace_items 
ADD COLUMN whatsapp text NOT NULL DEFAULT '',
ADD COLUMN images jsonb DEFAULT '[]'::jsonb;
