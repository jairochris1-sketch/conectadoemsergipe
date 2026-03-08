import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface SitePage {
  id: string;
  slug: string;
  title: string;
  content: string;
}

const AdminPageEditor = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [pages, setPages] = useState<SitePage[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    const { data } = await supabase
      .from("site_pages")
      .select("*")
      .order("slug");
    if (data) setPages(data as SitePage[]);
  };

  const startEdit = (page: SitePage) => {
    setEditing(page.slug);
    setEditContent(page.content);
  };

  const savePage = async (slug: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("site_pages")
      .update({ content: editContent, updated_at: new Date().toISOString() } as any)
      .eq("slug", slug);

    if (error) {
      toast({ title: t("admin.page_save_error"), variant: "destructive" });
    } else {
      toast({ title: t("admin.page_saved") });
      setEditing(null);
      fetchPages();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      {pages.map((page) => (
        <div key={page.id} className="border border-border p-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[13px] font-bold text-foreground">{page.title}</h3>
            {editing !== page.slug ? (
              <button
                onClick={() => startEdit(page)}
                className="bg-primary text-primary-foreground border-none px-3 py-1 text-[10px] cursor-pointer hover:opacity-90"
              >
                {t("admin.edit_page")}
              </button>
            ) : (
              <button
                onClick={() => savePage(page.slug)}
                disabled={saving}
                className="bg-primary text-primary-foreground border-none px-3 py-1 text-[10px] cursor-pointer hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "..." : t("admin.save_page")}
              </button>
            )}
          </div>
          {editing === page.slug ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[200px] border border-border bg-background text-foreground text-[11px] p-2 resize-y"
              placeholder={t("admin.page_content")}
            />
          ) : (
            <p className="text-[11px] text-muted-foreground whitespace-pre-wrap">
              {page.content || <span className="italic">({t("admin.page_content")} vazio)</span>}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminPageEditor;
