
-- Add payment_methods column to stores table
ALTER TABLE public.stores ADD COLUMN payment_methods jsonb DEFAULT '[]'::jsonb;

-- Create cultural events table
CREATE TABLE public.cultural_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date timestamp with time zone NOT NULL,
  event_end_date timestamp with time zone,
  location text NOT NULL,
  city text,
  image_url text,
  category text DEFAULT 'Geral',
  created_by uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.cultural_events ENABLE ROW LEVEL SECURITY;

-- Anyone can view active events
CREATE POLICY "Anyone can view active events" ON public.cultural_events
  FOR SELECT USING (is_active = true);

-- Authenticated users can create events
CREATE POLICY "Authenticated users can create events" ON public.cultural_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Owners can update their events
CREATE POLICY "Owners can update their events" ON public.cultural_events
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Owners can delete their events
CREATE POLICY "Owners can delete their events" ON public.cultural_events
  FOR DELETE TO authenticated USING (auth.uid() = created_by);
