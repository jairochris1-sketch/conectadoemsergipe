
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload chat images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view chat images" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-images');

CREATE POLICY "Users can delete own chat images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text);
