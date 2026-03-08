import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import { clearBadgeCache } from "@/hooks/useVerificationBadges";
import VerificationBadge from "./VerificationBadge";
import { toast } from "sonner";

interface UserResult {
  user_id: string;
  name: string;
  photo_url: string | null;
  verified: boolean;
  business_verified: boolean;
  isAdmin: boolean;
}

const AdminBadgeManager = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, photo_url, verified, business_verified")
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
      .eq("role", "admin");

    const adminSet = new Set((roles || []).map(r => r.user_id));

    setResults(profiles.map(p => ({
      ...p,
      verified: p.verified ?? false,
      business_verified: p.business_verified ?? false,
      isAdmin: adminSet.has(p.user_id),
    })));
    setLoading(false);
  };

  const toggleVerified = async (userId: string, current: boolean) => {
    await supabase.from("profiles").update({ verified: !current } as any).eq("user_id", userId);
    clearBadgeCache(userId);
    setResults(prev => prev.map(r => r.user_id === userId ? { ...r, verified: !current } : r));
    toast.success(!current ? "Selo azul ativado" : "Selo azul removido");
  };

  const toggleBusinessVerified = async (userId: string, current: boolean) => {
    await supabase.from("profiles").update({ business_verified: !current } as any).eq("user_id", userId);
    clearBadgeCache(userId);
    setResults(prev => prev.map(r => r.user_id === userId ? { ...r, business_verified: !current } : r));
    toast.success(!current ? "Selo dourado ativado" : "Selo dourado removido");
  };

  return (
    <div className="space-y-3">
      <h3 className="text-[13px] font-bold text-primary">🏅 Gerenciar Selos de Verificação</h3>
      
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
                    <VerificationBadge
                      verified={user.verified}
                      businessVerified={user.business_verified}
                      isAdmin={user.isAdmin}
                    />
                  </div>
                  {user.isAdmin && <span className="text-[9px] text-destructive font-bold">Admin</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => toggleVerified(user.user_id, user.verified)}
                  className={`px-2 py-1 text-[10px] border cursor-pointer ${
                    user.verified
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-accent"
                  }`}
                >
                  {user.verified ? "✓ Azul" : "Azul"}
                </button>
                <button
                  onClick={() => toggleBusinessVerified(user.user_id, user.business_verified)}
                  className={`px-2 py-1 text-[10px] border cursor-pointer ${
                    user.business_verified
                      ? "text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-accent"
                  }`}
                  style={user.business_verified ? { backgroundColor: "#d4a017", borderColor: "#d4a017" } : {}}
                >
                  {user.business_verified ? "✓ Dourado" : "Dourado"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && search.trim() && (
        <p className="text-[11px] text-muted-foreground">Nenhum usuário encontrado.</p>
      )}

      <div className="border-t border-border pt-2 mt-3 text-[10px] text-muted-foreground space-y-1">
        <p>🔵 <b>Selo Azul</b> — Usuário verificado</p>
        <p>🟡 <b>Selo Dourado</b> — Empresa / Página oficial</p>
        <p>🛡️ <b>Selo Admin</b> — Atribuído automaticamente aos administradores</p>
      </div>
    </div>
  );
};

export default AdminBadgeManager;
