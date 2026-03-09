
-- Add category column to store_products
ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS category text DEFAULT 'Geral';
