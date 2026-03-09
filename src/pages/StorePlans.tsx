import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { Crown, Star, Shield, Check, Loader2 } from "lucide-react";

const PLANS = [
  {
    id: "bronze",
    name: "Bronze",
    price: 29.90,
    icon: Shield,
    color: "from-amber-700 to-amber-500",
    borderColor: "border-amber-500",
    bgColor: "bg-amber-500/10",
    features: [
      "Loja verificada com selo Bronze",
      "Até 30 produtos ativos",
      "Destaque básico na busca",
      "Suporte por chat",
    ],
  },
  {
    id: "prata",
    name: "Prata",
    price: 59.90,
    icon: Star,
    color: "from-slate-400 to-slate-300",
    borderColor: "border-slate-400",
    bgColor: "bg-slate-400/10",
    popular: true,
    features: [
      "Loja verificada com selo Prata",
      "Até 100 produtos ativos",
      "Destaque prioritário na busca",
      "Banner promocional na loja",
      "Relatórios de desempenho",
      "Suporte prioritário",
    ],
  },
  {
    id: "ouro",
    name: "Ouro",
    price: 99.90,
    icon: Crown,
    color: "from-yellow-500 to-yellow-300",
    borderColor: "border-yellow-500",
    bgColor: "bg-yellow-500/10",
    features: [
      "Loja verificada com selo Ouro",
      "Produtos ilimitados",
      "Destaque máximo na busca",
      "Banner promocional na loja",
      "Relatórios avançados",
      "Suporte VIP dedicado",
      "Destaque na página inicial",
      "Selo exclusivo de loja premium",
    ],
  },
];

const StorePlans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [cpf, setCpf] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStore, setLoadingStore] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchStore();
  }, [user]);

  const fetchStore = async () => {
    if (!user) return;
    setLoadingStore(true);
    const { data: storeData } = await supabase
      .from("stores")
      .select("id, name, slug")
      .eq("user_id", user.id)
      .single();

    if (storeData) {
      setStore(storeData);
      const { data: planData } = await supabase
        .from("store_plans")
        .select("plan_type, is_active")
        .eq("store_id", storeData.id)
        .single();

      if (planData?.is_active) {
        setCurrentPlan(planData.plan_type);
      }
    }
    setLoadingStore(false);
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    if (digits.length <= 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4").replace(/[.-]$/, "");
    }
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, "$1.$2.$3/$4-$5").replace(/[./-]$/, "");
  };

  const handleSubscribe = async (planId: string) => {
    if (!user || !store) return;
    if (!cpf || cpf.replace(/\D/g, "").length < 11) {
      toast.error("Informe um CPF/CNPJ válido.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("user_id", user.id)
      .single();

    setLoading(true);
    setSelectedPlan(planId);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-subscription", {
        body: {
          action: "create_subscription",
          store_id: store.id,
          plan_type: planId,
          customer_name: profile?.name || "Usuário",
          customer_email: profile?.email || user.email || "",
          customer_cpf: cpf.replace(/\D/g, ""),
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success(data.message || "Plano ativado com sucesso!");
      setCurrentPlan(planId);
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleCancel = async () => {
    if (!user || !store) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-subscription", {
        body: { action: "cancel_subscription", store_id: store.id },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("Plano cancelado.");
      setCurrentPlan("free");
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={!!user} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">👑 Planos Premium para Lojas</h1>
          <p className="text-muted-foreground">
            Destaque sua loja, venda mais e tenha acesso a recursos exclusivos.
          </p>
        </div>

        {loadingStore ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !store ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-foreground font-bold text-lg mb-2">Você ainda não tem uma loja</p>
            <p className="text-muted-foreground text-sm mb-4">Crie sua loja para poder assinar um plano premium.</p>
            <button
              onClick={() => navigate("/stores/create")}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:opacity-90"
            >
              Criar Loja
            </button>
          </div>
        ) : (
          <>
            {currentPlan !== "free" && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Plano atual</p>
                    <p className="text-lg font-bold text-foreground capitalize">{currentPlan}</p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="text-sm text-destructive hover:underline disabled:opacity-50"
                >
                  Cancelar plano
                </button>
              </div>
            )}

            {/* CPF input */}
            {currentPlan === "free" && (
              <div className="max-w-md mx-auto mb-8">
                <label className="block text-sm font-bold text-foreground mb-1">CPF/CNPJ para cobrança</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  className="w-full border border-border p-3 text-sm bg-card rounded-lg text-foreground"
                  placeholder="000.000.000-00"
                />
              </div>
            )}

            {/* Plans grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                const isCurrentPlan = currentPlan === plan.id;
                const isLoading = loading && selectedPlan === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-card border-2 rounded-2xl p-6 flex flex-col transition-all hover:shadow-lg ${
                      isCurrentPlan ? plan.borderColor : "border-border"
                    } ${plan.popular ? "md:-translate-y-2" : ""}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                        MAIS POPULAR
                      </div>
                    )}

                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <div className="mt-2 mb-4">
                      <span className="text-3xl font-bold text-foreground">
                        R$ {plan.price.toFixed(2).replace(".", ",")}
                      </span>
                      <span className="text-muted-foreground text-sm">/mês</span>
                    </div>

                    <ul className="space-y-2 mb-6 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {isCurrentPlan ? (
                      <div className="w-full py-3 rounded-lg font-bold text-center bg-muted text-muted-foreground">
                        Plano atual
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={loading || currentPlan !== "free"}
                        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : currentPlan !== "free" ? (
                          "Cancele o atual primeiro"
                        ) : (
                          "Assinar agora"
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-8">
              A cobrança é mensal via PIX. Você pode cancelar a qualquer momento.
            </p>
          </>
        )}
      </div>
      <FacebookFooter />
    </div>
  );
};

export default StorePlans;
