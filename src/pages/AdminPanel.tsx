import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";

interface BanRecord {
  id: string;
  user_id: string;
  banned_by: string;
  reason: string | null;
  banned_until: string;
  created_at: string;
  userName?: string;
  bannedByName?: string;
}

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { isAdmin, unbanUser } = useAdmin();
  const [bans, setBans] = useState<BanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "expired">("active");

  const fetchBans = async () => {
    setLoading(true);
    const now = new Date().toISOString();

    const query = tab === "active"
      ? supabase.from("bans").select("*").gte("banned_until", now).order("created_at", { ascending: false })
      : supabase.from("bans").select("*").lt("banned_until", now).order("created_at", { ascending: false });

    const { data } = await query;
    if (!data || data.length === 0) {
      setBans([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(data.flatMap((b: any) => [b.user_id, b.banned_by]))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.name]) || []);

    setBans(
      data.map((b: any) => ({
        ...b,
        userName: profileMap.get(b.user_id) || "Desconhecido",
        bannedByName: profileMap.get(b.banned_by) || "Admin",
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchBans();
  }, [isAdmin, tab]);

  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;

  const handleUnban = async (banId: string) => {
    await unbanUser(banId);
    fetchBans();
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={true} userName={user.name} onLogout={logout} />
      <div className="max-w-[760px] mx-auto px-2 py-3">
        <div className="bg-card border border-border p-3">
          <div className="border-b border-border pb-2 mb-3">
            <h2 className="text-[16px] font-bold text-primary" style={{ fontFamily: "Georgia, serif" }}>
              {t("admin.panel_title")}
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setTab("active")}
              className={`px-3 py-1 text-[11px] border cursor-pointer ${tab === "active" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}
            >
              {t("admin.active_bans")}
            </button>
            <button
              onClick={() => setTab("expired")}
              className={`px-3 py-1 text-[11px] border cursor-pointer ${tab === "expired" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}
            >
              {t("admin.expired_bans")}
            </button>
          </div>

          {loading ? (
            <p className="text-[11px] text-muted-foreground">{t("admin.loading")}</p>
          ) : bans.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">{t("admin.no_bans")}</p>
          ) : (
            <div className="space-y-2">
              {bans.map((ban) => (
                <div key={ban.id} className="border border-border p-2 text-[11px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p>
                        <b>{t("admin.banned_user")}:</b>{" "}
                        <span className="text-primary font-bold">{ban.userName}</span>
                      </p>
                      <p>
                        <b>{t("admin.banned_by_label")}:</b> {ban.bannedByName}
                      </p>
                      {ban.reason && (
                        <p>
                          <b>{t("admin.ban_reason")}:</b> {ban.reason}
                        </p>
                      )}
                      <p>
                        <b>{t("admin.banned_at")}:</b> {formatDate(ban.created_at)}
                      </p>
                      <p>
                        <b>{t("admin.banned_until_label")}:</b>{" "}
                        <span className={isExpired(ban.banned_until) ? "text-muted-foreground line-through" : "text-destructive font-bold"}>
                          {formatDate(ban.banned_until)}
                        </span>
                      </p>
                    </div>
                    {tab === "active" && (
                      <button
                        onClick={() => handleUnban(ban.id)}
                        className="bg-accent text-foreground border border-border px-2 py-1 text-[10px] cursor-pointer hover:bg-muted shrink-0"
                      >
                        {t("admin.unban")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default AdminPanel;
