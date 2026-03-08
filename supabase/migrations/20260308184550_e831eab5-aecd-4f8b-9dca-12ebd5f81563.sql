
CREATE TABLE public.forbidden_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.forbidden_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view forbidden words" ON public.forbidden_words FOR SELECT USING (true);
CREATE POLICY "Admins can manage forbidden words" ON public.forbidden_words FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
