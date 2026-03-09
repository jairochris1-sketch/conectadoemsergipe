import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY")!;
const ASAAS_BASE_URL = "https://api.asaas.com/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const { action } = body;

    if (action === "create_payment") {
      const { amount, credits, payment_method, customer_name, customer_email, customer_cpf } = body;

      // 1. Find or create customer in Asaas
      let customerId: string;

      const searchRes = await fetch(`${ASAAS_BASE_URL}/customers?email=${encodeURIComponent(customer_email)}`, {
        headers: { "access_token": ASAAS_API_KEY },
      });
      const searchData = await searchRes.json();

      if (searchData.data && searchData.data.length > 0) {
        customerId = searchData.data[0].id;
      } else {
        const createRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
          method: "POST",
          headers: { "access_token": ASAAS_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ name: customer_name, email: customer_email, cpfCnpj: customer_cpf }),
        });
        const createData = await createRes.json();
        if (createData.errors) {
          return new Response(JSON.stringify({ error: "Erro ao criar cliente", details: createData.errors }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        customerId = createData.id;
      }

      // 2. Create payment
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      const billingType = payment_method === "PIX" ? "PIX" : payment_method === "BOLETO" ? "BOLETO" : "CREDIT_CARD";

      const paymentRes = await fetch(`${ASAAS_BASE_URL}/payments`, {
        method: "POST",
        headers: { "access_token": ASAAS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: customerId,
          billingType,
          value: amount,
          dueDate: dueDate.toISOString().split("T")[0],
          description: `Compra de ${credits} créditos - ConectadoEmSergipe`,
        }),
      });
      const paymentData = await paymentRes.json();

      if (paymentData.errors) {
        return new Response(JSON.stringify({ error: "Erro ao criar pagamento", details: paymentData.errors }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let pixQrCode = null;
      let pixCopyPaste = null;

      // 3. Get PIX QR code if PIX
      if (billingType === "PIX") {
        const pixRes = await fetch(`${ASAAS_BASE_URL}/payments/${paymentData.id}/pixQrCode`, {
          headers: { "access_token": ASAAS_API_KEY },
        });
        const pixData = await pixRes.json();
        pixQrCode = pixData.encodedImage || null;
        pixCopyPaste = pixData.payload || null;
      }

      // 4. Save payment to DB using service role
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await serviceClient.from("payments").insert({
        user_id: userId,
        asaas_payment_id: paymentData.id,
        amount,
        credits,
        payment_method: billingType,
        status: paymentData.status || "PENDING",
        pix_qr_code: pixQrCode,
        pix_copy_paste: pixCopyPaste,
        boleto_url: paymentData.bankSlipUrl || null,
        invoice_url: paymentData.invoiceUrl || null,
      });

      return new Response(JSON.stringify({
        success: true,
        payment_id: paymentData.id,
        status: paymentData.status,
        invoice_url: paymentData.invoiceUrl,
        boleto_url: paymentData.bankSlipUrl,
        pix_qr_code: pixQrCode,
        pix_copy_paste: pixCopyPaste,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "check_status") {
      const { payment_id } = body;

      const statusRes = await fetch(`${ASAAS_BASE_URL}/payments/${payment_id}`, {
        headers: { "access_token": ASAAS_API_KEY },
      });
      const statusData = await statusRes.json();

      // Update in DB
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await serviceClient.from("payments").update({
        status: statusData.status,
        updated_at: new Date().toISOString(),
      }).eq("asaas_payment_id", payment_id);

      // If confirmed, add credits
      if (statusData.status === "CONFIRMED" || statusData.status === "RECEIVED") {
        const { data: payment } = await serviceClient
          .from("payments")
          .select("user_id, credits")
          .eq("asaas_payment_id", payment_id)
          .single();

        if (payment) {
          const { data: existing } = await serviceClient
            .from("ad_credits")
            .select("balance")
            .eq("user_id", payment.user_id)
            .single();

          if (existing) {
            await serviceClient.from("ad_credits").update({
              balance: existing.balance + payment.credits,
              updated_at: new Date().toISOString(),
            }).eq("user_id", payment.user_id);
          } else {
            await serviceClient.from("ad_credits").insert({
              user_id: payment.user_id,
              balance: payment.credits,
            });
          }
        }
      }

      return new Response(JSON.stringify({ status: statusData.status }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
