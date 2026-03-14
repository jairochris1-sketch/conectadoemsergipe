
-- User stories table
CREATE TABLE public.user_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  caption text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active user stories" ON public.user_stories
  FOR SELECT USING (expires_at > now());

CREATE POLICY "Users can create own stories" ON public.user_stories
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories" ON public.user_stories
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Story views table
CREATE TABLE public.story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.user_stories(id) ON DELETE CASCADE,
  viewer_user_id uuid NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_user_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Story owners can view who viewed" ON public.story_views
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_stories WHERE id = story_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own views" ON public.story_views
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_user_id);

CREATE POLICY "Users can see own views" ON public.story_views
  FOR SELECT TO authenticated USING (auth.uid() = viewer_user_id);

-- Storage bucket for user story images
INSERT INTO storage.buckets (id, name, public) VALUES ('user-stories', 'user-stories', true);

CREATE POLICY "Anyone can view story images" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-stories');

CREATE POLICY "Authenticated users can upload story images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'user-stories');

CREATE POLICY "Users can delete own story images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'user-stories');
