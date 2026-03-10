import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SERGIPE_CITIES } from "@/lib/sergipeCities";
import { toast } from "sonner";
import { validateAndCompressImage } from "@/lib/imageCompression";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImagePlus } from "lucide-react";

interface ServiceCategory { id: string; name: string; sort_order: number; }
interface ServiceSubcategory { id: string; category_id: string; name: string; sort_order: number; }

interface EditListing {
  id: string;
  title: string;
  description: string;
  whatsapp: string;
  city: string;
  category_id: string;
  subcategory_id: string | null;
  image_url: string;
}

interface Props {
  listing: EditListing;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const ServiceEditForm = ({ listing, open, onClose, onSaved }: Props) => {
  const [form, setForm] = useState({
    title: listing.title,
    description: listing.description || "",
    whatsapp: listing.whatsapp,
    city: listing.city || "",
    category_id: listing.category_id,
    subcategory_id: listing.subcategory_id || "",
  });
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [subcategories, setSubcategories] = useState<ServiceSubcategory[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(listing.image_url || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("service_categories").select("*").order("sort_order").then(({ data }) => setCategories(data || []));
    if (listing.category_id) {
      supabase.from("service_subcategories").select("*").eq("category_id", listing.category_id).order("sort_order").then(({ data }) => setSubcategories(data || []));
    }
  }, [listing.category_id]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.whatsapp.trim() || !form.category_id) {
      toast.error("Preencha título, categoria e WhatsApp");
      return;
    }
    setSaving(true);
    try {
      let imageUrl = listing.image_url;

      if (imageFile) {
        const { blob } = await validateAndCompressImage(imageFile);
        const path = `services/edit/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const { error } = await supabase.storage.from("post-images").upload(path, blob, { contentType: "image/jpeg" });
        if (!error) {
          const { data } = supabase.storage.from("post-images").getPublicUrl(path);
          imageUrl = data.publicUrl;
        }
      }

      const { error } = await supabase
        .from("service_listings")
        .update({
          title: form.title.trim(),
          description: form.description.trim(),
          whatsapp: form.whatsapp.trim(),
          city: form.city,
          category_id: form.category_id,
          subcategory_id: form.subcategory_id || null,
          image_url: imageUrl,
        })
        .eq("id", listing.id);

      if (error) {
        toast.error("Erro ao salvar");
      } else {
        toast.success("Serviço atualizado!");
        onSaved();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>✏️ Editar Serviço</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1 text-xs">Categoria *</label>
              <select value={form.category_id} onChange={(e) => { setForm({ ...form, category_id: e.target.value, subcategory_id: "" }); if (e.target.value) supabase.from("service_subcategories").select("*").eq("category_id", e.target.value).order("sort_order").then(({ data }) => setSubcategories(data || [])); }} className="w-full border border-border p-2 text-sm bg-card rounded-sm">
                <option value="">Selecione...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {subcategories.filter((s) => s.category_id === form.category_id).length > 0 && (
              <div>
                <label className="block font-bold mb-1 text-xs">Subcategoria</label>
                <select value={form.subcategory_id} onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })} className="w-full border border-border p-2 text-sm bg-card rounded-sm">
                  <option value="">Nenhuma</option>
                  {subcategories.filter((s) => s.category_id === form.category_id).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="block font-bold mb-1 text-xs">Título *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-border p-2 text-sm bg-card rounded-sm" />
          </div>
          <div>
            <label className="block font-bold mb-1 text-xs">WhatsApp *</label>
            <input type="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="w-full border border-border p-2 text-sm bg-card rounded-sm" placeholder="(79) 99999-9999" />
          </div>
          <div>
            <label className="block font-bold mb-1 text-xs">Cidade</label>
            <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border border-border p-2 text-sm bg-card rounded-sm">
              <option value="">Selecione...</option>
              {SERGIPE_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-bold mb-1 text-xs">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-border p-2 text-sm bg-card rounded-sm resize-none" rows={3} />
          </div>
          <div>
            <label className="block font-bold mb-1 text-xs">Imagem</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 text-xs border border-border bg-card hover:bg-muted rounded-sm cursor-pointer">
                <ImagePlus className="w-4 h-4" /> Alterar imagem
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              {imagePreview && (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-sm border border-border" />
                  <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground w-5 h-5 rounded-full text-[10px] flex items-center justify-center cursor-pointer">✕</button>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground px-4 py-2 text-sm hover:opacity-90 rounded-sm disabled:opacity-50 cursor-pointer">{saving ? "Salvando..." : "Salvar"}</button>
            <button onClick={onClose} className="bg-muted text-foreground border border-border px-4 py-2 text-sm hover:opacity-90 rounded-sm cursor-pointer">Cancelar</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceEditForm;
