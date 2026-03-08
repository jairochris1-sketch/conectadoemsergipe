import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { clearBadgeCache } from "@/hooks/useVerificationBadges";
import VerificationBadge from "./VerificationBadge";
import { toast } from "sonner";

interface UserResult {
  user_id: string;
  name: string;
  photo_url: string | null;
  isModerator: boolean;
}

const AdminModeratorManager = () => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, photo_url")
      .ilike("name", `%${search.trim()}%`)
      .limit(20);

    if (!profiles || profiles.length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }

    const userIds = profiles.map(p => p.user_id);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("user_id", userIds)
      .eq("role", "moderator") as any;

    const modSet = new Set((roles || []).map((r: any) => r.user_id));

    setResults(profiles.map(p => ({
      ...p,
      isModerator: modSet.has(p.user_id),
    })));
    setLoading(false);
  };

  const toggleModerator = async (userId: string, current: boolean) => {
    if (current) {
      // Remove moderator role
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "moderator" as any);
      toast.success("Colaborador removido");
    } else {
      // Add moderator role
      await supabase.from("user_roles").insert({ user_id: userId, role: "moderator" as any });
      toast.success("Colaborador adicionado!");
    }
    clearBadgeCache(userId);
    setResults(prev => prev.map(r => r.user_id === userId ? { ...r, isModerator: !current } : r));
  };

  return (
    <div className="space-y-3">
      <h3 className="text-[13px] font-bold text-primary">🤝 Gerenciar Colaboradores</h3>
      <p className="text-[10px] text-muted-foreground">
        Colaboradores podem remover posts denunciados e anúncios do marketplace. Eles recebem um selo especial de estrela.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="Buscar usuário por nome..."
          className="flex-1 border border-border p-1 text-[11px] bg-card"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90 disabled:opacity-50"
        >
          Buscar
        </button>
      </div>

      {loading && <p className="text-[11px] text-muted-foreground">Buscando...</p>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map(user => (
            <div key={user.user_id} className="border border-border p-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-[32px] h-[32px] bg-muted border border-border overflow-hidden shrink-0">
                  {user.photo_url ? (
                    <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[8px] text-muted-foreground flex items-center justify-center h-full">👤</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-0 text-[11px]">
                    <span className="font-bold truncate">{user.name}</span>
                    {user.isModerator && (
                      <span className="ml-1 text-[9px] text-amber-600 font-bold">⭐ Colaborador</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleModerator(user.user_id, user.isModerator)}
                className={`px-2 py-1 text-[10px] border cursor-pointer ${
                  user.isModerator
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-card text-foreground border-border hover:bg-accent"
                }`}
              >
                {user.isModerator ? "✓ Colaborador" : "Tornar Colaborador"}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && search.trim() && (
        <p className="text-[11px] text-muted-foreground">Nenhum usuário encontrado.</p>
      )}

      <div className="border-t border-border pt-2 mt-3 text-[10px] text-muted-foreground space-y-1">
        <p>⭐ <b>Colaborador</b> — Pode moderar posts e anúncios denunciados</p>
        <p>Colaboradores acessam o painel em <b>/moderator</b></p>
      </div>
    </div>
  );
};

export default AdminModeratorManager;
