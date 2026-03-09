
-- Create service_categories table
CREATE TABLE public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view service categories" ON public.service_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage service categories" ON public.service_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create service_subcategories table
CREATE TABLE public.service_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);

ALTER TABLE public.service_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view service subcategories" ON public.service_subcategories FOR SELECT USING (true);
CREATE POLICY "Admins can manage service subcategories" ON public.service_subcategories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create service_listings table (users post their services)
CREATE TABLE public.service_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  subcategory_id uuid REFERENCES public.service_subcategories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  city text DEFAULT '',
  image_url text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active listings" ON public.service_listings FOR SELECT USING (true);
CREATE POLICY "Users can create own listings" ON public.service_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own listings" ON public.service_listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own listings" ON public.service_listings FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any listing" ON public.service_listings FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert predefined categories
INSERT INTO public.service_categories (name, sort_order) VALUES
  ('Eletricista', 1),
  ('Técnico TV', 2),
  ('Técnico Celular', 3),
  ('Moto Taxi', 4),
  ('Taxista', 5),
  ('Manicure', 6),
  ('Carro de Mudança', 7),
  ('Provedor de Internet em Glória', 8),
  ('Serviços Digitais', 9),
  ('Vendedores Honda Glória', 10),
  ('Alugo Pula Pula', 11),
  ('Alugo Cadeiras e Mesas', 12),
  ('Casas pra Alugar em Glória', 13),
  ('Casas pra Alugar em Itabaiana', 14),
  ('Casas pra Alugar em Aracaju', 15),
  ('Casas pra Alugar em Tobias Barreto', 16),
  ('Casas pra Alugar em Dores', 17),
  ('Baralho Tarot', 18);
