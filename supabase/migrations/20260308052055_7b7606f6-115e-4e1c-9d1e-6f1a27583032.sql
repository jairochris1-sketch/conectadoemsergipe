
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can see their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Create followers table
CREATE TABLE public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view followers" ON public.followers FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.followers FOR DELETE USING (auth.uid() = follower_id);

-- Create bans table
CREATE TABLE public.bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  banned_by uuid NOT NULL,
  reason text,
  banned_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bans" ON public.bans FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can see own bans" ON public.bans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can create bans" ON public.bans FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete bans" ON public.bans FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any post
CREATE POLICY "Admins can delete any post" ON public.posts FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
