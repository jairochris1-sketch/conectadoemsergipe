import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import UserStoryViewer from "@/components/UserStoryViewer";
import UserStoryUpload from "@/components/UserStoryUpload";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface UserStory {
  id: string;
  user_id: string;
  image_url: string;
  caption: string;
  created_at: string;
  expires_at: string;
}

export interface UserWithStories {
  userId: string;
  userName: string;
  userPhoto: string;
  stories: UserStory[];
}

const UserStoriesBar = () => {
  const { user } = useAuth();
  const [usersWithStories, setUsersWithStories] = useState<UserWithStories[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeUserIndex, setActiveUserIndex] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    const { data: stories } = await supabase
      .from("user_stories")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (!stories || stories.length === 0) {
      setUsersWithStories([]);
      return;
    }

    const userIds = [...new Set(stories.map((s: any) => s.user_id))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, photo_url")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    const grouped = new Map<string, UserWithStories>();

    for (const story of stories) {
      const s = story as any;
      const profile = profileMap.get(s.user_id);
      if (!profile) continue;

      if (!grouped.has(s.user_id)) {
        grouped.set(s.user_id, {
          userId: s.user_id,
          userName: (profile as any).name || "Usuário",
          userPhoto: (profile as any).photo_url || "/placeholder.svg",
          stories: [],
        });
      }

      grouped.get(s.user_id)!.stories.push(s);
    }

    // Put current user first if they have stories
    const result = Array.from(grouped.values());
    if (user) {
      const myIndex = result.findIndex((u) => u.userId === user.id);
      if (myIndex > 0) {
        const [mine] = result.splice(myIndex, 1);
        result.unshift(mine);
      }
    }

    setUsersWithStories(result);
  };

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  const hasMyStories = user && usersWithStories.some((u) => u.userId === user.id);

  if (!user && usersWithStories.length === 0) return null;

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-3 mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          📷 Stories
        </h3>
        <div className="relative group">
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-card/90 border border-border rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-card/90 border border-border rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide px-1 py-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* Add story button */}
            {user && (
              <button
                onClick={() => setUploadOpen(true)}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center bg-primary/5 hover:bg-primary/10 transition-colors">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground max-w-[72px] truncate text-center leading-tight">
                  Seu Story
                </span>
              </button>
            )}

            {usersWithStories.map((u, idx) => (
              <button
                key={u.userId}
                onClick={() => {
                  setActiveUserIndex(idx);
                  setViewerOpen(true);
                }}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full p-[3px] bg-gradient-to-tr from-primary via-accent to-destructive">
                  <div className="w-full h-full rounded-full border-2 border-card overflow-hidden">
                    <img
                      src={u.userPhoto || "/placeholder.svg"}
                      alt={u.userName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-foreground max-w-[72px] truncate text-center leading-tight">
                  {user && u.userId === user.id ? "Você" : u.userName}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewerOpen && (
        <UserStoryViewer
          users={usersWithStories}
          initialUserIndex={activeUserIndex}
          onClose={() => {
            setViewerOpen(false);
            loadStories();
          }}
        />
      )}

      {uploadOpen && (
        <UserStoryUpload
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onPublished={() => {
            setUploadOpen(false);
            loadStories();
          }}
        />
      )}
    </>
  );
};

export default UserStoriesBar;
