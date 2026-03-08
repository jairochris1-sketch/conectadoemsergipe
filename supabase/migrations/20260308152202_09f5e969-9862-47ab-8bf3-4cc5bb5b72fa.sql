
CREATE TABLE public.user_presence (
  user_id uuid PRIMARY KEY,
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  is_online boolean NOT NULL DEFAULT true
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Everyone can see who is online
CREATE POLICY "Anyone can view presence"
ON public.user_presence FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own presence
CREATE POLICY "Users can insert own presence"
ON public.user_presence FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own presence
CREATE POLICY "Users can update own presence"
ON public.user_presence FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
