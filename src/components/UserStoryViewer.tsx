import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { X, ChevronLeft, ChevronRight, Eye, MessageCircle } from "lucide-react";
import type { UserWithStories } from "@/components/UserStoriesBar";

interface StoryView {
  viewer_user_id: string;
  viewed_at: string;
  viewer_name?: string;
  viewer_photo?: string;
}

interface Props {
  users: UserWithStories[];
  initialUserIndex: number;
  onClose: () => void;
}

const STORY_DURATION = 5000;

const UserStoryViewer = ({ users, initialUserIndex, onClose }: Props) => {
  const { user } = useAuth();
  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<StoryView[]>([]);
  const [viewCount, setViewCount] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const currentUser = users[userIndex];
  const currentStory = currentUser?.stories[storyIndex];
  const isMyStory = user && currentUser?.userId === user.id;

  const goNext = useCallback(() => {
    if (storyIndex < currentUser.stories.length - 1) {
      setStoryIndex((i) => i + 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else if (userIndex < users.length - 1) {
      setUserIndex((i) => i + 1);
      setStoryIndex(0);
      setProgress(0);
      elapsedRef.current = 0;
    } else {
      onClose();
    }
  }, [storyIndex, userIndex, currentUser, users.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else if (userIndex > 0) {
      const prevUser = users[userIndex - 1];
      setUserIndex((i) => i - 1);
      setStoryIndex(prevUser.stories.length - 1);
      setProgress(0);
      elapsedRef.current = 0;
    }
  }, [storyIndex, userIndex, users]);

  // Record view
  useEffect(() => {
    if (!currentStory || !user || isMyStory) return;
    supabase
      .from("story_views")
      .upsert(
        { story_id: currentStory.id, viewer_user_id: user.id },
        { onConflict: "story_id,viewer_user_id" }
      )
      .then();
  }, [currentStory?.id, user, isMyStory]);

  // Load view count
  useEffect(() => {
    if (!currentStory) return;
    supabase
      .from("story_views")
      .select("id", { count: "exact", head: true })
      .eq("story_id", currentStory.id)
      .then(({ count }) => setViewCount(count || 0));
  }, [currentStory?.id]);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused || showViewers || showReply) return;
    startTimeRef.current = Date.now();
    const tick = () => {
      const totalElapsed = elapsedRef.current + (Date.now() - startTimeRef.current);
      const pct = Math.min((totalElapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        goNext();
      } else {
        timerRef.current = requestAnimationFrame(tick);
      }
    };
    timerRef.current = requestAnimationFrame(tick);
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      elapsedRef.current += Date.now() - startTimeRef.current;
    };
  }, [storyIndex, userIndex, isPaused, showViewers, showReply, goNext]);

  useEffect(() => {
    elapsedRef.current = 0;
  }, [storyIndex, userIndex]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 100) {
      onClose();
    } else {
      setIsPaused(false);
    }
  };

  const handleAreaClick = (e: React.MouseEvent) => {
    if (showViewers || showReply) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) goPrev();
    else if (x > (rect.width * 2) / 3) goNext();
  };

  const loadViewers = async () => {
    if (!currentStory) return;
    const { data } = await supabase
      .from("story_views")
      .select("viewer_user_id, viewed_at")
      .eq("story_id", currentStory.id)
      .order("viewed_at", { ascending: false });

    if (!data) return;

    const viewerIds = data.map((v: any) => v.viewer_user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, photo_url")
      .in("user_id", viewerIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    setViewers(
      data.map((v: any) => {
        const p = profileMap.get(v.viewer_user_id);
        return {
          ...v,
          viewer_name: p?.name || "Usuário",
          viewer_photo: p?.photo_url || "/placeholder.svg",
        };
      })
    );
    setShowViewers(true);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !user || !currentUser) return;
    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: currentUser.userId,
      content: `📷 Respondeu ao seu story: "${replyText.trim()}"`,
    });
    setReplyText("");
    setShowReply(false);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h`;
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      <button onClick={goPrev} className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-50 text-white/70 hover:text-white hidden sm:block">
        <ChevronLeft className="w-10 h-10" />
      </button>
      <button onClick={goNext} className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-50 text-white/70 hover:text-white hidden sm:block">
        <ChevronRight className="w-10 h-10" />
      </button>

      <div
        className="relative w-full max-w-[420px] h-full sm:h-[90vh] sm:max-h-[800px] sm:rounded-2xl overflow-hidden bg-black"
        onClick={handleAreaClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={() => !showViewers && !showReply && setIsPaused(true)}
        onMouseUp={() => !showViewers && !showReply && setIsPaused(false)}
      >
        <img
          src={currentStory.image_url}
          alt="Story"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 pt-3 z-20">
          {currentUser.stories.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < storyIndex ? "100%" : i === storyIndex ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-3 z-20">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/50">
              <img
                src={currentUser.userPhoto || "/placeholder.svg"}
                alt={currentUser.userName}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight drop-shadow">
                {currentUser.userName}
              </p>
              <p className="text-white/70 text-[10px] drop-shadow">
                {timeAgo(currentStory.created_at)}
              </p>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-white/80 hover:text-white p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-32 left-0 right-0 px-4 z-20 pointer-events-none">
            <p className="text-white text-base font-medium drop-shadow-lg text-center bg-black/30 backdrop-blur-sm rounded-lg p-3">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Bottom actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 z-20">
          <div className="flex items-center gap-2">
            {/* View count / viewers button */}
            {isMyStory ? (
              <button
                onClick={(e) => { e.stopPropagation(); loadViewers(); }}
                className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm hover:bg-white/30 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>{viewCount}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-white/70 text-xs">
                <Eye className="w-3.5 h-3.5" />
                <span>{viewCount}</span>
              </div>
            )}

            <div className="flex-1" />

            {/* Reply button */}
            {user && !isMyStory && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowReply(true); }}
                className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm hover:bg-white/30 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Responder
              </button>
            )}
          </div>
        </div>

        {/* Viewers panel */}
        {showViewers && (
          <div
            className="absolute inset-0 z-30 bg-black/80 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Visualizações ({viewers.length})</h3>
              <button onClick={() => setShowViewers(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {viewers.length === 0 ? (
                <p className="text-white/50 text-sm text-center py-8">Nenhuma visualização ainda</p>
              ) : (
                viewers.map((v, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                      <img src={v.viewer_photo || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{v.viewer_name}</p>
                      <p className="text-white/50 text-xs">{timeAgo(v.viewed_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Reply input */}
        {showReply && (
          <div
            className="absolute bottom-0 left-0 right-0 z-30 bg-black/90 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
                placeholder="Responder ao story..."
                className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-full px-4 py-2.5 text-sm border border-white/20 focus:outline-none focus:border-white/40"
                autoFocus
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim()}
                className="text-primary font-semibold text-sm px-3 py-2 disabled:opacity-50"
              >
                Enviar
              </button>
              <button onClick={() => setShowReply(false)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserStoryViewer;
