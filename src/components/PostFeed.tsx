import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useSocial } from "@/context/SocialContext";
import { useAuth } from "@/context/AuthContext";

interface PostFeedProps {
  userName?: string;
}

const PostFeed = ({ userName }: PostFeedProps) => {
  const [newPost, setNewPost] = useState("");
  const { t } = useLanguage();
  const { posts, createPost } = useSocial();
  const { user } = useAuth();

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    await createPost(newPost.trim());
    setNewPost("");
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
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-[11px] text-muted-foreground">{t("friends.none")}</p>
        )}
      </div>
    </div>
  );
};

export default PostFeed;
