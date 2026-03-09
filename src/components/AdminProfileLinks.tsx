import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileLink {
  label: string;
  url: string;
}

const AdminProfileLinks = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<{ user_id: string; name: string; profile_links: ProfileLink[] }[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ user_id: string; name: string; profile_links: ProfileLink[] } | null>(null);
  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [saving, setSaving] = useState(false);

  const searchUsers = async () => {
    if (searchQuery.trim().length < 2) return;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, name, profile_links")
      .ilike("name", `%${searchQuery.trim()}%`)
      .limit(10);
    setResults((data || []).map((d: any) => ({
      user_id: d.user_id,
      name: d.name,
      profile_links: Array.isArray(d.profile_links) ? d.profile_links : [],
    })));
  };

  const selectUser = (u: typeof results[0]) => {
    setSelectedUser(u);
    setLinks(u.profile_links.length > 0 ? u.profile_links : [{ label: "", url: "" }]);
  };

  const addLink = () => setLinks([...links, { label: "", url: "" }]);

  const removeLink = (i: number) => setLinks(links.filter((_, idx) => idx !== i));

  const updateLink = (i: number, field: "label" | "url", value: string) => {
    const updated = [...links];
    updated[i] = { ...updated[i], [field]: value };
    setLinks(updated);
  };

  const saveLinks = async () => {
    if (!selectedUser) return;
    setSaving(true);
    const validLinks = links.filter(l => l.label.trim() && l.url.trim());
    await (supabase.from("profiles").update({ profile_links: validLinks } as any).eq("user_id", selectedUser.user_id) as any);
    toast.success(`Links de ${selectedUser.name} atualizados!`);
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold">🔗 Links de Perfil (Admin)</h3>
      <div className="flex gap-2">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar usuário..."
          className="flex-1 border border-border px-2 py-1 text-[11px] bg-card"
        />
        <button onClick={searchUsers} className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer">Buscar</button>
      </div>
      {results.length > 0 && !selectedUser && (
        <div className="border border-border bg-card max-h-[150px] overflow-y-auto">
          {results.map((r) => (
            <button key={r.user_id} onClick={() => selectUser(r)} className="block w-full text-left px-2 py-1.5 text-[11px] hover:bg-accent bg-transparent border-none cursor-pointer border-b border-border">
              {r.name} {r.profile_links.length > 0 && `(${r.profile_links.length} links)`}
            </button>
          ))}
        </div>
      )}
      {selectedUser && (
        <div className="border border-border p-2 bg-accent space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold">{selectedUser.name}</span>
            <button onClick={() => { setSelectedUser(null); setResults([]); }} className="text-[10px] text-muted-foreground bg-transparent border-none cursor-pointer hover:underline">Voltar</button>
          </div>
          {links.map((link, i) => (
            <div key={i} className="flex gap-1 items-center">
              <input value={link.label} onChange={(e) => updateLink(i, "label", e.target.value)} placeholder="Rótulo (ex: Instagram)" className="flex-1 border border-border px-1 py-0.5 text-[11px] bg-card" />
              <input value={link.url} onChange={(e) => updateLink(i, "url", e.target.value)} placeholder="https://..." className="flex-[2] border border-border px-1 py-0.5 text-[11px] bg-card" />
              <button onClick={() => removeLink(i)} className="text-destructive bg-transparent border-none cursor-pointer text-[11px]">✕</button>
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={addLink} className="text-[11px] text-primary bg-transparent border-none cursor-pointer hover:underline">+ Adicionar link</button>
            <button onClick={saveLinks} disabled={saving} className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfileLinks;
