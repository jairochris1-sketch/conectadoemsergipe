import { useState, useEffect, useRef } from "react";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const insertTag = (openTag: string, closeTag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = editContent.substring(start, end);
    const newContent = editContent.substring(0, start) + openTag + selected + closeTag + editContent.substring(end);
    setEditContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTag.length, end + openTag.length);
    }, 0);
  };

  const insertLink = () => {
    const url = prompt("URL do link (ex: https://exemplo.com):");
    if (!url) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = editContent.substring(start, end) || "texto do link";
    const linkHtml = `<a href="${url}" target="_blank" rel="noopener">${selected}</a>`;
    const newContent = editContent.substring(0, start) + linkHtml + editContent.substring(end);
    setEditContent(newContent);
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
              <div className="flex gap-1">
                <button
                  onClick={() => setEditing(null)}
                  className="bg-muted text-foreground border border-border px-3 py-1 text-[10px] cursor-pointer hover:opacity-90"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => savePage(page.slug)}
                  disabled={saving}
                  className="bg-primary text-primary-foreground border-none px-3 py-1 text-[10px] cursor-pointer hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "..." : t("admin.save_page")}
                </button>
              </div>
            )}
          </div>
          {editing === page.slug ? (
            <div>
              <div className="flex gap-1 mb-1 flex-wrap">
                <button onClick={() => insertTag("<b>", "</b>")} className="px-2 py-[2px] text-[10px] border border-border bg-muted text-foreground cursor-pointer hover:bg-accent font-bold">N</button>
                <button onClick={() => insertTag("<i>", "</i>")} className="px-2 py-[2px] text-[10px] border border-border bg-muted text-foreground cursor-pointer hover:bg-accent italic">I</button>
                <button onClick={() => insertTag("<u>", "</u>")} className="px-2 py-[2px] text-[10px] border border-border bg-muted text-foreground cursor-pointer hover:bg-accent underline">S</button>
                <button onClick={() => insertTag("<h2>", "</h2>")} className="px-2 py-[2px] text-[10px] border border-border bg-muted text-foreground cursor-pointer hover:bg-accent">H2</button>
                <button onClick={() => insertTag("<h3>", "</h3>")} className="px-2 py-[2px] text-[10px] border border-border bg-muted text-foreground cursor-pointer hover:bg-accent">H3</button>
                <button onClick={insertLink} className="px-2 py-[2px] text-[10px] border border-border bg-muted text-foreground cursor-pointer hover:bg-accent">🔗 Link</button>
                <button onClick={() => insertTag("<br/>", "")} className="px-2 py-[2px] text-[10px] border border-border bg-muted text-foreground cursor-pointer hover:bg-accent">↵ Linha</button>
              </div>
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[200px] border border-border bg-background text-foreground text-[11px] p-2 resize-y font-mono"
                placeholder={t("admin.page_content")}
              />
              <p className="text-[9px] text-muted-foreground mt-1">
                Dica: Use HTML básico. Tags suportadas: &lt;b&gt;, &lt;i&gt;, &lt;u&gt;, &lt;a href="..."&gt;, &lt;h2&gt;, &lt;h3&gt;, &lt;br/&gt;
              </p>
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground whitespace-pre-wrap">
              {page.content ? (
                <div dangerouslySetInnerHTML={{ __html: page.content }} />
              ) : (
                <span className="italic">({t("admin.page_content")} vazio)</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminPageEditor;
