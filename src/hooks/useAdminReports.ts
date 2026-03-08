import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";

export const useAdminReports = () => {
  const { isAdmin } = useAdmin();
  const [pendingCount, setPendingCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!isAdmin) { setPendingCount(0); return; }
    const { count } = await supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    setPendingCount(count || 0);
  }, [isAdmin]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("admin-reports-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        () => {
          toast.warning("🚩 Nova denúncia recebida!", {
            description: "Verifique o painel de administração.",
            action: { label: "Ver", onClick: () => window.location.assign("/admin?tab=reports") },
          });
          refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports" },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "reports" },
        () => refresh()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, refresh]);

  return { pendingCount, refresh };
};
