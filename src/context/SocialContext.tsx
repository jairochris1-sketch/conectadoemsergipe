import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  authorCity: string;
  content: string;
  imageUrl: string | null;
  timestamp: Date;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  timestamp: Date;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  fromPhoto: string;
  toId: string;
  status: "pending" | "accepted" | "rejected";
}

interface SocialContextType {
  posts: Post[];
  deleteOwnPost: (postId: string) => Promise<void>;
  updatePost: (postId: string, content: string) => Promise<void>;
  createPost: (content: string, imageUrl?: string) => Promise<void>;
  friendRequests: FriendRequest[];
  sendFriendRequest: (toId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  getFriends: () => { id: string; name: string; photo: string }[];
  getPendingRequests: () => FriendRequest[];
  isFriend: (otherId: string) => boolean;
  hasPendingRequest: (otherId: string) => boolean;
  refreshPosts: () => Promise<void>;
  refreshFriendships: () => Promise<void>;
  searchProfiles: (query: string) => Promise<{ id: string; name: string; school: string; photo: string }[]>;
  getComments: (postId: string) => Promise<Comment[]>;
  addComment: (postId: string, content: string) => Promise<void>;
}

const SocialContext = createContext<SocialContextType | null>(null);

export const SocialProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

  const refreshPosts = useCallback(async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, user_id, content, image_url, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!data) return;

    // Get unique user_ids
    const userIds = [...new Set(data.map((p) => p.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, photo_url, city")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    setPosts(
      data.map((p) => {
        const profile = profileMap.get(p.user_id);
        return {
          id: p.id,
          authorId: p.user_id,
          authorName: profile?.name || "User",
          authorPhoto: profile?.photo_url || "",
          authorCity: profile?.city || "",
          content: p.content,
          imageUrl: (p as any).image_url || null,
          timestamp: new Date(p.created_at),
        };
      })
    );
  }, []);

  const refreshFriendships = useCallback(async () => {
    if (!user) {
      setFriendRequests([]);
      return;
    }

    const { data } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (!data) return;

    const userIds = [...new Set(data.flatMap((f) => [f.requester_id, f.addressee_id]))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, photo_url")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    setFriendRequests(
      data.map((f) => {
        const requester = profileMap.get(f.requester_id);
        return {
          id: f.id,
          fromId: f.requester_id,
          fromName: requester?.name || "User",
          fromPhoto: requester?.photo_url || "",
          toId: f.addressee_id,
          status: f.status as "pending" | "accepted" | "rejected",
        };
      })
    );
  }, [user]);

  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

  useEffect(() => {
    refreshFriendships();
  }, [refreshFriendships]);

  const createPost = async (content: string) => {
    if (!user) return;
    await supabase.from("posts").insert({ user_id: user.id, content });
    await refreshPosts();
  };

  const deleteOwnPost = async (postId: string) => {
    if (!user) return;
    await supabase.from("comments").delete().eq("post_id", postId);
    await supabase.from("posts").delete().eq("id", postId).eq("user_id", user.id);
    await refreshPosts();
  };

  const updatePost = async (postId: string, content: string) => {
    if (!user) return;
    await supabase.from("posts").update({ content }).eq("id", postId).eq("user_id", user.id);
    await refreshPosts();
  };

  const sendFriendRequest = async (toId: string) => {
    if (!user) return;
    await supabase.from("friendships").insert({ requester_id: user.id, addressee_id: toId });
    await refreshFriendships();
  };

  const acceptFriendRequest = async (requestId: string) => {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", requestId);
    await refreshFriendships();
  };

  const rejectFriendRequest = async (requestId: string) => {
    await supabase.from("friendships").update({ status: "rejected" }).eq("id", requestId);
    await refreshFriendships();
  };

  const getFriends = () => {
    if (!user) return [];
    return friendRequests
      .filter((r) => r.status === "accepted" && (r.fromId === user.id || r.toId === user.id))
      .map((r) => {
        if (r.fromId === user.id) {
          // Need to find addressee profile - we have it in the requests data indirectly
          // For now use the data we have
          return { id: r.toId, name: "Friend", photo: "" };
        }
        return { id: r.fromId, name: r.fromName, photo: r.fromPhoto };
      });
  };

  const getPendingRequests = () => {
    if (!user) return [];
    return friendRequests.filter((r) => r.status === "pending" && r.toId === user.id);
  };

  const isFriend = (otherId: string) => {
    if (!user) return false;
    return friendRequests.some(
      (r) => r.status === "accepted" && ((r.fromId === user.id && r.toId === otherId) || (r.fromId === otherId && r.toId === user.id))
    );
  };

  const hasPendingRequest = (otherId: string) => {
    if (!user) return false;
    return friendRequests.some(
      (r) => r.status === "pending" && ((r.fromId === user.id && r.toId === otherId) || (r.fromId === otherId && r.toId === user.id))
    );
  };

  const searchProfiles = async (query: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, name, school, photo_url")
      .ilike("name", `%${query}%`)
      .limit(20);

    return (data || []).map((p) => ({
      id: p.user_id,
      name: p.name,
      school: p.school || "",
      photo: p.photo_url || "",
    }));
  };

  const getComments = async (postId: string): Promise<Comment[]> => {
    const { data } = await supabase
      .from("comments")
      .select("id, post_id, user_id, content, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!data || data.length === 0) return [];

    const userIds = [...new Set(data.map((c: any) => c.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, photo_url")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    return data.map((c: any) => {
      const profile = profileMap.get(c.user_id);
      return {
        id: c.id,
        postId: c.post_id,
        authorId: c.user_id,
        authorName: profile?.name || "User",
        authorPhoto: profile?.photo_url || "",
        content: c.content,
        timestamp: new Date(c.created_at),
      };
    });
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) return;
    await supabase.from("comments").insert({ post_id: postId, user_id: user.id, content });
  };

  return (
    <SocialContext.Provider
      value={{
        posts,
        createPost,
        deleteOwnPost,
        updatePost,
        friendRequests,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        getFriends,
        getPendingRequests,
        isFriend,
        hasPendingRequest,
        refreshPosts,
        refreshFriendships,
        searchProfiles,
        getComments,
        addComment,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
};

export const useSocial = () => {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error("useSocial must be used within SocialProvider");
  return ctx;
};
