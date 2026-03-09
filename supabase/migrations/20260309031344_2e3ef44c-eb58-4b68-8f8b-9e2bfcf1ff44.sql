
-- Add edited_at for tracking edits, expires_at for disappearing messages, and is_deleted soft-delete flag
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at timestamptz DEFAULT NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- Allow senders to update their own messages (edit content)
CREATE POLICY "Senders can edit own messages"
ON public.messages
FOR UPDATE TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- Allow senders to delete their own messages
CREATE POLICY "Senders can delete own messages"
ON public.messages
FOR DELETE TO authenticated
USING (auth.uid() = sender_id);

-- Allow receivers to delete messages in their conversation
CREATE POLICY "Receivers can delete messages"
ON public.messages
FOR DELETE TO authenticated
USING (auth.uid() = receiver_id);
