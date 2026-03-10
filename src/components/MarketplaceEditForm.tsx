import { useState, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useMarketplaceCategories } from "@/hooks/useMarketplaceCategories";
import { SERGIPE_CITIES } from "@/lib/sergipeCities";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MAX_IMAGES = 5;

interface EditItem {
  id: string;
  title: string;
  price: string;
  description: string;
  category: string;
  city: string;
  whatsapp: string;
  condition: string;
  images: string[];
}

interface Props {
  item: EditItem;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const formatBRL = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const parseBRLToNumber = (formatted: string): string => {
  const digits = formatted.replace(/\D/g, "");
  if (!digits) return "0";
  return (parseInt(digits, 10) / 100).toFixed(2);
};

const numberToBRL = (val: string): string => {
  const num = parseFloat(val);
  if (isNaN(num)) return "";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const CONDITIONS = [
  { value: "new", label: "Novo" },
  { value: "used", label: "Usado" },
  { value: "recently_bought", label: "Recém comprado" },
];

const MarketplaceEditForm = ({ item, open, onClose, onSaved }: Props) => {
  const { t } = useLanguage();
  const { categoryNames } = useMarketplaceCategories();
  const [form, setForm] = useState({
    title: item.title,
    price: item.price,
    description: item.description,
    category: item.category,
    city: item.city,
    whatsapp: item.whatsapp,
    condition: item.condition,
  });
  const [priceDisplay, setPriceDisplay] = useState(numberToBRL(item.price));
  const [existingImages, setExistingImages] = useState<string[]>(item.images);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalImages = existingImages.length + newFiles.length;

  const handleNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - totalImages;
    if (remaining <= 0) { toast.error("Máximo de imagens atingido"); return; }
    const toAdd = files.slice(0, remaining);
    toAdd.forEach((f) => {
      const reader = new FileReader();
      reader.onloadend = () => setNewPreviews((p) => [...p, reader.result as string]);
      reader.readAsDataURL(f);
    });
    setNewFiles((p) => [...p, ...toAdd]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.whatsapp.trim()) {
      toast.error("Preencha título e WhatsApp");
      return;
    }
    setSaving(true);
    try {
      // Upload new images
      const uploadedUrls: string[] = [];
      for (const file of newFiles) {
        const ext = file.name.split(".").pop();
        const path = `marketplace_edit/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
        if (!error) {
          const { data } = supabase.storage.from("avatars").getPublicUrl(path);
          uploadedUrls.push(data.publicUrl);
        }
      }

      const allImages = [...existingImages, ...uploadedUrls];

      const { error } = await supabase
        .from("marketplace_items")
        .update({
          title: form.title.trim(),
          price: form.price,
          description: form.description.trim(),
          category: form.category,
          city: form.city,
          whatsapp: form.whatsapp.trim(),
          condition: form.condition,
          image_url: allImages[0] || "",
          images: allImages,
        } as any)
        .eq("id", item.id);

      if (error) {
        toast.error("Erro ao salvar");
      } else {
        toast.success("Anúncio atualizado!");
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
          <DialogTitle>✏️ Editar Anúncio</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <label className="block font-bold mb-1 text-xs">Título *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-border p-2 text-sm bg-card rounded-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1 text-xs">Preço *</label>
              <input type="text" value={priceDisplay} onChange={(e) => { const f = formatBRL(e.target.value); setPriceDisplay(f); setForm({ ...form, price: parseBRLToNumber(e.target.value) }); }} className="w-full border border-border p-2 text-sm bg-card rounded-sm" placeholder="R$ 0,00" />
            </div>
            <div>
              <label className="block font-bold mb-1 text-xs">Categoria</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-border p-2 text-sm bg-card rounded-sm">
                {categoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1 text-xs">Condição</label>
              <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="w-full border border-border p-2 text-sm bg-card rounded-sm">
                {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1 text-xs">Cidade</label>
              <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border border-border p-2 text-sm bg-card rounded-sm">
                <option value="">Selecione...</option>
                {SERGIPE_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block font-bold mb-1 text-xs">WhatsApp *</label>
            <input type="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="w-full border border-border p-2 text-sm bg-card rounded-sm" placeholder="(79) 99999-9999" />
          </div>
          <div>
            <label className="block font-bold mb-1 text-xs">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-border p-2 text-sm bg-card rounded-sm resize-none" rows={3} />
          </div>
          {/* Images */}
          <div>
            <label className="block font-bold mb-1 text-xs">Imagens ({totalImages}/{MAX_IMAGES})</label>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {existingImages.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="w-16 h-16 object-cover border border-border rounded-sm" />
                  <button onClick={() => setExistingImages((p) => p.filter((_, idx) => idx !== i))} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground w-5 h-5 rounded-full text-[10px] flex items-center justify-center cursor-pointer">✕</button>
                </div>
              ))}
              {newPreviews.map((url, i) => (
                <div key={`new-${i}`} className="relative">
                  <img src={url} alt="" className="w-16 h-16 object-cover border border-border rounded-sm" />
                  <button onClick={() => { setNewFiles((p) => p.filter((_, idx) => idx !== i)); setNewPreviews((p) => p.filter((_, idx) => idx !== i)); }} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground w-5 h-5 rounded-full text-[10px] flex items-center justify-center cursor-pointer">✕</button>
                </div>
              ))}
            </div>
            {totalImages < MAX_IMAGES && (
              <>
                <button type="button" onClick={() => fileRef.current?.click()} className="text-xs border border-border px-3 py-1.5 bg-card hover:bg-muted rounded-sm cursor-pointer">+ Adicionar imagem</button>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleNewImages} />
              </>
            )}
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

export default MarketplaceEditForm;
