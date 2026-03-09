import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const usePriceAlert = (itemId?: string, itemType: string = "marketplace_item") => {
  const { user } = useAuth();
  const [hasAlert, setHasAlert] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAlert = useCallback(async () => {
    if (!user || !itemId) { setLoading(false); return; }

    const { count } = await supabase
      .from("price_alerts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("item_id", itemId);

    setHasAlert((count || 0) > 0);
    setLoading(false);
  }, [user, itemId]);

  useEffect(() => { checkAlert(); }, [checkAlert]);

  const createAlert = async (originalPrice: number) => {
    if (!user || !itemId) return false;

    const { error } = await supabase.from("price_alerts").insert({
      user_id: user.id,
      item_id: itemId,
      item_type: itemType,
      original_price: originalPrice,
    } as any);

    if (!error) {
      setHasAlert(true);
      return true;
    }
    return false;
  };

  const removeAlert = async () => {
    if (!user || !itemId) return false;

    const { error } = await supabase
      .from("price_alerts")
      .delete()
      .eq("user_id", user.id)
      .eq("item_id", itemId);

    if (!error) {
      setHasAlert(false);
      return true;
    }
    return false;
  };

  return { hasAlert, loading, createAlert, removeAlert };
};

export const useUserPriceAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from("price_alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setAlerts(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return { alerts, loading };
};
