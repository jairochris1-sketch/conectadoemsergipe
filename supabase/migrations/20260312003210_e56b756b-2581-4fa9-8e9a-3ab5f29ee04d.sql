
-- Notes table for poetry, stories, ideas, romance
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'geral',
  is_public boolean NOT NULL DEFAULT true,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Anyone can read public notes
CREATE POLICY "Anyone can view public notes"
  ON public.notes FOR SELECT
  USING (is_public = true);

-- Authenticated users can view their own notes
CREATE POLICY "Users can view their own notes"
  ON public.notes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Authenticated users can create notes
CREATE POLICY "Users can create notes"
  ON public.notes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own notes
CREATE POLICY "Users can update own notes"
  ON public.notes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notes
CREATE POLICY "Users can delete own notes"
  ON public.notes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Note likes table
CREATE TABLE public.note_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(note_id, user_id)
);

ALTER TABLE public.note_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view note likes"
  ON public.note_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like notes"
  ON public.note_likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike notes"
  ON public.note_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
