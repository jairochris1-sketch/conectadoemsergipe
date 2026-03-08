import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ModerationLog {
  id: string;
  moderator_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  target_owner_id: string | null;
  details: string | null;
  created_at: string;
  moderatorName?: string;
  targetOwnerName?: string;
}

const ACTION_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  delete_post: { label: "Post removido", emoji: "🗑️", color: "text-destructive" },
  delete_item: { label: "Anúncio removido", emoji: "🛒", color: "text-destructive" },
  resolve_report: { label: "Denúncia resolvida", emoji: "✅", color: "text-primary" },
  dismiss_report: { label: "Denúncia dispensada", emoji: "❌", color: "text-muted-foreground" },
};

const AdminModerationLogs = () => {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("moderation_logs" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("action_type", filter);
    }

    const { data } = await query;
    if (!data || data.length === 0) { setLogs([]); setLoading(false); return; }

    const userIds = Array.from(new Set<string>(
      (data as any[]).flatMap((l: any) => [l.moderator_id, l.target_owner_id].filter(Boolean))
    ));
    const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

    setLogs((data as any[]).map((l: any) => ({
      ...l,
      moderatorName: profileMap.get(l.moderator_id) || "Desconhecido",
      targetOwnerName: l.target_owner_id ? (profileMap.get(l.target_owner_id) || "Desconhecido") : null,
    })));
    setLoading(false);
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="space-y-3">
      <h3 className="text-[13px] font-bold text-primary">📋 Log de Moderação</h3>
      <p className="text-[10px] text-muted-foreground">
        Histórico de todas as ações realizadas por colaboradores e administradores.
      </p>

      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: "Todos" },
          { value: "delete_post", label: "🗑️ Posts" },
          { value: "delete_item", label: "🛒 Anúncios" },
          { value: "resolve_report", label: "✅ Resolvidas" },
          { value: "dismiss_report", label: "❌ Dispensadas" },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-2 py-[2px] text-[10px] border cursor-pointer ${
              filter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[11px] text-muted-foreground">Carregando...</p>
      ) : logs.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">Nenhum registro encontrado.</p>
      ) : (
        <div className="space-y-2">
          {logs.map(log => {
            const action = ACTION_LABELS[log.action_type] || { label: log.action_type, emoji: "📌", color: "text-foreground" };
            return (
              <div key={log.id} className="border border-border p-2 text-[11px]">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span>{action.emoji}</span>
                      <span className={`font-bold ${action.color}`}>{action.label}</span>
                    </div>
                    <p>
                      <b>Moderador:</b>{" "}
                      <span className="text-primary font-bold">{log.moderatorName}</span>
                    </p>
                    {log.targetOwnerName && (
                      <p>
                        <b>Dono do conteúdo:</b>{" "}
                        <span className="text-foreground">{log.targetOwnerName}</span>
                      </p>
                    )}
                    {log.details && (
                      <p className="text-muted-foreground break-words">{log.details}</p>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground shrink-0 whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminModerationLogs;
