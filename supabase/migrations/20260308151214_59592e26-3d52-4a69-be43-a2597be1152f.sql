
-- RLS policy: Moderators can delete any post
CREATE POLICY "Moderators can delete any post"
ON public.posts FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'moderator'::app_role));

-- RLS policy: Moderators can delete any marketplace item
CREATE POLICY "Moderators can delete any marketplace item"
ON public.marketplace_items FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'moderator'::app_role));

-- RLS policy: Moderators can view all reports
CREATE POLICY "Moderators can view all reports"
ON public.reports FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'moderator'::app_role));

-- RLS policy: Moderators can update reports (resolve/dismiss)
CREATE POLICY "Moderators can update reports"
ON public.reports FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'moderator'::app_role));

-- RLS policy: Anyone can view moderator roles for badges
CREATE POLICY "Anyone can view moderator roles for badges"
ON public.user_roles FOR SELECT
TO authenticated
USING (role = 'moderator'::app_role);

-- Admins need to manage user_roles (insert/delete moderators)
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
