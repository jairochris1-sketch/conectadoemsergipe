
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can mark as read"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Index for fast conversation lookups
CREATE INDEX idx_messages_conversation ON public.messages (sender_id, receiver_id, created_at DESC);
CREATE INDEX idx_messages_receiver ON public.messages (receiver_id, created_at DESC);
