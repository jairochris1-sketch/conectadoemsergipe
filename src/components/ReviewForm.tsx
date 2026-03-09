import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string) => Promise<boolean>;
  onCancel: () => void;
}

const ReviewForm = ({ onSubmit, onCancel }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Selecione uma avaliação");
      return;
    }
    
    setSubmitting(true);
    const success = await onSubmit(rating, comment);
    if (success) {
      toast.success("Avaliação enviada!");
      onCancel();
    } else {
      toast.error("Erro ao enviar avaliação");
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-accent/30 border border-border rounded-lg p-4 space-y-3">
      <h4 className="font-semibold text-sm">Avaliar vendedor</h4>
      
      {/* Star rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-6 h-6 ${
                star <= (hoverRating || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="text-sm text-muted-foreground ml-2">
            {rating === 1 && "Ruim"}
            {rating === 2 && "Regular"}
            {rating === 3 && "Bom"}
            {rating === 4 && "Muito bom"}
            {rating === 5 && "Excelente"}
          </span>
        )}
      </div>
      
      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comentário (opcional)"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-none"
        maxLength={500}
      />
      
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Enviando..." : "Enviar"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default ReviewForm;
