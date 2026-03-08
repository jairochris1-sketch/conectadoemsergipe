
CREATE TABLE public.moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id uuid NOT NULL,
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  target_owner_id uuid,
  details text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view moderation logs"
ON public.moderation_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Moderators can insert logs
CREATE POLICY "Moderators can insert moderation logs"
ON public.moderation_logs FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = moderator_id AND (
    public.has_role(auth.uid(), 'moderator'::app_role) OR
    public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Moderators can view their own logs
CREATE POLICY "Moderators can view own logs"
ON public.moderation_logs FOR SELECT
TO authenticated
USING (auth.uid() = moderator_id);
