import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { CreditCard, QrCode, FileText, Coins, Copy, Check, RefreshCw, History, Clock } from "lucide-react";
import { validateCPFOrCNPJ } from "@/lib/cpfCnpjValidator";

const CREDIT_PACKAGES = [
  { credits: 50, price: 5, label: "50 créditos" },
  { credits: 100, price: 9, label: "100 créditos" },
  { credits: 250, price: 19, label: "250 créditos" },
  { credits: 500, price: 35, label: "500 créditos" },
  { credits: 1000, price: 59, label: "1.000 créditos" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-600" },
  CONFIRMED: { label: "Confirmado", color: "bg-green-500/10 text-green-600" },
  RECEIVED: { label: "Recebido", color: "bg-green-500/10 text-green-600" },
  RECEIVED_IN_CASH: { label: "Recebido", color: "bg-green-500/10 text-green-600" },
  OVERDUE: { label: "Vencido", color: "bg-red-500/10 text-red-600" },
  REFUNDED: { label: "Reembolsado", color: "bg-blue-500/10 text-blue-600" },
  CHARGEBACK: { label: "Estornado", color: "bg-red-500/10 text-red-600" },
  SUBSCRIPTION_ACTIVE: { label: "Assinatura", color: "bg-purple-500/10 text-purple-600" },
};

const BuyCredits = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPkg, setSelectedPkg] = useState(CREDIT_PACKAGES[1]);
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "BOLETO">("PIX");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchBalance();
    fetchPayments();
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;
    const { data } = await supabase.from("ad_credits").select("balance").eq("user_id", user.id).single();
    setBalance(data?.balance ?? 0);
  };

  const fetchPayments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setPayments(data || []);
  };

  const handlePayment = async () => {
    if (!user) return;
    if (!cpf || cpf.replace(/\D/g, "").length < 11) {
      toast.error("Informe um CPF/CNPJ válido.");
      return;
    }
    const { valid, type } = validateCPFOrCNPJ(cpf);
    if (!valid) {
      toast.error(type === "unknown" ? "CPF deve ter 11 dígitos ou CNPJ 14 dígitos." : `${type.toUpperCase()} inválido. Verifique os dígitos.`);
      return;
    }

    const { data: profileData } = await supabase.from("profiles").select("name, email").eq("user_id", user.id).single();

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-payment", {
        body: {
          action: "create_payment",
          amount: selectedPkg.price,
          credits: selectedPkg.credits,
          payment_method: paymentMethod,
          customer_name: profileData?.name || "Usuário",
          customer_email: profileData?.email || user.email || "",
          customer_cpf: cpf.replace(/\D/g, ""),
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setPaymentResult(data);
      toast.success("Pagamento criado com sucesso!");
      fetchPayments();
    } catch (err: any) {
      toast.error("Erro ao criar pagamento: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!paymentResult?.payment_id) return;
    setCheckingStatus(true);
    try {
      const { data } = await supabase.functions.invoke("asaas-payment", {
        body: { action: "check_status", payment_id: paymentResult.payment_id },
      });
      if (data?.status === "CONFIRMED" || data?.status === "RECEIVED") {
        toast.success("Pagamento confirmado! Créditos adicionados.");
        setPaymentResult(null);
        fetchBalance();
        fetchPayments();
      } else {
        toast.info(`Status: ${data?.status || "PENDENTE"}`);
      }
    } catch {
      toast.error("Erro ao verificar status.");
    } finally {
      setCheckingStatus(false);
    }
  };

  const copyPix = () => {
    if (paymentResult?.pix_copy_paste) {
      navigator.clipboard.writeText(paymentResult.pix_copy_paste);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    if (digits.length <= 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4").replace(/[.-]$/, "");
    }
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, "$1.$2.$3/$4-$5").replace(/[./-]$/, "");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={!!user} />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">💰 Comprar Créditos</h1>
        <p className="text-muted-foreground text-sm mb-4">
          Use créditos para impulsionar produtos e ativar planos premium para sua loja.
        </p>

        {balance !== null && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 flex items-center gap-3">
            <Coins className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Saldo atual</p>
              <p className="text-xl font-bold text-foreground">{balance} créditos</p>
            </div>
          </div>
        )}

        {!paymentResult ? (
          <>
            {/* Package selection */}
            <h2 className="text-base font-bold text-foreground mb-3">Escolha um pacote</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {CREDIT_PACKAGES.map((pkg) => (
                <button
                  key={pkg.credits}
                  onClick={() => setSelectedPkg(pkg)}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    selectedPkg.credits === pkg.credits
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <p className="text-lg font-bold text-foreground">{pkg.label}</p>
                  <p className="text-primary font-bold text-xl mt-1">R$ {pkg.price}</p>
                </button>
              ))}
            </div>

            {/* Payment method */}
            <h2 className="text-base font-bold text-foreground mb-3">Forma de pagamento</h2>
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setPaymentMethod("PIX")}
                className={`flex-1 p-4 rounded-lg border-2 flex items-center gap-3 transition-all ${
                  paymentMethod === "PIX" ? "border-primary bg-primary/10" : "border-border bg-card"
                }`}
              >
                <QrCode className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="font-bold text-foreground">PIX</p>
                  <p className="text-xs text-muted-foreground">Aprovação instantânea</p>
                </div>
              </button>
              <button
                onClick={() => setPaymentMethod("BOLETO")}
                className={`flex-1 p-4 rounded-lg border-2 flex items-center gap-3 transition-all ${
                  paymentMethod === "BOLETO" ? "border-primary bg-primary/10" : "border-border bg-card"
                }`}
              >
                <FileText className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="font-bold text-foreground">Boleto</p>
                  <p className="text-xs text-muted-foreground">1-3 dias úteis</p>
                </div>
              </button>
            </div>

            {/* CPF */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-foreground mb-1">CPF/CNPJ</label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                className="w-full border border-border p-3 text-sm bg-card rounded-lg text-foreground"
                placeholder="000.000.000-00"
              />
            </div>

            {/* Summary */}
            <div className="bg-accent rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pacote:</span>
                <span className="font-bold text-foreground">{selectedPkg.label}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Método:</span>
                <span className="font-bold text-foreground">{paymentMethod}</span>
              </div>
              <div className="flex justify-between text-base mt-2 pt-2 border-t border-border">
                <span className="font-bold text-foreground">Total:</span>
                <span className="font-bold text-primary text-lg">R$ {selectedPkg.price},00</span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold text-base hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              {loading ? "Processando..." : "Gerar Pagamento"}
            </button>
          </>
        ) : (
          /* Payment result */
          <div className="space-y-4">
            <div className="bg-accent rounded-lg p-5 text-center">
              <p className="text-lg font-bold text-foreground mb-2">Pagamento criado!</p>
              <p className="text-sm text-muted-foreground">
                {paymentMethod === "PIX" ? "Escaneie o QR Code ou copie o código PIX abaixo." : "Clique no link para abrir o boleto."}
              </p>
            </div>

            {paymentResult.pix_qr_code && (
              <div className="flex flex-col items-center gap-4">
                <img
                  src={`data:image/png;base64,${paymentResult.pix_qr_code}`}
                  alt="QR Code PIX"
                  className="w-48 h-48 border border-border rounded-lg"
                />
                <button
                  onClick={copyPix}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:opacity-90"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? "Copiado!" : "Copiar código PIX"}
                </button>
              </div>
            )}

            {paymentResult.boleto_url && (
              <a
                href={paymentResult.boleto_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold text-center hover:opacity-90"
              >
                📄 Abrir Boleto
              </a>
            )}

            {paymentResult.invoice_url && (
              <a
                href={paymentResult.invoice_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-sm text-primary underline"
              >
                Ver fatura completa
              </a>
            )}

            <button
              onClick={checkStatus}
              disabled={checkingStatus}
              className="w-full bg-muted text-foreground border border-border py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${checkingStatus ? 'animate-spin' : ''}`} />
              {checkingStatus ? "Verificando..." : "Verificar pagamento"}
            </button>

            <button
              onClick={() => setPaymentResult(null)}
              className="w-full text-sm text-muted-foreground hover:underline"
            >
              ← Voltar para pacotes
            </button>
          </div>
        )}

        {/* Payment History */}
        <div className="mt-8 border-t border-border pt-6">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-foreground font-bold text-base mb-4 hover:text-primary transition-colors"
          >
            <History className="w-5 h-5" />
            Histórico de pagamentos
            <span className="text-xs text-muted-foreground ml-1">({payments.length})</span>
          </button>

          {showHistory && (
            <div className="space-y-3">
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum pagamento realizado ainda.</p>
              ) : (
                payments.map((p) => {
                  const statusInfo = STATUS_LABELS[p.status] || { label: p.status, color: "bg-muted text-muted-foreground" };
                  return (
                    <div key={p.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground text-sm">
                            {p.credits > 0 ? `${p.credits} créditos` : "Assinatura"}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(p.created_at)}
                          <span className="mx-1">•</span>
                          {p.payment_method}
                        </div>
                      </div>
                      <p className="font-bold text-foreground text-sm whitespace-nowrap">
                        R$ {Number(p.amount).toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default BuyCredits;
