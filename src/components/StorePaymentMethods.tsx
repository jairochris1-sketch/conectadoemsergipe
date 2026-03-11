import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, X, Plus, Check } from "lucide-react";

const AVAILABLE_METHODS = [
  { id: "pix", label: "Pix", icon: "💸" },
  { id: "dinheiro", label: "Dinheiro", icon: "💵" },
  { id: "credito", label: "Cartão de Crédito", icon: "💳" },
  { id: "debito", label: "Cartão de Débito", icon: "💳" },
  { id: "boleto", label: "Boleto", icon: "📄" },
  { id: "transferencia", label: "Transferência Bancária", icon: "🏦" },
  { id: "picpay", label: "PicPay", icon: "📱" },
  { id: "parcelado", label: "Parcelamento", icon: "📊" },
];

interface Props {
  storeId: string;
  currentMethods: string[];
  onUpdate: () => void;
  readOnly?: boolean;
}

const StorePaymentMethods = ({ storeId, currentMethods, onUpdate, readOnly = false }: Props) => {
  const [methods, setMethods] = useState<string[]>(currentMethods || []);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleMethod = (id: string) => {
    setMethods(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("stores")
      .update({ payment_methods: methods } as any)
      .eq("id", storeId);

    if (error) {
      toast.error("Erro ao salvar");
    } else {
      toast.success("Formas de pagamento atualizadas!");
      setEditing(false);
      onUpdate();
    }
    setSaving(false);
  };

  if (readOnly) {
    if (!methods.length) return null;
    return (
      <div className="mt-3">
        <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5" /> Formas de Pagamento
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {methods.map(id => {
            const method = AVAILABLE_METHODS.find(m => m.id === id);
            if (!method) return null;
            return (
              <span key={id} className="inline-flex items-center gap-1 bg-accent text-foreground text-[11px] px-2.5 py-1 rounded-full">
                {method.icon} {method.label}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-primary" /> Formas de Pagamento
        </h4>
        {!editing && (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="text-xs h-7 gap-1">
            <Plus className="w-3 h-3" /> Editar
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {AVAILABLE_METHODS.map(m => {
              const selected = methods.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleMethod(m.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-all ${
                    selected
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <span>{m.icon}</span>
                  <span className="flex-1 text-left">{m.label}</span>
                  {selected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setMethods(currentMethods || []); }}>Cancelar</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {methods.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma forma de pagamento configurada</p>
          ) : (
            methods.map(id => {
              const method = AVAILABLE_METHODS.find(m => m.id === id);
              if (!method) return null;
              return (
                <span key={id} className="inline-flex items-center gap-1 bg-accent text-foreground text-[11px] px-2.5 py-1 rounded-full">
                  {method.icon} {method.label}
                </span>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default StorePaymentMethods;
