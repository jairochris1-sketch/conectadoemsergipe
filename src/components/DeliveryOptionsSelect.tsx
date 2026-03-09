import { useState } from "react";
import { Package, Truck, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DeliveryOption {
  type: "pickup" | "local" | "shipping";
  cost?: string;
}

interface DeliveryOptionsSelectProps {
  value: DeliveryOption[];
  onChange: (options: DeliveryOption[]) => void;
  deliveryCost: string;
  onDeliveryCostChange: (cost: string) => void;
}

const OPTIONS = [
  { type: "pickup" as const, label: "Retirada no local", icon: MapPin },
  { type: "local" as const, label: "Entrega local", icon: Truck },
  { type: "shipping" as const, label: "Envio por transportadora/correios", icon: Package },
];

const DeliveryOptionsSelect = ({ value, onChange, deliveryCost, onDeliveryCostChange }: DeliveryOptionsSelectProps) => {
  const isSelected = (type: string) => value.some((o) => o.type === type);

  const toggleOption = (type: "pickup" | "local" | "shipping") => {
    if (isSelected(type)) {
      onChange(value.filter((o) => o.type !== type));
    } else {
      onChange([...value, { type }]);
    }
  };

  const showCostInput = value.some((o) => o.type === "local" || o.type === "shipping");

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Opções de entrega</label>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const selected = isSelected(opt.type);
          return (
            <button
              key={opt.type}
              type="button"
              onClick={() => toggleOption(opt.type)}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors ${
                selected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-accent"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {opt.label}
            </button>
          );
        })}
      </div>
      {showCostInput && (
        <div>
          <label className="text-xs text-muted-foreground">Custo de entrega (opcional)</label>
          <Input
            value={deliveryCost}
            onChange={(e) => onDeliveryCostChange(e.target.value)}
            placeholder="Ex: R$ 10,00 ou Grátis"
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
};

export default DeliveryOptionsSelect;
export type { DeliveryOption };
