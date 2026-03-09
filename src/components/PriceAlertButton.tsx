import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePriceAlert } from "@/hooks/usePriceAlert";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface PriceAlertButtonProps {
  itemId: string;
  price: number;
  itemType?: string;
}

const PriceAlertButton = ({ itemId, price, itemType = "marketplace_item" }: PriceAlertButtonProps) => {
  const { user } = useAuth();
  const { hasAlert, loading, createAlert, removeAlert } = usePriceAlert(itemId, itemType);

  if (!user) return null;

  const handleClick = async () => {
    if (hasAlert) {
      const success = await removeAlert();
      if (success) toast.success("Alerta de preço removido");
    } else {
      const success = await createAlert(price);
      if (success) toast.success("Alerta de preço ativado! Você será notificado se o preço baixar.");
    }
  };

  return (
    <Button
      size="sm"
      variant={hasAlert ? "secondary" : "outline"}
      onClick={handleClick}
      disabled={loading}
      className="gap-1.5"
    >
      {hasAlert ? (
        <>
          <BellOff className="w-4 h-4" /> Alerta ativo
        </>
      ) : (
        <>
          <Bell className="w-4 h-4" /> Alerta de preço
        </>
      )}
    </Button>
  );
};

export default PriceAlertButton;
