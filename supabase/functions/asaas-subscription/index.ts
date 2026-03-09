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

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "create_subscription") {
      const { store_id, plan_type, customer_name, customer_email, customer_cpf } = body;

      // Validate plan
      const plans: Record<string, { price: number; label: string }> = {
        bronze: { price: 29.90, label: "Plano Bronze" },
        prata: { price: 59.90, label: "Plano Prata" },
        ouro: { price: 99.90, label: "Plano Ouro" },
      };

      const plan = plans[plan_type];
      if (!plan) {
        return new Response(JSON.stringify({ error: "Plano inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Verify store ownership
      const { data: store } = await supabase.from("stores").select("id, user_id").eq("id", store_id).single();
      if (!store || store.user_id !== userId) {
        return new Response(JSON.stringify({ error: "Loja não encontrada ou sem permissão" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Find or create Asaas customer
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

      // Create Asaas subscription
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 1);

      const subRes = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
        method: "POST",
        headers: { "access_token": ASAAS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: customerId,
          billingType: "PIX",
          value: plan.price,
          nextDueDate: nextDue.toISOString().split("T")[0],
          cycle: "MONTHLY",
          description: `${plan.label} - Loja Premium - ConectadoEmSergipe`,
        }),
      });
      const subData = await subRes.json();

      if (subData.errors) {
        return new Response(JSON.stringify({ error: "Erro ao criar assinatura", details: subData.errors }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Update store_plans
      const { data: existingPlan } = await serviceClient
        .from("store_plans")
        .select("id")
        .eq("store_id", store_id)
        .single();

      const endsAt = new Date();
      endsAt.setMonth(endsAt.getMonth() + 1);

      if (existingPlan) {
        await serviceClient.from("store_plans").update({
          plan_type,
          is_active: true,
          starts_at: new Date().toISOString(),
          ends_at: endsAt.toISOString(),
        }).eq("id", existingPlan.id);
      } else {
        await serviceClient.from("store_plans").insert({
          store_id,
          plan_type,
          is_active: true,
          starts_at: new Date().toISOString(),
          ends_at: endsAt.toISOString(),
        });
      }

      // Save subscription reference in payments table
      await serviceClient.from("payments").insert({
        user_id: userId,
        asaas_payment_id: subData.id,
        amount: plan.price,
        credits: 0,
        payment_method: "PIX",
        status: "SUBSCRIPTION_ACTIVE",
      });

      return new Response(JSON.stringify({
        success: true,
        subscription_id: subData.id,
        plan_type,
        message: `${plan.label} ativado! A primeira cobrança será gerada em breve.`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "cancel_subscription") {
      const { store_id } = body;

      // Verify ownership
      const { data: store } = await supabase.from("stores").select("id, user_id").eq("id", store_id).single();
      if (!store || store.user_id !== userId) {
        return new Response(JSON.stringify({ error: "Sem permissão" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Deactivate plan
      await serviceClient.from("store_plans").update({
        plan_type: "free",
        is_active: false,
      }).eq("store_id", store_id);

      return new Response(JSON.stringify({ success: true, message: "Plano cancelado." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
