import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's token to get their ID
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to delete user data and auth account
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Delete user's data from various tables (cascade will handle some)
    const userId = user.id;

    // Delete posts
    await adminClient.from("posts").delete().eq("user_id", userId);
    
    // Delete comments
    await adminClient.from("comments").delete().eq("user_id", userId);
    
    // Delete messages (sent and received)
    await adminClient.from("messages").delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    
    // Delete marketplace items
    await adminClient.from("marketplace_items").delete().eq("user_id", userId);
    
    // Delete friendships
    await adminClient.from("friendships").delete().or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    
    // Delete followers
    await adminClient.from("followers").delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`);
    
    // Delete user settings
    await adminClient.from("user_settings").delete().eq("user_id", userId);
    
    // Delete user presence
    await adminClient.from("user_presence").delete().eq("user_id", userId);
    
    // Delete profile
    await adminClient.from("profiles").delete().eq("user_id", userId);

    // Finally, delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete account" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
