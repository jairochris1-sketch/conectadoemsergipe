import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Camera, X, AlertTriangle } from "lucide-react";
import { SERGIPE_CITIES } from "@/lib/sergipeCities";
import { useMarketplaceCategories } from "@/hooks/useMarketplaceCategories";
import DeliveryOptionsSelect from "@/components/DeliveryOptionsSelect";
import type { DeliveryOption } from "@/components/DeliveryOptionsSelect";
import { PLAN_PRODUCT_LIMITS } from "@/components/StorePlanBadge";

const MAX_IMAGES = 5;

const formatBRL = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return (parseInt(digits, 10) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};
const parseBRL = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "0";
  return (parseInt(digits, 10) / 100).toFixed(2);
};

const PRODUCT_CATEGORIES = [
  "Geral", "Moda", "Eletrônicos", "Alimentos", "Artesanato", "Beleza",
  "Casa e Decoração", "Esportes", "Livros", "Brinquedos", "Pet Shop",
  "Veículos", "Imóveis", "Móveis", "Outros"
];

interface Props {
  storeId: string;
  userId: string;
  storeCity: string;
  onClose: () => void;
  onProductAdded: () => void;
}

const StoreProductForm = ({ storeId, userId, storeCity, onClose, onProductAdded }: Props) => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("Geral");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [deliveryCost, setDeliveryCost] = useState("");
  const [productCount, setProductCount] = useState(0);
  const [productLimit, setProductLimit] = useState(10);
  const [planType, setPlanType] = useState("free");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch current product count and plan
    const fetchLimits = async () => {
      const [{ count }, { data: plan }] = await Promise.all([
        supabase.from("store_products").select("id", { count: "exact", head: true }).eq("store_id", storeId).eq("is_active", true),
        supabase.from("store_plans").select("plan_type").eq("store_id", storeId).eq("is_active", true).maybeSingle(),
      ]);
      const pt = (plan as any)?.plan_type || "free";
      setPlanType(pt);
      setProductCount(count || 0);
      setProductLimit(PLAN_PRODUCT_LIMITS[pt] || 10);
    };
    fetchLimits();
  }, [storeId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_IMAGES - imageFiles.length;
    if (remaining <= 0) { toast.error("Máximo de 5 imagens"); return; }
    const toAdd = files.slice(0, remaining);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews((p) => [...p, reader.result as string]);
      reader.readAsDataURL(file);
    });
    setImageFiles((p) => [...p, ...toAdd]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setImagePreviews((p) => p.filter((_, i) => i !== idx));
    setImageFiles((p) => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !price) {
      toast.error("Preencha título e preço");
      return;
    }
    if (productCount >= productLimit) {
      toast.error(`Limite de ${productLimit} produtos atingido. Faça upgrade do seu plano para adicionar mais.`);
      return;
    }
    setPosting(true);

    const uploadedUrls: string[] = [];
    for (const file of imageFiles) {
      const ext = file.name.split(".").pop();
      const path = `${userId}/store-products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("post-images").upload(path, file, { upsert: true });
      if (!error) {
        const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    const { error } = await supabase.from("store_products").insert({
      store_id: storeId,
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
      price,
      image_url: uploadedUrls[0] || "",
      images: uploadedUrls,
      city: city || storeCity,
      category,
      delivery_options: deliveryOptions,
      delivery_cost: deliveryCost,
    } as any);

    if (error) {
      toast.error("Erro ao adicionar produto");
      setPosting(false);
      return;
    }

    toast.success("Produto adicionado!");
    setPosting(false);
    onClose();
    onProductAdded();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">Novo Produto</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Images */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">
          Imagens ({imageFiles.length}/{MAX_IMAGES})
        </label>
        <div className="flex gap-2 flex-wrap">
          {imagePreviews.map((preview, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
              <img src={preview} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
          {imageFiles.length < MAX_IMAGES && (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-lg bg-muted border-2 border-dashed border-border flex items-center justify-center hover:border-primary transition-colors"
            >
              <Camera className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
      </div>

      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do produto *" />
      <Input
        value={priceDisplay}
        onChange={(e) => {
          setPriceDisplay(formatBRL(e.target.value));
          setPrice(parseBRL(e.target.value));
        }}
        placeholder="Preço (R$) *"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
        >
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
        >
          <option value="">Cidade (usa da loja)</option>
          {SERGIPE_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none"
        placeholder="Descrição do produto"
      />

      <DeliveryOptionsSelect
        value={deliveryOptions}
        onChange={setDeliveryOptions}
        deliveryCost={deliveryCost}
        onDeliveryCostChange={setDeliveryCost}
      />

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={posting} size="sm">
          {posting ? "Salvando..." : "Adicionar Produto"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
      </div>
    </div>
  );
};

export default StoreProductForm;
