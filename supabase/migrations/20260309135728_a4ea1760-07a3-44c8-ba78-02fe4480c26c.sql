
CREATE POLICY "Moderators can update site pages"
ON public.site_pages
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));
