import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Trash2, Pencil, Eye, EyeOff, Plus, Upload } from "lucide-react";

interface BannerAd {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  position: string;
  is_active: boolean;
  click_count: number;
  impression_count: number;
  sort_order: number;
  created_at: string;
}

const POSITIONS = [
  { value: "both", label: "Laterais + Feed" },
  { value: "left", label: "Lateral esquerda" },
  { value: "right", label: "Lateral direita" },
  { value: "feed", label: "Entre posts" },
];

const AdminBannerManager = () => {
  const { user } = useAuth();
  const [banners, setBanners] = useState<BannerAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    image_url: "",
    link_url: "",
    position: "both",
    sort_order: 0,
  });

  const fetchBanners = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("banner_ads")
      .select("*")
      .order("sort_order", { ascending: true });
    setBanners((data as BannerAd[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchBanners(); }, []);

  const resetForm = () => {
    setForm({ title: "", image_url: "", link_url: "", position: "both", sort_order: 0 });
    setEditing(null);
    setShowForm(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `banners/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file);
    if (error) {
      toast.error("Erro ao enviar imagem");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
    toast.success("Imagem enviada!");
  };

  const handleSave = async () => {
    if (!form.image_url) { toast.error("Adicione uma imagem"); return; }
    if (editing) {
      const { error } = await supabase.from("banner_ads").update({
        title: form.title,
        image_url: form.image_url,
        link_url: form.link_url,
        position: form.position,
        sort_order: form.sort_order,
      }).eq("id", editing);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Banner atualizado!");
    } else {
      const { error } = await supabase.from("banner_ads").insert({
        title: form.title,
        image_url: form.image_url,
        link_url: form.link_url,
        position: form.position,
        sort_order: form.sort_order,
        created_by: user?.id,
      });
      if (error) { toast.error("Erro ao criar banner"); return; }
      toast.success("Banner criado!");
    }
    resetForm();
    fetchBanners();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("banner_ads").update({ is_active: !current }).eq("id", id);
    fetchBanners();
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Excluir este banner?")) return;
    await supabase.from("banner_ads").delete().eq("id", id);
    toast.success("Banner excluído");
    fetchBanners();
  };

  const startEdit = (b: BannerAd) => {
    setForm({
      title: b.title,
      image_url: b.image_url,
      link_url: b.link_url,
      position: b.position,
      sort_order: b.sort_order,
    });
    setEditing(b.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-bold text-primary">📢 Gerenciar Banners</h3>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-1 bg-primary text-primary-foreground border-none px-2 py-1 text-[10px] cursor-pointer hover:opacity-90"
          >
            <Plus className="w-3 h-3" /> Novo Banner
          </button>
        )}
      </div>

      {showForm && (
        <div className="border border-border p-3 mb-3 bg-accent space-y-2">
          <p className="text-[12px] font-bold">{editing ? "Editar Banner" : "Novo Banner"}</p>
          <div>
            <label className="text-[10px] text-muted-foreground">Título (opcional)</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full border border-border px-2 py-1 text-[11px] bg-card text-foreground"
              placeholder="Nome do anúncio"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Imagem</label>
            <div className="flex items-center gap-2">
              <input
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                className="flex-1 border border-border px-2 py-1 text-[11px] bg-card text-foreground"
                placeholder="URL da imagem ou faça upload"
              />
              <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleUpload} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1 bg-muted border border-border px-2 py-1 text-[10px] cursor-pointer hover:bg-accent"
              >
                <Upload className="w-3 h-3" /> {uploading ? "..." : "Upload"}
              </button>
            </div>
            {form.image_url && (
              <img src={form.image_url} alt="Preview" className="mt-1 max-h-[80px] border border-border" />
            )}
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Link (URL de destino)</label>
            <input
              value={form.link_url}
              onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
              className="w-full border border-border px-2 py-1 text-[11px] bg-card text-foreground"
              placeholder="https://exemplo.com"
            />
          </div>
          <div className="flex gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground">Posição</label>
              <select
                value={form.position}
                onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                className="w-full border border-border px-2 py-1 text-[11px] bg-card text-foreground"
              >
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Ordem</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                className="w-[60px] border border-border px-2 py-1 text-[11px] bg-card text-foreground"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90">
              {editing ? "Salvar" : "Criar"}
            </button>
            <button onClick={resetForm} className="bg-muted text-foreground border border-border px-3 py-1 text-[11px] cursor-pointer hover:opacity-90">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-[11px] text-muted-foreground">Carregando...</p>
      ) : banners.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">Nenhum banner cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {banners.map((b) => (
            <div key={b.id} className={`border border-border p-2 text-[11px] flex gap-3 items-start ${!b.is_active ? "opacity-50" : ""}`}>
              <img src={b.image_url} alt={b.title} className="w-[80px] h-[60px] object-cover border border-border shrink-0" />
              <div className="flex-1 min-w-0 space-y-[2px]">
                <p className="font-bold truncate">{b.title || "(sem título)"}</p>
                <p className="text-muted-foreground truncate">{b.link_url || "Sem link"}</p>
                <p className="text-muted-foreground">
                  Posição: <b>{POSITIONS.find((p) => p.value === b.position)?.label || b.position}</b> · Ordem: {b.sort_order}
                </p>
                <p className="text-muted-foreground">
                  👁 {b.impression_count} impressões · 🖱 {b.click_count} cliques
                </p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => toggleActive(b.id, b.is_active)}
                  className="flex items-center gap-1 bg-muted border border-border px-2 py-[2px] text-[10px] cursor-pointer hover:bg-accent"
                  title={b.is_active ? "Desativar" : "Ativar"}>
                  {b.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {b.is_active ? "Desativar" : "Ativar"}
                </button>
                <button onClick={() => startEdit(b)}
                  className="flex items-center gap-1 bg-muted border border-border px-2 py-[2px] text-[10px] cursor-pointer hover:bg-accent">
                  <Pencil className="w-3 h-3" /> Editar
                </button>
                <button onClick={() => deleteBanner(b.id)}
                  className="flex items-center gap-1 bg-destructive/10 text-destructive border border-destructive/30 px-2 py-[2px] text-[10px] cursor-pointer hover:bg-destructive/20">
                  <Trash2 className="w-3 h-3" /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBannerManager;
