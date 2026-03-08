import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminBannerImage = () => {
  const [currentImage, setCurrentImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "login_banner")
      .single()
      .then(({ data }) => {
        if (data && (data as any).value) setCurrentImage((data as any).value);
      });
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    const ext = file.name.split(".").pop();
    const fileName = `login-banner-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("site-assets")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setMessage("Erro ao enviar: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("site-assets")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Upsert: try update first, if no rows affected, insert
    const { data: existing } = await supabase
      .from("site_settings")
      .select("id")
      .eq("key", "login_banner")
      .single();

    if (existing) {
      await supabase
        .from("site_settings")
        .update({ value: publicUrl, updated_at: new Date().toISOString() })
        .eq("key", "login_banner");
    } else {
      await supabase
        .from("site_settings")
        .insert({ key: "login_banner", value: publicUrl });
    }

    setCurrentImage(publicUrl);
    setMessage("Banner atualizado com sucesso!");
    setUploading(false);
  };

  const handleRemove = async () => {
    await supabase
      .from("site_settings")
      .update({ value: "", updated_at: new Date().toISOString() })
      .eq("key", "login_banner");
    setCurrentImage("");
    setMessage("Banner removido.");
  };

  return (
    <div className="space-y-3">
      <p className="text-[12px] font-bold text-foreground">
        🖼️ Banner do Topo (Tela de Login)
      </p>
      <p className="text-[10px] text-muted-foreground">
        Esta imagem aparece no topo da página de login, acima da barra azul.
      </p>

      {currentImage && (
        <div className="border border-border p-2 inline-block">
          <img
            src={currentImage}
            alt="Banner atual"
            className="max-w-[300px] max-h-[120px] object-contain"
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="bg-muted border border-border px-3 py-1 text-[11px] cursor-pointer hover:bg-accent inline-block">
          {uploading ? "Enviando..." : "Escolher imagem"}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {currentImage && (
          <button
            onClick={handleRemove}
            className="bg-destructive text-destructive-foreground border-none px-3 py-1 text-[11px] cursor-pointer"
          >
            Remover
          </button>
        )}
      </div>

      {message && (
        <p className="text-[10px] text-primary font-bold">{message}</p>
      )}
    </div>
  );
};

export default AdminBannerImage;
