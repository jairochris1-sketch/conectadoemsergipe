import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminPageEditor from "@/components/AdminPageEditor";

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  content_type: string;
  content_id: string;
  reason: string;
  status: string;
  created_at: string;
  reporterName?: string;
  reportedName?: string;
}

interface ReportedPost {
  id: string;
  content: string;
  image_url: string | null;
  user_id: string;
  created_at: string;
  userName?: string;
}

interface MarketplaceItem {
  id: string;
  title: string;
  price: string;
  image_url: string | null;
  user_id: string;
  category: string;
  userName?: string;
}

const ModeratorPanel = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"reports" | "posts" | "marketplace" | "pages">("reports");
  const [reports, setReports] = useState<Report[]>([]);
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [reportTab, setReportTab] = useState<"pending" | "resolved">("pending");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      (supabase.rpc as any)("has_role", { _user_id: user.id, _role: "moderator" }),
      (supabase.rpc as any)("has_role", { _user_id: user.id, _role: "admin" }),
    ]).then(([modRes, adminRes]) => {
      setIsModerator(!!modRes.data || !!adminRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const fetchReports = async () => {
    setDataLoading(true);
    const { data } = await supabase
      .from("reports")
      .select("*")
      .eq("status", reportTab === "pending" ? "pending" : "resolved")
      .order("created_at", { ascending: false }) as any;

    if (!data || data.length === 0) { setReports([]); setDataLoading(false); return; }

    const userIds = Array.from(new Set<string>(data.flatMap((r: any) => [r.reporter_id, r.reported_user_id])));
    const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.name]) || []);

    setReports(data.map((r: any) => ({
      ...r,
      reporterName: profileMap.get(r.reporter_id) || "Desconhecido",
      reportedName: profileMap.get(r.reported_user_id) || "Desconhecido",
    })));
    setDataLoading(false);
  };

  const fetchReportedPosts = async () => {
    setDataLoading(true);
    // Get post IDs from pending reports
    const { data: reportData } = await supabase
      .from("reports")
      .select("content_id")
      .eq("status", "pending")
      .eq("content_type", "post") as any;

    if (!reportData || reportData.length === 0) { setReportedPosts([]); setDataLoading(false); return; }

    const postIds = [...new Set(reportData.map((r: any) => r.content_id))] as string[];
    const { data: posts } = await supabase.from("posts").select("*").in("id", postIds);

    if (!posts || posts.length === 0) { setReportedPosts([]); setDataLoading(false); return; }

    const userIds = [...new Set(posts.map(p => p.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

    setReportedPosts(posts.map(p => ({
      ...p,
      userName: profileMap.get(p.user_id) || "Desconhecido",
    })));
    setDataLoading(false);
  };

  const fetchMarketplaceItems = async () => {
    setDataLoading(true);
    const { data: items } = await supabase
      .from("marketplace_items")
      .select("id, title, price, image_url, user_id, category")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!items || items.length === 0) { setMarketplaceItems([]); setDataLoading(false); return; }

    const userIds = [...new Set(items.map(i => i.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

    setMarketplaceItems(items.map(i => ({
      ...i,
      userName: profileMap.get(i.user_id) || "Desconhecido",
    })));
    setDataLoading(false);
  };

  const logAction = async (actionType: string, targetType: string, targetId: string, targetOwnerId?: string, details?: string) => {
    if (!user) return;
    await supabase.from("moderation_logs" as any).insert({
      moderator_id: user.id,
      action_type: actionType,
      target_type: targetType,
      target_id: targetId,
      target_owner_id: targetOwnerId || null,
      details: details || null,
    } as any);
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Tem certeza que deseja remover este post?")) return;
    const post = reportedPosts.find(p => p.id === postId);
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) { toast.error("Erro ao remover post"); return; }
    await logAction("delete_post", "post", postId, post?.user_id, `Post de ${post?.userName}: "${post?.content.substring(0, 80)}..."`);
    toast.success("Post removido!");
    setReportedPosts(prev => prev.filter(p => p.id !== postId));
  };

  const deleteMarketplaceItem = async (itemId: string) => {
    if (!confirm("Tem certeza que deseja remover este anúncio?")) return;
    const item = marketplaceItems.find(i => i.id === itemId);
    const { error } = await supabase.from("marketplace_items").delete().eq("id", itemId);
    if (error) { toast.error("Erro ao remover anúncio"); return; }
    await logAction("delete_item", "marketplace_item", itemId, item?.user_id, `Anúncio: "${item?.title}" - ${item?.price}`);
    toast.success("Anúncio removido!");
    setMarketplaceItems(prev => prev.filter(i => i.id !== itemId));
  };

  const resolveReport = async (reportId: string, status: string) => {
    const report = reports.find(r => r.id === reportId);
    await (supabase.from("reports").update({ status, resolved_at: new Date().toISOString() }).eq("id", reportId) as any);
    await logAction(status === "resolved" ? "resolve_report" : "dismiss_report", "report", reportId, report?.reported_user_id, `Denúncia de ${report?.reporterName} contra ${report?.reportedName}: ${report?.reason}`);
    toast.success(status === "resolved" ? "Denúncia resolvida" : "Denúncia dispensada");
    fetchReports();
  };

  useEffect(() => {
    if (!isModerator || loading) return;
    if (tab === "reports") fetchReports();
    else if (tab === "posts") fetchReportedPosts();
    else if (tab === "marketplace") fetchMarketplaceItems();
  }, [isModerator, loading, tab, reportTab]);

  if (!user) return <Navigate to="/login" />;
  if (loading) return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={true} userName={user.name} onLogout={logout} />
      <div className="max-w-[760px] mx-auto px-2 py-3">
        <p className="text-[11px] text-muted-foreground">Carregando...</p>
      </div>
      <FacebookFooter />
    </div>
  );
  if (!isModerator) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={true} userName={user.name} onLogout={logout} />
      <div className="max-w-[760px] mx-auto px-2 py-3">
        <div className="bg-card border border-border p-3">
          <div className="border-b border-border pb-2 mb-3">
            <h2 className="text-[16px] font-bold text-primary" style={{ fontFamily: "Georgia, serif" }}>
              🤝 Painel do Colaborador
            </h2>
            <p className="text-[10px] text-muted-foreground mt-1">Modere conteúdo denunciado e mantenha a comunidade segura.</p>
          </div>

          <div className="flex gap-2 mb-3 flex-wrap">
            <button onClick={() => setTab("reports")}
              className={`px-3 py-1 text-[11px] border cursor-pointer ${tab === "reports" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>
              🚩 Denúncias
            </button>
            <button onClick={() => setTab("posts")}
              className={`px-3 py-1 text-[11px] border cursor-pointer ${tab === "posts" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>
              📝 Posts Denunciados
            </button>
            <button onClick={() => setTab("marketplace")}
              className={`px-3 py-1 text-[11px] border cursor-pointer ${tab === "marketplace" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>
              🛒 Marketplace
            </button>
            <button onClick={() => setTab("pages")}
              className={`px-3 py-1 text-[11px] border cursor-pointer ${tab === "pages" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>
              📄 Páginas
          </div>

          {tab === "reports" && (
            <div className="flex gap-2 mb-3">
              <button onClick={() => setReportTab("pending")}
                className={`px-2 py-[2px] text-[10px] border cursor-pointer ${reportTab === "pending" ? "bg-destructive text-destructive-foreground border-destructive" : "bg-card text-foreground border-border hover:bg-accent"}`}>
                Pendentes
              </button>
              <button onClick={() => setReportTab("resolved")}
                className={`px-2 py-[2px] text-[10px] border cursor-pointer ${reportTab === "resolved" ? "bg-muted text-foreground border-border" : "bg-card text-foreground border-border hover:bg-accent"}`}>
                Resolvidas
              </button>
            </div>
          )}

          {dataLoading ? (
            <p className="text-[11px] text-muted-foreground">Carregando...</p>
          ) : tab === "reports" ? (
            reports.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Nenhuma denúncia encontrada.</p>
            ) : (
              <div className="space-y-2">
                {reports.map((report) => (
                  <div key={report.id} className="border border-border p-2 text-[11px]">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p><b>Denunciado por:</b> {report.reporterName}</p>
                        <p><b>Usuário:</b> <span className="text-destructive font-bold">{report.reportedName}</span></p>
                        <p><b>Motivo:</b> <span className="text-destructive">{report.reason}</span></p>
                        <p><b>Tipo:</b> {report.content_type}</p>
                        <p><b>Data:</b> {new Date(report.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      {report.status === "pending" && (
                        <div className="flex flex-col gap-1 shrink-0">
                          <button onClick={() => resolveReport(report.id, "resolved")}
                            className="bg-primary text-primary-foreground border-none px-2 py-1 text-[10px] cursor-pointer hover:opacity-90">
                            Resolver
                          </button>
                          <button onClick={() => resolveReport(report.id, "dismissed")}
                            className="bg-muted text-foreground border border-border px-2 py-1 text-[10px] cursor-pointer hover:opacity-90">
                            Dispensar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : tab === "posts" ? (
            reportedPosts.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Nenhum post denunciado encontrado.</p>
            ) : (
              <div className="space-y-2">
                {reportedPosts.map((post) => (
                  <div key={post.id} className="border border-border p-2 text-[11px]">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 min-w-0 flex-1">
                        <p><b>Autor:</b> {post.userName}</p>
                        <p className="text-foreground break-words">{post.content.substring(0, 200)}{post.content.length > 200 ? "..." : ""}</p>
                        {post.image_url && (
                          <img src={post.image_url} alt="" className="w-[100px] h-[60px] object-cover border border-border mt-1" />
                        )}
                        <p className="text-muted-foreground">{new Date(post.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <button onClick={() => deletePost(post.id)}
                        className="bg-destructive text-destructive-foreground border-none px-2 py-1 text-[10px] cursor-pointer hover:opacity-90 shrink-0 ml-2">
                        🗑️ Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            marketplaceItems.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Nenhum anúncio encontrado.</p>
            ) : (
              <div className="space-y-2">
                {marketplaceItems.map((item) => (
                  <div key={item.id} className="border border-border p-2 text-[11px]">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2 min-w-0 flex-1">
                        {item.image_url && (
                          <img src={item.image_url} alt="" className="w-[50px] h-[50px] object-cover border border-border shrink-0" />
                        )}
                        <div className="space-y-1 min-w-0">
                          <p className="font-bold truncate">{item.title}</p>
                          <p className="text-primary font-bold">{item.price}</p>
                          <p className="text-muted-foreground">Vendedor: {item.userName}</p>
                          <p className="text-muted-foreground">{item.category}</p>
                        </div>
                      </div>
                      <button onClick={() => deleteMarketplaceItem(item.id)}
                        className="bg-destructive text-destructive-foreground border-none px-2 py-1 text-[10px] cursor-pointer hover:opacity-90 shrink-0 ml-2">
                        🗑️ Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : tab === "pages" ? (
            <div>
              <p className="text-[11px] text-muted-foreground mb-3">Edite os Termos de Uso, Política de Privacidade e outras páginas do site.</p>
              <AdminPageEditor />
            </div>
          )}
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default ModeratorPanel;
