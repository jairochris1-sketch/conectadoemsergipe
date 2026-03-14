import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Image, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { validateAndCompressImage } from "@/lib/imageCompression";

interface Props {
  open: boolean;
  onClose: () => void;
  onPublished: () => void;
}

const UserStoryUpload = ({ open, onClose, onPublished }: Props) => {
  const { user } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }
    try {
      const { blob } = await validateAndCompressImage(file);
      const compressedFile = new File([blob], file.name, { type: "image/jpeg" });
      setImageFile(compressedFile);
      setPreview(URL.createObjectURL(compressedFile));
    } catch {
      toast.error("Erro ao processar imagem");
    }
  };

  const handlePublish = async () => {
    if (!imageFile || !user) return;
    setLoading(true);

    try {
      const ext = imageFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("user-stories")
        .upload(path, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("user-stories")
        .getPublicUrl(path);

      const { error: insertError } = await supabase.from("user_stories").insert({
        user_id: user.id,
        image_url: publicUrl,
        caption: caption.trim(),
      });

      if (insertError) throw insertError;

      toast.success("Story publicado!");
      onPublished();
    } catch (err: any) {
      toast.error("Erro ao publicar story: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publicar Story</DialogTitle>
        </DialogHeader>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {!preview ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <p className="text-sm text-muted-foreground text-center">
              Escolha uma foto para o seu story. Ela ficará visível por 24 horas.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (fileRef.current) {
                    fileRef.current.removeAttribute("capture");
                    fileRef.current.click();
                  }
                }}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Image className="w-4 h-4" />
                Galeria
              </button>
              <button
                onClick={() => {
                  if (fileRef.current) {
                    fileRef.current.setAttribute("capture", "environment");
                    fileRef.current.click();
                  }
                }}
                className="flex items-center gap-2 bg-muted text-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
              >
                <Camera className="w-4 h-4" />
                Câmera
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative w-full aspect-[9/16] max-h-[400px] rounded-xl overflow-hidden bg-black">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Adicionar legenda (opcional)"
              maxLength={200}
              className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setPreview(null); setImageFile(null); }}
                className="flex-1 bg-muted text-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
              >
                Trocar foto
              </button>
              <button
                onClick={handlePublish}
                disabled={loading}
                className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Publicar
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserStoryUpload;
