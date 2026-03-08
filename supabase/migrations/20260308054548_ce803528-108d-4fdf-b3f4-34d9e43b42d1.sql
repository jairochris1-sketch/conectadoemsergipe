
-- Fix ALL policies: explicitly set AS PERMISSIVE

-- Profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Posts
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone" ON public.posts AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
CREATE POLICY "Users can create their own posts" ON public.posts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" ON public.posts AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can delete any post" ON public.posts;
CREATE POLICY "Admins can delete any post" ON public.posts AS PERMISSIVE FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" ON public.comments AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Users can create their own comments" ON public.comments;
CREATE POLICY "Users can create their own comments" ON public.comments AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments" ON public.comments AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Friendships
DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
CREATE POLICY "Users can view their own friendships" ON public.friendships AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
CREATE POLICY "Users can send friend requests" ON public.friendships AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can respond to friend requests" ON public.friendships;
CREATE POLICY "Users can respond to friend requests" ON public.friendships AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = addressee_id);

-- Followers
DROP POLICY IF EXISTS "Anyone can view followers" ON public.followers;
CREATE POLICY "Anyone can view followers" ON public.followers AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Users can follow" ON public.followers;
CREATE POLICY "Users can follow" ON public.followers AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON public.followers;
CREATE POLICY "Users can unfollow" ON public.followers AS PERMISSIVE FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- Messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
CREATE POLICY "Users can view their own messages" ON public.messages AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Receiver can mark as read" ON public.messages;
CREATE POLICY "Receiver can mark as read" ON public.messages AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

-- Bans
DROP POLICY IF EXISTS "Admins can view bans" ON public.bans;
CREATE POLICY "Admins can view bans" ON public.bans AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can see own bans" ON public.bans;
CREATE POLICY "Users can see own bans" ON public.bans AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can create bans" ON public.bans;
CREATE POLICY "Admins can create bans" ON public.bans AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete bans" ON public.bans;
CREATE POLICY "Admins can delete bans" ON public.bans AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- User roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
