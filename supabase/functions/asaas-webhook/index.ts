import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook token
    const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    const authToken = req.headers.get("asaas-access-token");
    if (webhookToken && authToken !== webhookToken) {
      console.error("Invalid webhook token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { event, payment } = body;

    if (!event || !payment) {
      return new Response(JSON.stringify({ error: "Invalid webhook payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const asaasPaymentId = payment.id;
    const status = payment.status;

    console.log(`Webhook event: ${event}, payment: ${asaasPaymentId}, status: ${status}`);

    // Handle subscription events
    if (event.startsWith("PAYMENT_") && payment.subscription) {
      // This is a subscription payment - find by subscription ID
      const subscriptionId = payment.subscription;
      
      const { data: paymentRecord } = await supabase
        .from("payments")
        .select("id, user_id, credits, status")
        .eq("asaas_payment_id", subscriptionId)
        .single();

      if (paymentRecord) {
        // Update subscription payment status
        await supabase
          .from("payments")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("asaas_payment_id", subscriptionId);

        // Handle subscription renewal confirmed
        if (status === "CONFIRMED" || status === "RECEIVED") {
          // Extend the store plan by 1 month
          const { data: storePlan } = await supabase
            .from("store_plans")
            .select("id, store_id, ends_at")
            .eq("store_id", (await supabase.from("stores").select("id").eq("user_id", paymentRecord.user_id).single()).data?.id)
            .single();

          if (storePlan) {
            const newEndsAt = new Date(storePlan.ends_at || new Date());
            if (newEndsAt < new Date()) newEndsAt.setTime(Date.now());
            newEndsAt.setMonth(newEndsAt.getMonth() + 1);

            await supabase.from("store_plans").update({
              is_active: true,
              ends_at: newEndsAt.toISOString(),
            }).eq("id", storePlan.id);

            console.log(`Subscription renewed for store ${storePlan.store_id} until ${newEndsAt.toISOString()}`);
          }
        }

        // Handle subscription payment overdue/failed
        if (status === "OVERDUE" || status === "REFUNDED") {
          const { data: store } = await supabase
            .from("stores")
            .select("id")
            .eq("user_id", paymentRecord.user_id)
            .single();

          if (store) {
            await supabase.from("store_plans").update({
              is_active: false,
              plan_type: "free",
            }).eq("store_id", store.id);

            console.log(`Subscription deactivated for store ${store.id} due to ${status}`);
          }
        }
      }
    }

    // Standard one-time payment handling
    const { data: paymentRecord } = await supabase
      .from("payments")
      .select("id, user_id, credits, status")
      .eq("asaas_payment_id", asaasPaymentId)
      .single();

    if (!paymentRecord) {
      return new Response(JSON.stringify({ message: "Payment not found, ignoring" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status
    await supabase
      .from("payments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("asaas_payment_id", asaasPaymentId);

    // If payment confirmed/received and not already credited
    const confirmedStatuses = ["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"];
    const alreadyCredited = confirmedStatuses.includes(paymentRecord.status);

    if (confirmedStatuses.includes(status) && !alreadyCredited && paymentRecord.credits > 0) {
      const { data: existingCredits } = await supabase
        .from("ad_credits")
        .select("balance")
        .eq("user_id", paymentRecord.user_id)
        .single();

      if (existingCredits) {
        await supabase
          .from("ad_credits")
          .update({
            balance: existingCredits.balance + paymentRecord.credits,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", paymentRecord.user_id);
      } else {
        await supabase.from("ad_credits").insert({
          user_id: paymentRecord.user_id,
          balance: paymentRecord.credits,
        });
      }

      console.log(`Credits added: ${paymentRecord.credits} for user ${paymentRecord.user_id}`);
    }

    // Handle refund/chargeback - remove credits
    if (status === "REFUNDED" || status === "CHARGEBACK") {
      if (paymentRecord.credits > 0) {
        const { data: existingCredits } = await supabase
          .from("ad_credits")
          .select("balance")
          .eq("user_id", paymentRecord.user_id)
          .single();

        if (existingCredits) {
          const newBalance = Math.max(0, existingCredits.balance - paymentRecord.credits);
          await supabase
            .from("ad_credits")
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq("user_id", paymentRecord.user_id);
        }
      }

      console.log(`Credits removed (${status}): ${paymentRecord.credits} for user ${paymentRecord.user_id}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
