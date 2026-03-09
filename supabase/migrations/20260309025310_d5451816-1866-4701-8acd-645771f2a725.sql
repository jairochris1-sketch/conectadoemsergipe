
CREATE TABLE public.marketplace_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON public.marketplace_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.marketplace_categories
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.marketplace_categories (name, sort_order) VALUES
  ('Móveis', 1), ('Imóveis', 2), ('Celulares', 3), ('Carros', 4),
  ('Motos', 5), ('Bicicletas', 6), ('Som', 7), ('Roupas', 8),
  ('Bolos/Doces', 9), ('Mudas Frutíferas', 10), ('Sofá/Mesa/Cadeiras', 11),
  ('Fogão', 12), ('Geladeira', 13), ('Guarda-Roupa', 14),
  ('Eletrônicos', 15), ('Livros', 16), ('Outros', 17);
