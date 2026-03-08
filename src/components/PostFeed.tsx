import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useSocial, Comment } from "@/context/SocialContext";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";

interface PostFeedProps {
  userName?: string;
}

const PostFeed = ({ userName }: PostFeedProps) => {
  const [newPost, setNewPost] = useState("");
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const { t } = useLanguage();
  const { posts, createPost, getComments, addComment, refreshPosts } = useSocial();
  const { user } = useAuth();
  const { isAdmin, deletePost } = useAdmin();
  const [banModal, setBanModal] = useState<{ userId: string; userName: string } | null>(null);
  const [banDays, setBanDays] = useState("1");
  const [banReason, setBanReason] = useState("");

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    await createPost(newPost.trim());
    setNewPost("");
  };

  const toggleComments = async (postId: string) => {
    const isOpen = !openComments[postId];
    setOpenComments((prev) => ({ ...prev, [postId]: isOpen }));
    if (isOpen && !comments[postId]) {
      const data = await getComments(postId);
      setComments((prev) => ({ ...prev, [postId]: data }));
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentTexts[postId]?.trim();
    if (!text || !user) return;
    await addComment(postId, text);
    setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
    const data = await getComments(postId);
    setComments((prev) => ({ ...prev, [postId]: data }));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
    });
  };

  return (
    <div className="bg-card border border-border p-2 w-full">
      <div className="border-b border-border pb-1 mb-2">
        <h3 className="text-[13px] font-bold text-primary">{t("the_wall")}</h3>
      </div>
      {userName && (
        <div className="mb-3 border border-border p-2 bg-accent">
          <p className="text-[11px] font-bold mb-1">{t("write_something")}</p>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="w-full border border-border p-1 text-[11px] resize-none bg-card"
            rows={3}
            placeholder={t("whats_on_mind")}
          />
          <button onClick={handlePost} className="mt-1 bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90">
            {t("post")}
          </button>
        </div>
      )}
      <div className="space-y-2">
        {posts.map((post) => (
          <div key={post.id} className="border-b border-border pb-2">
            <div className="flex items-start gap-2">
              <div className="w-[32px] h-[32px] bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                {post.authorPhoto ? (
                  <img src={post.authorPhoto} alt={post.authorName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[8px] text-muted-foreground">{t("photo")}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px]">
                  <a href="#" className="font-bold">{post.authorName}</a>{" "}{post.content}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{formatDate(post.timestamp)}</p>
                {isAdmin && post.authorId !== user?.id && (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={async () => { await deletePost(post.id); await refreshPosts(); }}
                      className="text-[9px] text-destructive bg-transparent border-none cursor-pointer hover:underline"
                    >
                      {t("admin.delete_post")}
                    </button>
                    <button
                      onClick={() => setBanModal({ userId: post.authorId, userName: post.authorName })}
                      className="text-[9px] text-destructive bg-transparent border-none cursor-pointer hover:underline"
                    >
                      {t("admin.ban_user")}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Comments toggle */}
            <button
              onClick={() => toggleComments(post.id)}
              className="text-[10px] text-primary mt-1 bg-transparent border-none cursor-pointer hover:underline"
            >
              {openComments[post.id] ? t("comments.hide") : t("comments.show")}
              {comments[post.id] && ` (${comments[post.id].length})`}
            </button>

            {/* Comments section */}
            {openComments[post.id] && (
              <div className="ml-8 mt-1 space-y-1">
                {(comments[post.id] || []).map((c) => (
                  <div key={c.id} className="border-l-2 border-border pl-2 py-1">
                    <p className="text-[10px]">
                      <span className="font-bold">{c.authorName}</span>{" "}{c.content}
                    </p>
                    <p className="text-[9px] text-muted-foreground">{formatDate(c.timestamp)}</p>
                  </div>
                ))}
                {user && (
                  <div className="flex gap-1 mt-1">
                    <input
                      type="text"
                      value={commentTexts[post.id] || ""}
                      onChange={(e) => setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      className="flex-1 border border-border p-1 text-[10px] bg-card"
                      placeholder={t("comments.placeholder")}
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="bg-primary text-primary-foreground border-none px-2 py-1 text-[10px] cursor-pointer hover:opacity-90"
                    >
                      {t("comments.send")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-[11px] text-muted-foreground">{t("friends.none")}</p>
        )}
      </div>

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border p-4 max-w-[300px] w-full">
            <h4 className="text-[13px] font-bold text-primary mb-2">{t("admin.ban_user")}: {banModal.userName}</h4>
            <div className="space-y-2 text-[11px]">
              <div>
                <label className="block font-bold mb-1">{t("admin.ban_days")}:</label>
                <select value={banDays} onChange={(e) => setBanDays(e.target.value)} className="w-full border border-border p-1 text-[11px] bg-card">
                  <option value="1">1 {t("admin.day")}</option>
                  <option value="3">3 {t("admin.days")}</option>
                  <option value="7">7 {t("admin.days")}</option>
                  <option value="30">30 {t("admin.days")}</option>
                  <option value="365">1 {t("admin.year")}</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">{t("admin.ban_reason")}:</label>
                <textarea value={banReason} onChange={(e) => setBanReason(e.target.value)} className="w-full border border-border p-1 text-[11px] resize-none bg-card" rows={2} />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const { banUser } = await import("@/hooks/useAdmin").then(() => ({ banUser: null }));
                    // Use inline ban
                    const { supabase } = await import("@/integrations/supabase/client");
                    const bannedUntil = new Date();
                    bannedUntil.setDate(bannedUntil.getDate() + parseInt(banDays));
                    await supabase.from("bans").insert({
                      user_id: banModal.userId,
                      banned_by: user!.id,
                      reason: banReason,
                      banned_until: bannedUntil.toISOString(),
                    });
                    setBanModal(null);
                    setBanReason("");
                    setBanDays("1");
                  }}
                  className="bg-destructive text-destructive-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90"
                >
                  {t("admin.confirm_ban")}
                </button>
                <button onClick={() => setBanModal(null)} className="bg-muted text-foreground border border-border px-3 py-1 text-[11px] cursor-pointer hover:opacity-90">
                  {t("cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostFeed;
