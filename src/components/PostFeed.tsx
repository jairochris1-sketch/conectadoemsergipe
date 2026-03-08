import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

interface Post {
  id: number;
  author: string;
  content: string;
  timestamp: string;
}

const INITIAL_POSTS: Post[] = [
  { id: 1, author: "Mark Zuckerberg", content: "Welcome to thefacebook! This is a social directory for college students.", timestamp: "February 4, 2004 at 3:22pm" },
  { id: 2, author: "Eduardo Saverin", content: "Just joined thefacebook. This is going to be big!", timestamp: "February 5, 2004 at 11:15am" },
  { id: 3, author: "Dustin Moskovitz", content: "Working on some new features for the site. Stay tuned!", timestamp: "February 6, 2004 at 9:30am" },
  { id: 4, author: "Chris Hughes", content: "Harvard students - make sure to register with your harvard.edu email!", timestamp: "February 7, 2004 at 2:45pm" },
];

interface PostFeedProps {
  userName?: string;
}

const PostFeed = ({ userName }: PostFeedProps) => {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [newPost, setNewPost] = useState("");
  const { t } = useLanguage();

  const handlePost = () => {
    if (!newPost.trim() || !userName) return;
    const post: Post = {
      id: Date.now(),
      author: userName,
      content: newPost,
      timestamp: new Date().toLocaleString("en-US", {
        month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
      }),
    };
    setPosts([post, ...posts]);
    setNewPost("");
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
          <button
            onClick={handlePost}
            className="mt-1 bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90"
          >
            {t("post")}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {posts.map((post) => (
          <div key={post.id} className="border-b border-border pb-2">
            <p className="text-[11px]">
              <a href="#" className="font-bold">{post.author}</a>
              {" "}{post.content}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">{post.timestamp}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostFeed;
