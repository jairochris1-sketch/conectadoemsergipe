
-- Function to get friend suggestions for a user
-- Scores based on: mutual friends (3pts each), same city (2pts), new users (1pt), popular users (followers count)
CREATE OR REPLACE FUNCTION public.get_friend_suggestions(_user_id uuid, _limit integer DEFAULT 10)
RETURNS TABLE(
  user_id uuid,
  name text,
  photo_url text,
  city text,
  mutual_count bigint,
  score bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH my_friends AS (
    -- Get IDs of all accepted friends
    SELECT CASE WHEN requester_id = _user_id THEN addressee_id ELSE requester_id END AS friend_id
    FROM friendships
    WHERE (requester_id = _user_id OR addressee_id = _user_id)
      AND status = 'accepted'
  ),
  blocked_users AS (
    -- Users I've banned or who banned me (using bans table as block list)
    SELECT user_id AS blocked_id FROM bans WHERE banned_by = _user_id
    UNION
    SELECT banned_by AS blocked_id FROM bans WHERE user_id = _user_id
  ),
  pending_users AS (
    -- Users with pending friend requests (either direction)
    SELECT CASE WHEN requester_id = _user_id THEN addressee_id ELSE requester_id END AS pending_id
    FROM friendships
    WHERE (requester_id = _user_id OR addressee_id = _user_id)
      AND status = 'pending'
  ),
  excluded AS (
    SELECT friend_id AS eid FROM my_friends
    UNION SELECT blocked_id FROM blocked_users
    UNION SELECT pending_id FROM pending_users
    UNION SELECT _user_id AS eid
  ),
  -- Friends of my friends (mutual friends calculation)
  friends_of_friends AS (
    SELECT 
      CASE WHEN f.requester_id = mf.friend_id THEN f.addressee_id ELSE f.requester_id END AS candidate_id,
      COUNT(*) AS mutual_count
    FROM friendships f
    JOIN my_friends mf ON (f.requester_id = mf.friend_id OR f.addressee_id = mf.friend_id)
    WHERE f.status = 'accepted'
      AND CASE WHEN f.requester_id = mf.friend_id THEN f.addressee_id ELSE f.requester_id END != _user_id
    GROUP BY candidate_id
  ),
  my_city AS (
    SELECT p.city FROM profiles p WHERE p.user_id = _user_id LIMIT 1
  ),
  candidates AS (
    SELECT
      p.user_id,
      p.name,
      p.photo_url,
      p.city,
      COALESCE(fof.mutual_count, 0) AS mutual_count,
      -- Score: mutual friends * 3 + same city * 2 + new user (last 7 days) * 1 + follower count (capped at 5)
      (COALESCE(fof.mutual_count, 0) * 3
       + CASE WHEN p.city IS NOT NULL AND p.city != '' AND p.city = (SELECT city FROM my_city) THEN 2 ELSE 0 END
       + CASE WHEN p.created_at > now() - interval '7 days' THEN 1 ELSE 0 END
       + LEAST(COALESCE((SELECT COUNT(*) FROM followers fl WHERE fl.following_id = p.user_id), 0), 5)
      ) AS score
    FROM profiles p
    LEFT JOIN friends_of_friends fof ON fof.candidate_id = p.user_id
    WHERE p.user_id NOT IN (SELECT eid FROM excluded)
  )
  SELECT c.user_id, c.name, c.photo_url, c.city, c.mutual_count, c.score
  FROM candidates c
  WHERE c.score > 0
  ORDER BY c.score DESC, c.mutual_count DESC, random()
  LIMIT _limit;
$$;
