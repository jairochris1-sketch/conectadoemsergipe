
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS audio_url text DEFAULT NULL;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-audio', 'chat-audio', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload chat audio" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view chat audio" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-audio');

CREATE POLICY "Users can delete own chat audio" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chat-audio' AND (storage.foldername(name))[1] = auth.uid()::text);
