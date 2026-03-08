import { useState, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
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

interface Props {
  user: { id: string };
  onClose: () => void;
  onItemPosted: () => Promise<void>;
}

const MarketplaceForm = ({ user, onClose, onItemPosted }: Props) => {
  const { t } = useLanguage();
  const [newItem, setNewItem] = useState({ title: "", price: "", description: "", category: "Outros", city: "" });
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const checkNSFW = async (base64: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("check-nsfw", {
        body: { imageBase64: base64 },
      });
      if (error) {
        console.error("NSFW check error:", error);
        return true; // allow on error
      }
      if (!data.safe) {
        toast.error(t("marketplace.nsfw_blocked") + (data.reason ? ` (${data.reason})` : ""));
        return false;
      }
      return true;
    } catch {
      return true; // allow on error
    }
  };

  const handlePost = async () => {
    if (!newItem.title || !newItem.price) return;
    setPosting(true);

    // NSFW check before upload
    if (imagePreview) {
      const isSafe = await checkNSFW(imagePreview);
      if (!isSafe) {
        setPosting(false);
        return;
      }
    }

    let uploadedUrl = "";
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `marketplace/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, imageFile, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        uploadedUrl = urlData.publicUrl;
      }
    }

    await supabase.from("marketplace_items").insert({
      user_id: user.id,
      title: newItem.title,
      price: newItem.price,
      description: newItem.description,
      category: newItem.category,
      city: newItem.city,
      image_url: uploadedUrl,
    });

    setNewItem({ title: "", price: "", description: "", category: "Outros", city: "" });
    setImagePreview("");
    setImageFile(null);
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
          <input type="text" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} className="w-full border border-border p-1 text-[11px] bg-card" placeholder="R$ 25" />
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
      <div>
        <label className="block font-bold mb-1">{t("marketplace.city")}</label>
        <input type="text" value={newItem.city} onChange={(e) => setNewItem({ ...newItem, city: e.target.value })} className="w-full border border-border p-1 text-[11px] bg-card" placeholder="Aracaju" />
      </div>
      <div>
        <label className="block font-bold mb-1">{t("marketplace.image")}</label>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="text-[11px]" />
        {imagePreview && (
          <div className="mt-1">
            <img src={imagePreview} alt="Preview" className="w-[80px] h-[80px] object-cover border border-border" />
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
