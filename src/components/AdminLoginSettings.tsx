import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { validateAndCompressImage } from "@/lib/imageCompression";

const ALL_SETTINGS_KEYS = [
  "login_welcome_title",
  "login_welcome_text",
  "login_welcome_bar",
  "login_opened_text",
  "login_use_for_text",
  "login_feature1",
  "login_feature2",
  "login_feature3",
  "login_feature4",
  "login_get_started",
  "login_banner",
];

const AdminLoginSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ALL_SETTINGS_KEYS)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        data?.forEach((row: any) => { map[row.key] = row.value; });
        setSettings(map);
      });
  }, []);

  const updateField = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

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
      const promises = ALL_SETTINGS_KEYS
        .filter((k) => k !== "login_banner")
        .map((key) => saveSetting(key, settings[key] || ""));
      await Promise.all(promises);
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
      updateField("login_banner", url);
      toast.success("Imagem de fundo atualizada!");
    } catch {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const field = (key: string, label: string, placeholder: string, multiline = false) => (
    <div key={key}>
      <label className="text-xs font-bold block mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={settings[key] || ""}
          onChange={(e) => updateField(key, e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full border border-border px-3 py-2 text-sm bg-card rounded-sm resize-none"
        />
      ) : (
        <input
          type="text"
          value={settings[key] || ""}
          onChange={(e) => updateField(key, e.target.value)}
          placeholder={placeholder}
          className="w-full border border-border px-3 py-2 text-sm bg-card rounded-sm"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold border-b border-border pb-2">🔐 Configurações da Tela de Login</h3>

      {field("login_welcome_title", "Título de boas-vindas", "Ex: Bem-vindo ao Conectadoemsergipe!")}
      {field("login_welcome_text", "Texto descritivo principal", "Descrição exibida na tela de login...", true)}
      {field("login_welcome_bar", "Barra de boas-vindas (topo)", "Ex: Bem-vindo ao maior portal de Sergipe!")}
      {field("login_opened_text", "Texto 'aberto para'", "Ex: Aberto para todo o estado de")}
      {field("login_use_for_text", "Texto 'use para'", "Ex: Use o site para:")}
      {field("login_feature1", "Recurso 1", "Ex: Comprar e vender produtos")}
      {field("login_feature2", "Recurso 2", "Ex: Encontrar serviços profissionais")}
      {field("login_feature3", "Recurso 3", "Ex: Conectar-se com pessoas")}
      {field("login_feature4", "Recurso 4", "Ex: Criar sua própria loja")}
      {field("login_get_started", "Texto final (call to action)", "Ex: Cadastre-se agora e faça parte!")}

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-primary text-primary-foreground px-4 py-2 text-sm rounded-sm hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Salvar textos"}
      </button>

      <div className="border-t border-border pt-4">
        <label className="text-xs font-bold block mb-1">Imagem de fundo da tela de login</label>
        {settings.login_banner && (
          <img src={settings.login_banner} alt="Banner atual" className="w-full max-h-[150px] object-cover rounded-sm border border-border mb-2" />
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
