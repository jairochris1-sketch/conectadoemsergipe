
-- Create stores table
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  photo_url text DEFAULT '',
  city text DEFAULT '',
  category text DEFAULT 'Geral',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create store_products table
CREATE TABLE public.store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  price text NOT NULL,
  image_url text DEFAULT '',
  images jsonb DEFAULT '[]'::jsonb,
  city text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

-- Stores policies
CREATE POLICY "Anyone can view active stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Users can create own store" ON public.stores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own store" ON public.stores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own store" ON public.stores FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any store" ON public.stores FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Store products policies
CREATE POLICY "Anyone can view active store products" ON public.store_products FOR SELECT USING (true);
CREATE POLICY "Users can create own products" ON public.store_products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON public.store_products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON public.store_products FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any product" ON public.store_products FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
