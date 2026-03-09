import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import AdminPageEditor from "@/components/AdminPageEditor";
import AdminFooterImage from "@/components/AdminFooterImage";
import AdminCategoryManager from "@/components/AdminCategoryManager";
import AdminServiceManager from "@/components/AdminServiceManager";
import AdminHeaderOpacity from "@/components/AdminHeaderOpacity";
import AdminBadgeManager from "@/components/AdminBadgeManager";
import AdminModeratorManager from "@/components/AdminModeratorManager";
import AdminModerationLogs from "@/components/AdminModerationLogs";
import AdminBannerManager from "@/components/AdminBannerManager";
import AdminForbiddenWords from "@/components/AdminForbiddenWords";
import AdminProfileLinks from "@/components/AdminProfileLinks";
import AdminLoginSettings from "@/components/AdminLoginSettings";
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

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  content_type: string;
  content_id: string;
  reason: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  reporterName?: string;
  reportedName?: string;
}

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { isAdmin, adminLoading, unbanUser } = useAdmin();
  const [bans, setBans] = useState<BanRecord[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "expired" | "reports" | "pages" | "footer" | "badges" | "moderators" | "logs" | "banners" | "forbidden" | "categories" | "profile_links" | "services" | "login_settings">("active");
  const [reportTab, setReportTab] = useState<"pending" | "resolved">("pending");

  const fetchBans = async () => {
    setLoading(true);
    const now = new Date().toISOString();
    const query = tab === "active"
      ? supabase.from("bans").select("*").gte("banned_until", now).order("created_at", { ascending: false })
      : supabase.from("bans").select("*").lt("banned_until", now).order("created_at", { ascending: false });

    const { data } = await query;
    if (!data || data.length === 0) { setBans([]); setLoading(false); return; }

    const userIds = [...new Set(data.flatMap((b: any) => [b.user_id, b.banned_by]))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.name]) || []);

    setBans(data.map((b: any) => ({
      ...b,
      userName: profileMap.get(b.user_id) || "Desconhecido",
      bannedByName: profileMap.get(b.banned_by) || "Admin",
    })));
    setLoading(false);
  };

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reports")
      .select("*")
      .eq("status", reportTab === "pending" ? "pending" : "resolved")
      .order("created_at", { ascending: false }) as any;

    if (!data || data.length === 0) { setReports([]); setLoading(false); return; }

    const userIds = Array.from(new Set<string>(data.flatMap((r: any) => [r.reporter_id, r.reported_user_id])));
    const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.name]) || []);

    setReports(data.map((r: any) => ({
      ...r,
      reporterName: profileMap.get(r.reporter_id) || "Desconhecido",
      reportedName: profileMap.get(r.reported_user_id) || "Desconhecido",
    })));
    setLoading(false);
  };

  const resolveReport = async (reportId: string, status: string) => {
    await (supabase.from("reports").update({ status, resolved_at: new Date().toISOString() }).eq("id", reportId) as any);
    fetchReports();
  };

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "reports") fetchReports();
    else if (tab === "active" || tab === "expired") fetchBans();
  }, [isAdmin, tab, reportTab]);

  if (!user) return <Navigate to="/login" />;
  if (adminLoading) return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={true} userName={user.name} onLogout={logout} />
      <div className="max-w-[760px] mx-auto px-2 py-3">
        <p className="text-[11px] text-muted-foreground">{t("admin.loading")}</p>
      </div>
      <FacebookFooter />
    </div>
  );
  if (!isAdmin) return <Navigate to="/" />;

  const handleUnban = async (banId: string) => { await unbanUser(banId); fetchBans(); };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={true} userName={user.name} onLogout={logout} />
      <div className="max-w-[760px] mx-auto px-2 py-3 overflow-x-hidden">
        <div className="bg-card border border-border p-3 overflow-hidden">
          <div className="border-b border-border pb-2 mb-3">
            <h2 className="text-[16px] font-bold text-primary" style={{ fontFamily: "Georgia, serif" }}>
              {t("admin.panel_title")}
            </h2>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            <button onClick={() => setTab("active")}
              className={`px-2.5 py-1.5 text-[11px] border rounded cursor-pointer whitespace-nowrap ${tab === "active" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>
              {t("admin.active_bans")}
            </button>
            <button onClick={() => setTab("expired")}
              className={`px-2.5 py-1.5 text-[11px] border rounded cursor-pointer whitespace-nowrap ${tab === "expired" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>
              {t("admin.expired_bans")}
            </button>
            <button onClick={() => setTab("reports")}
              className={`px-2.5 py-1.5 text-[11px] border rounded cursor-pointer whitespace-nowrap ${tab === "reports" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>
              🚩 {t("admin.reports")}
            </button>
            <button onClick={() => setTab("pages")}
              className={`px-2.5 py-1.5 text-[11px] border rounded cursor-pointer whitespace-nowrap ${tab === "pages" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>
              {t("admin.pages_tab")}
            </button>
            <button onClick={() => setTab("footer")}
              className={`px-2.5 py-1.5 text-[11px] border rounded cursor-pointer whitespace-nowrap ${tab === "footer" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>
              🖼️ Banner
            </button>
            <button onClick={() => setTab("badges")}
              className={`px-2.5 py-1.5 text-[11px] border rounded cursor-pointer whitespace-nowrap ${tab === "badges" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>
              🏅 Selos
            </button>
            <button onClick={() => setTab("moderators")}
              className={`px-2.5 py-1.5 text-[11px] border rounded cursor-pointer whitespace-nowrap ${tab === "moderators" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>
              🤝 Colab.
            </button>
            <button onClick={() => setTab("logs")}
              className={`px-2.5 py-1.5 text-[11px] border rounded cursor-pointer whitespace-nowrap ${tab === "logs" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>
              📋 Logs
            </button>
            <button onClick={() => setTab("banners")}
              className={`px-2.5 py-1.5 text-[11px] border rounded cursor-pointer whitespace-nowrap ${tab === "banners" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>
              📢 Banners
            </button>
            <button onClick={() => setTab("forbidden")}
              className={`px-2.5 py-1.5 text-[11px] border rounded cursor-pointer whitespace-nowrap ${tab === "forbidden" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>
              🚫 Filtro
            </button>
            <button onClick={() => setTab("categories")}
              className={`px-2.5 py-1.5 text-[11px] border rounded cursor-pointer whitespace-nowrap ${tab === "categories" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>
              📂 Categorias
            </button>
            <button onClick={() => setTab("profile_links")}
              className={`px-2.5 py-1.5 text-[11px] border rounded cursor-pointer whitespace-nowrap ${tab === "profile_links" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>
              🔗 Links
            </button>
            <button onClick={() => setTab("services")}
              className={`px-2.5 py-1.5 text-[11px] border rounded cursor-pointer whitespace-nowrap ${tab === "services" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>
              🛠️ Serviços
            </button>
            <button onClick={() => setTab("login_settings")}
              className={`px-2.5 py-1.5 text-[11px] border rounded cursor-pointer whitespace-nowrap ${tab === "login_settings" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>
              🔐 Login
            </button>
          </div>

          {tab === "reports" && (
            <div className="flex gap-2 mb-3">
              <button onClick={() => setReportTab("pending")}
                className={`px-2 py-[2px] text-[10px] border cursor-pointer ${reportTab === "pending" ? "bg-destructive text-destructive-foreground border-destructive" : "bg-card text-foreground border-border hover:bg-accent"}`}>
                {t("admin.pending_reports")}
              </button>
              <button onClick={() => setReportTab("resolved")}
                className={`px-2 py-[2px] text-[10px] border cursor-pointer ${reportTab === "resolved" ? "bg-muted text-foreground border-border" : "bg-card text-foreground border-border hover:bg-accent"}`}>
                {t("admin.resolved_reports")}
              </button>
            </div>
          )}

          {loading && tab !== "pages" && tab !== "footer" && tab !== "badges" && tab !== "moderators" && tab !== "logs" && tab !== "banners" && tab !== "forbidden" && tab !== "categories" && tab !== "profile_links" && tab !== "services" ? (
            <p className="text-[11px] text-muted-foreground">{t("admin.loading")}</p>
          ) : tab === "services" ? (
            <AdminServiceManager />
          ) : tab === "profile_links" ? (
            <AdminProfileLinks />
          ) : tab === "categories" ? (
            <AdminCategoryManager />
          ) : tab === "forbidden" ? (
            <AdminForbiddenWords />
          ) : tab === "banners" ? (
            <AdminBannerManager />
          ) : tab === "logs" ? (
            <AdminModerationLogs />
          ) : tab === "moderators" ? (
            <AdminModeratorManager />
          ) : tab === "badges" ? (
            <AdminBadgeManager />
          ) : tab === "footer" ? (
            <div>
              <AdminFooterImage />
              <AdminHeaderOpacity />
            </div>
          ) : tab === "pages" ? (
            <AdminPageEditor />
          ) : tab === "reports" ? (
            reports.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">{t("admin.no_reports")}</p>
            ) : (
              <div className="space-y-2">
                {reports.map((report) => (
                  <div key={report.id} className="border border-border p-2 text-[11px]">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p><b>{t("admin.report_by")}:</b> {report.reporterName}</p>
                        <p><b>{t("admin.banned_user")}:</b> <span className="text-destructive font-bold">{report.reportedName}</span></p>
                        <p><b>{t("admin.report_reason")}:</b> <span className="text-destructive">{report.reason}</span></p>
                        <p><b>{t("admin.report_content_type")}:</b> {report.content_type}</p>
                        <p><b>{t("admin.report_date")}:</b> {formatDate(report.created_at)}</p>
                      </div>
                      {report.status === "pending" && (
                        <div className="flex flex-col gap-1 shrink-0">
                          <button onClick={() => resolveReport(report.id, "resolved")}
                            className="bg-primary text-primary-foreground border-none px-2 py-1 text-[10px] cursor-pointer hover:opacity-90">
                            {t("admin.resolve_report")}
                          </button>
                          <button onClick={() => resolveReport(report.id, "dismissed")}
                            className="bg-muted text-foreground border border-border px-2 py-1 text-[10px] cursor-pointer hover:opacity-90">
                            {t("admin.dismiss_report")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : bans.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">{t("admin.no_bans")}</p>
          ) : (
            <div className="space-y-2">
              {bans.map((ban) => (
                <div key={ban.id} className="border border-border p-2 text-[11px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p><b>{t("admin.banned_user")}:</b> <span className="text-primary font-bold">{ban.userName}</span></p>
                      <p><b>{t("admin.banned_by_label")}:</b> {ban.bannedByName}</p>
                      {ban.reason && <p><b>{t("admin.ban_reason")}:</b> {ban.reason}</p>}
                      <p><b>{t("admin.banned_at")}:</b> {formatDate(ban.created_at)}</p>
                      <p><b>{t("admin.banned_until_label")}:</b>{" "}
                        <span className={isExpired(ban.banned_until) ? "text-muted-foreground line-through" : "text-destructive font-bold"}>
                          {formatDate(ban.banned_until)}
                        </span>
                      </p>
                    </div>
                    {tab === "active" && (
                      <button onClick={() => handleUnban(ban.id)}
                        className="bg-accent text-foreground border border-border px-2 py-1 text-[10px] cursor-pointer hover:bg-muted shrink-0">
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
