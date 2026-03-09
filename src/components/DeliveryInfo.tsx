import { Package, Truck, MapPin } from "lucide-react";

interface DeliveryOption {
  type: "pickup" | "local" | "shipping";
  cost?: string;
}

interface DeliveryInfoProps {
  options: DeliveryOption[];
  deliveryCost?: string;
}

const DELIVERY_LABELS: Record<string, { label: string; icon: any }> = {
  pickup: { label: "Retirada no local", icon: MapPin },
  local: { label: "Entrega local", icon: Truck },
  shipping: { label: "Envio por transportadora/correios", icon: Package },
};

const DeliveryInfo = ({ options, deliveryCost }: DeliveryInfoProps) => {
  if (!options || options.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Opções de entrega</h4>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const config = DELIVERY_LABELS[opt.type];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <div
              key={opt.type}
              className="flex items-center gap-1.5 text-xs bg-accent/50 px-2 py-1 rounded-md"
            >
              <Icon className="w-3 h-3 text-primary" />
              <span>{config.label}</span>
              {opt.cost && <span className="font-medium text-primary">+{opt.cost}</span>}
            </div>
          );
        })}
      </div>
      {deliveryCost && (
        <p className="text-xs text-muted-foreground">
          Custo de entrega: <span className="font-medium text-foreground">{deliveryCost}</span>
        </p>
      )}
    </div>
  );
};

export default DeliveryInfo;
export type { DeliveryOption };
