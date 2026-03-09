import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { useAuth } from "@/context/AuthContext";

const SitePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, logout } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("site_pages")
        .select("*")
        .eq("slug", slug)
        .single();
      if (data) {
        setTitle((data as any).title);
        setContent((data as any).content);
      }
      setLoading(false);
    };
    if (slug) fetchPage();
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader
        isLoggedIn={!!user}
        userName={user?.name || ""}
        onLogout={logout}
      />
      <div className="max-w-[760px] mx-auto px-2 py-4">
        <div className="bg-card border border-border p-4">
          {loading ? (
            <p className="text-[11px] text-muted-foreground">Carregando...</p>
          ) : (
            <>
              <h1 className="text-[18px] font-bold text-primary mb-3" style={{ fontFamily: "Georgia, serif" }}>
                {title}
              </h1>
              {content ? (
                <div
                  className="text-[12px] text-foreground leading-relaxed prose prose-sm max-w-none [&_a]:text-primary [&_a]:underline [&_h2]:text-[16px] [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-[14px] [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <p className="text-[12px] text-muted-foreground">Conteúdo em breve.</p>
              )}
            </>
          )}
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default SitePage;
