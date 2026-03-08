
CREATE TABLE public.site_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid DEFAULT NULL
);

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

-- Anyone can read pages
CREATE POLICY "Anyone can view site pages" ON public.site_pages FOR SELECT USING (true);

-- Only admins can update
CREATE POLICY "Admins can update site pages" ON public.site_pages FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert
CREATE POLICY "Admins can insert site pages" ON public.site_pages FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed the 4 pages
INSERT INTO public.site_pages (slug, title, content) VALUES
  ('about', 'Sobre', ''),
  ('contact', 'Contato', ''),
  ('privacy', 'Privacidade', ''),
  ('terms', 'Termos de Uso', '');
