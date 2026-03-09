import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { validateAndCompressImage } from "@/lib/imageCompression";

const SETTINGS_KEYS = ["login_welcome_title", "login_welcome_text", "login_banner"];

const AdminLoginSettings = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", SETTINGS_KEYS)
      .then(({ data }) => {
        data?.forEach((row: any) => {
          if (row.key === "login_welcome_title") setTitle(row.value);
          if (row.key === "login_welcome_text") setText(row.value);
          if (row.key === "login_banner") setBannerUrl(row.value);
        });
      });
  }, []);

  const saveSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase
      .from("site_settings")
      .select("id")
      .eq("key", key)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("site_settings")
        .update({ value, updated_by: user?.id, updated_at: new Date().toISOString() })
        .eq("key", key);
    } else {
      await supabase
        .from("site_settings")
        .insert({ key, value, updated_by: user?.id });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting("login_welcome_title", title),
        saveSetting("login_welcome_text", text),
      ]);
      toast.success("Configurações da tela de login salvas!");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const { blob } = await validateAndCompressImage(file);
      const path = `login-banner/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("site-assets")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
      const url = urlData.publicUrl;
      await saveSetting("login_banner", url);
      setBannerUrl(url);
      toast.success("Imagem de fundo atualizada!");
    } catch {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold border-b border-border pb-2">🔐 Configurações da Tela de Login</h3>

      <div>
        <label className="text-xs font-bold block mb-1">Título de boas-vindas</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Bem-vindo ao Conectadoemsergipe!"
          className="w-full border border-border px-3 py-2 text-sm bg-card rounded-sm"
        />
      </div>

      <div>
        <label className="text-xs font-bold block mb-1">Texto descritivo</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Descrição exibida na tela de login..."
          rows={4}
          className="w-full border border-border px-3 py-2 text-sm bg-card rounded-sm resize-none"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-primary text-primary-foreground px-4 py-2 text-sm rounded-sm hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Salvar textos"}
      </button>

      <div className="border-t border-border pt-4">
        <label className="text-xs font-bold block mb-1">Imagem de fundo da tela de login</label>
        {bannerUrl && (
          <img src={bannerUrl} alt="Banner atual" className="w-full max-h-[150px] object-cover rounded-sm border border-border mb-2" />
        )}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="bg-accent text-foreground border border-border px-3 py-2 text-xs rounded-sm cursor-pointer hover:bg-muted disabled:opacity-50"
        >
          {uploading ? "Enviando..." : "Alterar imagem de fundo"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUploadBanner}
        />
      </div>
    </div>
  );
};

export default AdminLoginSettings;
