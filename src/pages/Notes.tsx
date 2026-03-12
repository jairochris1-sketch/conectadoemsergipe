import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Heart, Pencil, Trash2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import SEOHead from "@/components/SEOHead";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const NOTE_CATEGORIES = [
  { value: "geral", label: "📝 Geral" },
  { value: "poesia", label: "🎭 Poesia" },
  { value: "romance", label: "💕 Romance" },
  { value: "historia", label: "📖 História" },
  { value: "ideia", label: "💡 Ideia" },
  { value: "reflexao", label: "🧠 Reflexão" },
  { value: "humor", label: "😂 Humor" },
];

interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_photo?: string;
  likes_count: number;
  liked_by_me: boolean;
}

const Notes = () => {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("geral");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("notes")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (filter !== "todos") {
      query = query.eq("category", filter);
    }

    const { data } = await query;
    if (!data) { setLoading(false); return; }

    const userIds = [...new Set(data.map((n: any) => n.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, photo_url")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    // Get likes for current user
    let likedSet = new Set<string>();
    if (user) {
      const { data: likes } = await supabase
        .from("note_likes")
        .select("note_id")
        .eq("user_id", user.id);
      likedSet = new Set((likes || []).map((l: any) => l.note_id));
    }

    // Get like counts
    const noteIds = data.map((n: any) => n.id);
    const { data: likeCounts } = await supabase
      .from("note_likes")
      .select("note_id")
      .in("note_id", noteIds);

    const likeCountMap = new Map<string, number>();
    (likeCounts || []).forEach((l: any) => {
      likeCountMap.set(l.note_id, (likeCountMap.get(l.note_id) || 0) + 1);
    });

    setNotes(data.map((n: any) => {
      const profile = profileMap.get(n.user_id) as any;
      return {
        ...n,
        author_name: profile?.name || "Usuário",
        author_photo: profile?.photo_url || null,
        likes_count: likeCountMap.get(n.id) || 0,
        liked_by_me: likedSet.has(n.id),
      };
    }));
    setLoading(false);
  }, [filter, user]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleSave = async () => {
    if (!user || !title.trim() || !content.trim()) return;
    setSaving(true);

    if (editingNote) {
      await supabase.from("notes").update({
        title: title.trim(),
        content: content.trim(),
        category,
        is_public: isPublic,
        updated_at: new Date().toISOString(),
      }).eq("id", editingNote.id);
      toast.success("Nota atualizada!");
    } else {
      await supabase.from("notes").insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        category,
        is_public: isPublic,
      });
      toast.success("Nota publicada!");
    }

    setSaving(false);
    resetForm();
    fetchNotes();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingNote(null);
    setTitle("");
    setContent("");
    setCategory("geral");
    setIsPublic(true);
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setIsPublic(note.is_public);
    setShowForm(true);
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm("Deseja excluir esta nota?")) return;
    await supabase.from("notes").delete().eq("id", noteId);
    toast.success("Nota excluída!");
    fetchNotes();
  };

  const handleLike = async (noteId: string, liked: boolean) => {
    if (!user) return;
    if (liked) {
      await supabase.from("note_likes").delete().eq("note_id", noteId).eq("user_id", user.id);
    } else {
      await supabase.from("note_likes").insert({ note_id: noteId, user_id: user.id });
    }
    setNotes(prev => prev.map(n => n.id === noteId ? {
      ...n,
      liked_by_me: !liked,
      likes_count: liked ? n.likes_count - 1 : n.likes_count + 1,
    } : n));
  };

  const getCategoryLabel = (val: string) => NOTE_CATEGORIES.find(c => c.value === val)?.label || val;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Notas | Conectadoemsergipe" description="Escreva e compartilhe poesias, romances, histórias e ideias." path="/notas" />
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} userPhoto={user?.photoUrl} onLogout={logout} />
      <div className="h-[56px]" />

      <main className="max-w-[800px] mx-auto px-3 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Notas
          </h2>
          {user && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1 border-none cursor-pointer hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Nova Nota
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-thin">
          <button
            onClick={() => setFilter("todos")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
              filter === "todos" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"
            }`}
          >
            Todos
          </button>
          {NOTE_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                filter === cat.value ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Notes list */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma nota encontrada.</p>
            {user && <p className="text-sm text-muted-foreground mt-1">Seja o primeiro a compartilhar!</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map(note => (
              <div key={note.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <Link to={`/user/${note.user_id}`} className="shrink-0">
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-muted border border-border">
                      {note.author_photo ? (
                        <img src={note.author_photo} alt={note.author_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="flex items-center justify-center h-full text-sm text-muted-foreground">👤</span>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/user/${note.user_id}`} className="font-bold text-sm text-foreground hover:underline no-underline">
                        {note.author_name}
                      </Link>
                      <span className="text-xs text-muted-foreground">{getCategoryLabel(note.category)}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground mt-1">{note.title}</h3>
                    <div
                      className={`text-sm text-foreground mt-2 whitespace-pre-wrap ${!expandedNote || expandedNote !== note.id ? "line-clamp-4" : ""}`}
                    >
                      {note.content}
                    </div>
                    {note.content.length > 200 && (
                      <button
                        onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                        className="text-xs text-primary bg-transparent border-none cursor-pointer mt-1 hover:underline"
                      >
                        {expandedNote === note.id ? "Ver menos" : "Ler mais..."}
                      </button>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => handleLike(note.id, note.liked_by_me)}
                        className={`inline-flex items-center gap-1 text-sm bg-transparent border-none cursor-pointer transition-colors ${
                          note.liked_by_me ? "text-destructive" : "text-muted-foreground hover:text-destructive"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${note.liked_by_me ? "fill-current" : ""}`} />
                        {note.likes_count > 0 && note.likes_count}
                      </button>
                      {user && note.user_id === user.id && (
                        <>
                          <button
                            onClick={() => handleEdit(note)}
                            className="text-xs text-primary bg-transparent border-none cursor-pointer hover:underline inline-flex items-center gap-1"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="text-xs text-destructive bg-transparent border-none cursor-pointer hover:underline inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingNote ? "Editar Nota" : "Nova Nota"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título da sua nota..."
                className="w-full border border-border px-3 py-2 rounded-lg text-sm bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-border px-3 py-2 rounded-lg text-sm bg-background text-foreground"
              >
                {NOTE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Conteúdo</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva sua poesia, história, ideia..."
                rows={8}
                className="w-full border border-border px-3 py-2 rounded-lg text-sm bg-background text-foreground resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                id="note-public"
                className="cursor-pointer"
              />
              <label htmlFor="note-public" className="text-sm text-foreground cursor-pointer">Nota pública (visível para todos)</label>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={resetForm} className="px-4 py-2 text-sm border border-border bg-card text-foreground rounded-lg cursor-pointer hover:bg-accent">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !title.trim() || !content.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg cursor-pointer border-none hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Salvando..." : editingNote ? "Atualizar" : "Publicar"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FacebookFooter />
    </div>
  );
};

export default Notes;
