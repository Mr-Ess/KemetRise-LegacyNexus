
-- Public chat-uploads bucket for attachments and voice notes
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-uploads', 'chat-uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "chat_uploads_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-uploads');

CREATE POLICY "chat_uploads_user_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "chat_uploads_user_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "chat_uploads_user_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
