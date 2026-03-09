import { useState, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useForbiddenWords } from "@/hooks/useForbiddenWords";
import { toast } from "sonner";

const CATEGORIES_NO_ALL = [
  "Móveis", "Imóveis", "Celulares", "Carros", "Motos", "Bicicletas",
  "Som", "Roupas", "Bolos/Doces", "Mudas Frutíferas", "Sofá/Mesa/Cadeiras",
  "Fogão", "Geladeira", "Guarda-Roupa", "Eletrônicos", "Livros", "Outros"
];

const CATEGORY_KEYS: Record<string, string> = {
  "Móveis": "marketplace.moveis", "Imóveis": "marketplace.imoveis",
  "Celulares": "marketplace.celulares", "Carros": "marketplace.carros",
  "Motos": "marketplace.motos", "Bicicletas": "marketplace.bicicletas",
  "Som": "marketplace.som", "Roupas": "marketplace.clothing",
  "Bolos/Doces": "marketplace.bolos_doces", "Mudas Frutíferas": "marketplace.mudas",
  "Sofá/Mesa/Cadeiras": "marketplace.sofa_mesa", "Fogão": "marketplace.fogao",
  "Geladeira": "marketplace.geladeira", "Guarda-Roupa": "marketplace.guarda_roupa",
  "Eletrônicos": "marketplace.electronics", "Livros": "marketplace.books",
  "Outros": "marketplace.other",
};

const MAX_IMAGES = 5;

interface Props {
  user: { id: string };
  onClose: () => void;
  onItemPosted: () => Promise<void>;
}

const formatBRL = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  const reais = cents / 100;
  return reais.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const parseBRLToNumber = (formatted: string): string => {
  const digits = formatted.replace(/\D/g, "");
  if (!digits) return "0";
  return (parseInt(digits, 10) / 100).toFixed(2);
};

const CONDITIONS = [
  { value: "new", label: "marketplace.condition_new" },
  { value: "used", label: "marketplace.condition_used" },
  { value: "recently_bought", label: "marketplace.condition_recently_bought" },
];

const MarketplaceForm = ({ user, onClose, onItemPosted }: Props) => {
  const { t } = useLanguage();
  const [newItem, setNewItem] = useState({ title: "", price: "", description: "", category: "Outros", city: "", whatsapp: "", condition: "used" });
  const [priceDisplay, setPriceDisplay] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - imageFiles.length;
    if (remaining <= 0) {
      toast.error(t("marketplace.max_images_reached"));
      return;
    }

    const toAdd = files.slice(0, remaining);

    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setImageFiles((prev) => [...prev, ...toAdd]);

    // Reset input so user can select more
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const checkNSFW = async (base64: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("check-nsfw", {
        body: { imageBase64: base64 },
      });
      if (error) return true;
      if (!data.safe) {
        toast.error(t("marketplace.nsfw_blocked") + (data.reason ? ` (${data.reason})` : ""));
        return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  const { containsForbiddenWord } = useForbiddenWords();

  const handlePost = async () => {
    if (!newItem.title || !newItem.price || !newItem.whatsapp.trim()) {
      toast.error(t("marketplace.whatsapp_required"));
      return;
    }
    const textToCheck = `${newItem.title} ${newItem.description}`;
    if (containsForbiddenWord(textToCheck)) {
      toast.error("Palavras ou mensagem proibida segundo as regras do conectadoemsergipe.");
      return;
    }
    setPosting(true);

    // NSFW check on all images
    for (const preview of imagePreviews) {
      const isSafe = await checkNSFW(preview);
      if (!isSafe) {
        setPosting(false);
        return;
      }
    }

    // Upload all images
    const uploadedUrls: string[] = [];
    for (const file of imageFiles) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/marketplace/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    await supabase.from("marketplace_items").insert({
      user_id: user.id,
      title: newItem.title,
      price: newItem.price,
      description: newItem.description,
      category: newItem.category,
      city: newItem.city,
      whatsapp: newItem.whatsapp,
      condition: newItem.condition,
      image_url: uploadedUrls[0] || "",
      images: uploadedUrls,
    } as any);

    setNewItem({ title: "", price: "", description: "", category: "Outros", city: "", whatsapp: "", condition: "used" });
    setPriceDisplay("");
    setImagePreviews([]);
    setImageFiles([]);
    onClose();
    setPosting(false);
    await onItemPosted();
  };

  return (
    <div className="border border-border p-2 bg-accent mb-3 text-[11px] space-y-2">
      <div>
        <label className="block font-bold mb-1">{t("marketplace.item_title")}</label>
        <input type="text" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} className="w-full border border-border p-1 text-[11px] bg-card" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block font-bold mb-1">{t("marketplace.price")}</label>
          <input
            type="text"
            value={priceDisplay}
            onChange={(e) => {
              const formatted = formatBRL(e.target.value);
              setPriceDisplay(formatted);
              setNewItem({ ...newItem, price: parseBRLToNumber(e.target.value) });
            }}
            className="w-full border border-border p-1 text-[11px] bg-card"
            placeholder="R$ 0,00"
          />
        </div>
        <div className="flex-1">
          <label className="block font-bold mb-1">{t("marketplace.category")}</label>
          <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="w-full border border-border p-1 text-[11px] bg-card">
            {CATEGORIES_NO_ALL.map((c) => (
              <option key={c} value={c}>{t(CATEGORY_KEYS[c])}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block font-bold mb-1">{t("marketplace.condition") || "Condição"}</label>
          <select value={newItem.condition} onChange={(e) => setNewItem({ ...newItem, condition: e.target.value })} className="w-full border border-border p-1 text-[11px] bg-card">
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>{t(c.label) || c.value}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block font-bold mb-1">{t("marketplace.city")}</label>
        <input type="text" value={newItem.city} onChange={(e) => setNewItem({ ...newItem, city: e.target.value })} className="w-full border border-border p-1 text-[11px] bg-card" placeholder="Aracaju" />
      </div>
      <div>
        <label className="block font-bold mb-1">📱 {t("marketplace.whatsapp_label")} *</label>
        <input
          type="tel"
          value={newItem.whatsapp}
          onChange={(e) => setNewItem({ ...newItem, whatsapp: e.target.value })}
          className="w-full border border-border p-1 text-[11px] bg-card"
          placeholder="(79) 99999-9999"
        />
      </div>
      <div>
        <label className="block font-bold mb-1">{t("marketplace.image")} ({imageFiles.length}/{MAX_IMAGES})</label>
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          onChange={handleImageChange}
          className="text-[11px]"
          disabled={imageFiles.length >= MAX_IMAGES}
        />
        {imagePreviews.length > 0 && (
          <div className="mt-1 flex gap-1 flex-wrap">
            {imagePreviews.map((preview, i) => (
              <div key={i} className="relative">
                <img src={preview} alt={`Preview ${i + 1}`} className="w-[60px] h-[60px] object-cover border border-border" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 text-[9px] flex items-center justify-center leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="block font-bold mb-1">{t("marketplace.description")}</label>
        <textarea value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className="w-full border border-border p-1 text-[11px] resize-none bg-card" rows={2} />
      </div>
      <button onClick={handlePost} disabled={posting} className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90 disabled:opacity-50">
        {posting ? t("marketplace.checking_image") : t("marketplace.post_item")}
      </button>
    </div>
  );
};

export default MarketplaceForm;
