import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminHeaderOpacity = () => {
  const [opacity, setOpacity] = useState(85);
  const [bannerImage, setBannerImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "header_overlay_opacity")
      .single()
      .then(({ data }) => {
        if (data && (data as any).value) setOpacity(Number((data as any).value));
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    const val = String(opacity);

    const { data: existing } = await supabase
      .from("site_settings")
      .select("id")
      .eq("key", "header_overlay_opacity")
      .single();

    if (existing) {
      await supabase
        .from("site_settings")
        .update({ value: val, updated_at: new Date().toISOString() })
        .eq("key", "header_overlay_opacity");
    } else {
      await supabase
        .from("site_settings")
        .insert({ key: "header_overlay_opacity", value: val });
    }

    setMessage("Opacidade salva!");
    setSaving(false);
  };

  return (
    <div className="space-y-3 mt-4 border-t border-border pt-4">
      <p className="text-[12px] font-bold text-foreground">
        🎨 Opacidade da sobreposição azul no header
      </p>
      <p className="text-[10px] text-muted-foreground">
        Controla quanto do azul cobre a imagem de fundo. Menor valor = imagem mais visível.
      </p>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="flex-1"
        />
        <span className="text-[12px] font-bold text-foreground w-[40px] text-right">
          {opacity}%
        </span>
      </div>

      <div
        className="h-[40px] rounded border border-border flex items-center justify-center text-primary-foreground text-[11px] font-bold bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(59,89,152,${opacity / 100}), rgba(59,89,152,${opacity / 100}))`,
          backgroundColor: "hsl(var(--primary))",
        }}
      >
        Preview: [ conectadosemsergipe ]
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-muted border border-border px-3 py-1 text-[11px] cursor-pointer hover:bg-accent"
        >
          {saving ? "Salvando..." : "Salvar opacidade"}
        </button>
      </div>

      {message && (
        <p className="text-[10px] text-primary font-bold">{message}</p>
      )}
    </div>
  );
};

export default AdminHeaderOpacity;
