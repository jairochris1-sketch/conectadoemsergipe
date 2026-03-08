import { useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, Check, X, ImagePlus } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSocial, Comment } from "@/context/SocialContext";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import ReportButton from "@/components/ReportButton";
import VerificationBadge from "@/components/VerificationBadge";
import InlineBannerAd from "@/components/InlineBannerAd";
import { useBatchVerificationBadges } from "@/hooks/useVerificationBadges";
import { supabase } from "@/integrations/supabase/client";
import { validateAndCompressImage } from "@/lib/imageCompression";
import { useForbiddenWords } from "@/hooks/useForbiddenWords";
import { toast } from "sonner";

interface PostFeedProps {
  userName?: string;
}

const abbreviateCity = (city: string) => {
  if (!city) return "";
  const parts = city.split(" ");
  if (parts.length <= 2) return city;
  // e.g. "Nossa Senhora da Glória" -> "N. S. da Glória"
  const lastWord = parts[parts.length - 1];
  const abbreviated = parts.slice(0, -1).map((w, i) => {
    if (["de", "da", "do", "das", "dos", "e"].includes(w.toLowerCase())) return w;
    return w[0].toUpperCase() + ".";
  }).join(" ");
  return `${abbreviated} ${lastWord}`;
};

const PostFeed = ({ userName }: PostFeedProps) => {
  const [newPost, setNewPost] = useState("");
  const [lightboxPost, setLightboxPost] = useState<string | null>(null);
  const [postImage, setPostImage] = useState<{ blob: Blob; preview: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const { language, t } = useLanguage();
  const { posts, createPost, deleteOwnPost, updatePost, getComments, addComment, refreshPosts } = useSocial();
  const { user } = useAuth();
  const { isAdmin, deletePost } = useAdmin();
  const [banModal, setBanModal] = useState<{ userId: string; userName: string } | null>(null);
  const [banDays, setBanDays] = useState("1");
  const [banReason, setBanReason] = useState("");
  const { containsForbiddenWord } = useForbiddenWords();

  // Collect all unique user IDs from posts and comments for badge fetching
  const allUserIds = useMemo(() => {
    const ids = new Set(posts.map(p => p.authorId));
    Object.values(comments).forEach(cs => cs.forEach(c => ids.add(c.authorId)));
    return Array.from(ids);
  }, [posts, comments]);
  const badges = useBatchVerificationBadges(allUserIds);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await validateAndCompressImage(file);
      setPostImage(result);
    } catch (err: any) {
      if (err.message === "FILE_TOO_LARGE") {
        toast.error(t("post.image_too_large"));
      } else {
        toast.error(t("post.image_error"));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePost = async () => {
    if ((!newPost.trim() && !postImage) || !user) return;
    if (newPost.trim() && containsForbiddenWord(newPost)) {
      toast.error("Palavras ou mensagem proibida segundo as regras do conectadoemsergipe.");
      return;
    }
    setUploading(true);
    let imageUrl: string | undefined;

    if (postImage) {
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const path = `${user.id}/${fileName}`;
      const { error } = await supabase.storage.from("post-images").upload(path, postImage.blob, { upsert: true, contentType: "image/jpeg" });
      if (error) {
        console.error("Upload error:", error);
        toast.error(t("post.image_error") + ": " + error.message);
        setUploading(false);
        return;
      }
      const { data } = supabase.storage.from("post-images").getPublicUrl(path);
      imageUrl = data.publicUrl;
      console.log("Image uploaded successfully:", imageUrl);
    }

    await createPost(newPost.trim(), imageUrl);
    setNewPost("");
    setPostImage(null);
    setUploading(false);
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
    if (containsForbiddenWord(text)) {
      toast.error("Palavras ou mensagem proibida segundo as regras do conectadoemsergipe.");
      return;
    }
    await addComment(postId, text);
    setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
    const data = await getComments(postId);
    setComments((prev) => ({ ...prev, [postId]: data }));
  };

  const localeMap: Record<string, string> = { pt: "pt-BR", es: "es-ES", en: "en-US" };

  const formatDate = (date: Date) => {
    const locale = localeMap[language] || "pt-BR";
    return date.toLocaleString(locale, {
      month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: language === "en",
    });
  };

  const handleDeleteOwn = async (postId: string) => {
    if (!confirm(t("post.delete_confirm"))) return;
    await deleteOwnPost(postId);
  };

  const startEdit = (postId: string, content: string) => {
    setEditingPostId(postId);
    setEditContent(content);
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditContent("");
  };

  const saveEdit = async () => {
    if (!editingPostId || !editContent.trim()) return;
    await updatePost(editingPostId, editContent.trim());
    setEditingPostId(null);
    setEditContent("");
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
          {postImage && (
            <div className="relative inline-block mt-1">
              <img src={postImage.preview} alt="Preview" className="max-h-[100px] border border-border" />
              <button
                onClick={() => setPostImage(null)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 text-[9px] flex items-center justify-center leading-none"
              >
                ×
              </button>
            </div>
          )}
          <div className="flex gap-2 mt-1 items-center">
            <button onClick={handlePost} disabled={uploading} className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90 disabled:opacity-50">
              {uploading ? t("post.uploading") : t("post")}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-muted text-foreground border border-border px-2 py-1 text-[11px] cursor-pointer hover:opacity-90 inline-flex items-center gap-1"
              title={t("post.add_photo")}
            >
              <ImagePlus className="w-3 h-3" /> {t("post.add_photo")}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <span className="text-[9px] text-muted-foreground">{t("post.max_5mb")}</span>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {posts.map((post, index) => (
          <div key={post.id}>
            {index > 0 && index % 3 === 0 && <InlineBannerAd />}
            <div className="border-b border-border pb-2">
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
                  <Link to={`/user/${post.authorId}`} className="font-bold">{post.authorName}</Link>
                  <VerificationBadge {...(badges.get(post.authorId) || {})} />
                  {post.authorCity && (
                    <span className="text-muted-foreground text-[10px]"> · {abbreviateCity(post.authorCity)}</span>
                  )}
                </p>
                {editingPostId === post.id ? (
                  <div className="mt-1">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full border border-border p-1 text-[11px] resize-none bg-card"
                      rows={2}
                    />
                    <div className="flex gap-1 mt-1">
                      <button onClick={saveEdit} className="bg-primary text-primary-foreground border-none px-2 py-[2px] text-[10px] cursor-pointer hover:opacity-90 flex items-center gap-1">
                        <Check className="w-3 h-3" /> {t("save")}
                      </button>
                      <button onClick={cancelEdit} className="bg-muted text-foreground border border-border px-2 py-[2px] text-[10px] cursor-pointer hover:opacity-90 flex items-center gap-1">
                        <X className="w-3 h-3" /> {t("cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {post.content && (
                      <p className="text-[11px] mt-[2px]">
                        {post.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                          /^https?:\/\//.test(part) ? (
                            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all hover:opacity-80">{part}</a>
                          ) : part
                        )}
                      </p>
                    )}
                    {post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        alt="Post"
                        className="mt-1 max-w-full max-h-[300px] object-contain border border-border rounded cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={async () => {
                          setLightboxPost(post.id);
                          if (!comments[post.id]) {
                            const data = await getComments(post.id);
                            setComments((prev) => ({ ...prev, [post.id]: data }));
                          }
                        }}
                      />
                    )}
                  </>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">{formatDate(post.timestamp)}</p>

                {/* Own post actions */}
                {user && post.authorId === user.id && editingPostId !== post.id && (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => startEdit(post.id, post.content)}
                      className="text-[9px] text-primary bg-transparent border-none cursor-pointer hover:underline inline-flex items-center gap-[2px]"
                    >
                      <Pencil className="w-3 h-3" /> {t("post.edit")}
                    </button>
                    <button
                      onClick={() => handleDeleteOwn(post.id)}
                      className="text-[9px] text-destructive bg-transparent border-none cursor-pointer hover:underline inline-flex items-center gap-[2px]"
                    >
                      <Trash2 className="w-3 h-3" /> {t("post.delete")}
                    </button>
                  </div>
                )}

                {/* Admin actions */}
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
                {user && post.authorId !== user.id && (
                  <ReportButton
                    contentType="post"
                    contentId={post.id}
                    reportedUserId={post.authorId}
                    className="text-[9px] mt-1"
                  />
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
                  <div key={c.id} className="border-l-2 border-border pl-2 py-1 flex gap-2">
                    <div className="shrink-0 w-[22px] h-[22px] bg-muted border border-border rounded-full overflow-hidden mt-[1px]">
                      {c.authorPhoto ? (
                        <img src={c.authorPhoto} alt={c.authorName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[7px] text-muted-foreground flex items-center justify-center h-full">👤</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px]">
                        <Link to={`/user/${c.authorId}`} className="font-bold">{c.authorName}</Link>
                        <VerificationBadge {...(badges.get(c.authorId) || {})} />
                        {" "}{c.content}
                      </p>
                      <p className="text-[9px] text-muted-foreground">{formatDate(c.timestamp)}</p>
                    </div>
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

      {/* Lightbox with comments */}
      {lightboxPost && (() => {
        const post = posts.find(p => p.id === lightboxPost);
        if (!post || !post.imageUrl) return null;
        return (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
            onClick={() => setLightboxPost(null)}
          >
            <button
              onClick={() => setLightboxPost(null)}
              className="absolute top-3 right-3 text-white/80 hover:text-white text-2xl bg-transparent border-none cursor-pointer z-10"
            >
              ✕
            </button>
            <div
              className="flex w-[95vw] max-w-[1100px] h-[90vh] max-h-[700px] bg-card rounded overflow-hidden shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left: Image */}
              <div className="flex-1 bg-black flex items-center justify-center min-w-0">
                <img
                  src={post.imageUrl}
                  alt="Ampliada"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              {/* Right: Post info + Comments */}
              <div className="w-[320px] shrink-0 flex flex-col border-l border-border bg-card">
                {/* Author header */}
                <div className="flex items-center gap-2 p-3 border-b border-border">
                  <div className="w-[32px] h-[32px] bg-muted border border-border rounded-full overflow-hidden shrink-0">
                    {post.authorPhoto ? (
                      <img src={post.authorPhoto} alt={post.authorName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[8px] text-muted-foreground flex items-center justify-center h-full">{t("photo")}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-0">
                      <Link to={`/user/${post.authorId}`} className="text-[12px] font-bold hover:underline" onClick={() => setLightboxPost(null)}>
                        {post.authorName}
                      </Link>
                      <VerificationBadge {...(badges.get(post.authorId) || {})} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{formatDate(post.timestamp)}</p>
                  </div>
                </div>
                {/* Post content */}
                {post.content && (
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-[11px]">
                      {post.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                        /^https?:\/\//.test(part) ? (
                          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all hover:opacity-80">{part}</a>
                        ) : part
                      )}
                    </p>
                  </div>
                )}
                {/* Comments list */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                  {(comments[post.id] || []).length === 0 && (
                    <p className="text-[10px] text-muted-foreground">{t("comments.show")}</p>
                  )}
                  {(comments[post.id] || []).map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <div className="shrink-0 w-[24px] h-[24px] bg-muted border border-border rounded-full overflow-hidden mt-[2px]">
                        {c.authorPhoto ? (
                          <img src={c.authorPhoto} alt={c.authorName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[7px] text-muted-foreground flex items-center justify-center h-full">👤</span>
                        )}
                      </div>
                      <div className="bg-accent rounded px-2 py-1 min-w-0">
                        <p className="text-[10px]">
                          <span className="font-bold">{c.authorName}</span>
                          <VerificationBadge {...(badges.get(c.authorId) || {})} />
                          {" "}{c.content}
                        </p>
                        <p className="text-[9px] text-muted-foreground">{formatDate(c.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Add comment */}
                {user && (
                  <div className="flex gap-1 p-2 border-t border-border">
                    <input
                      type="text"
                      value={commentTexts[post.id] || ""}
                      onChange={(e) => setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      className="flex-1 border border-border p-1 text-[10px] bg-card rounded"
                      placeholder={t("comments.placeholder")}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                          await handleAddComment(post.id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="bg-primary text-primary-foreground border-none px-2 py-1 text-[10px] cursor-pointer hover:opacity-90 rounded"
                    >
                      {t("comments.send")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default PostFeed;
