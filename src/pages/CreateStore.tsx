import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SERGIPE_CITIES } from "@/lib/sergipeCities";
import { toast } from "sonner";
import { Camera, Store } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const STORE_CATEGORIES = [
  "Geral", "Moda", "Eletrônicos", "Alimentos", "Artesanato", "Beleza",
  "Casa e Decoração", "Esportes", "Livros", "Brinquedos", "Pet Shop", "Outros"
];

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const CreateStore = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("Geral");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) {
    navigate("/login");
    return null;
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Digite o nome da loja");
      return;
    }
    setSaving(true);

    let photo_url = "";
    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `${user.id}/store/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("post-images").upload(path, photoFile, { upsert: true });
      if (!error) {
        const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }
    }

    const slug = slugify(name) + "-" + Date.now().toString(36);

    const { error } = await supabase.from("stores").insert({
      user_id: user.id,
      name: name.trim(),
      slug,
      description: description.trim(),
      photo_url,
      city,
      category,
    } as any);

    if (error) {
      toast.error("Erro ao criar loja: " + error.message);
      setSaving(false);
      return;
    }

    toast.success("Loja criada com sucesso!");
    navigate(`/store/${slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Criar Loja - Conectadoemsergipe" description="Crie sua loja no Conectadoemsergipe" />
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={async () => {}} />
      <div className="max-w-lg mx-auto px-4 py-6 pt-20">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
          <Store className="w-5 h-5 text-primary" /> Criar Loja
        </h1>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
          {/* Photo */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-28 h-28 rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:border-primary transition-colors"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-muted-foreground" />
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <span className="text-xs text-muted-foreground mt-2">Foto da loja</span>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Nome da loja *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Moda Sergipana" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none"
              placeholder="Descreva sua loja..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Cidade</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
              >
                <option value="">Selecione...</option>
                {SERGIPE_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
              >
                {STORE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving ? "Criando..." : "Criar Loja"}
          </Button>
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default CreateStore;
