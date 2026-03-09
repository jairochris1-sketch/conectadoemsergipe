import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMarketplaceCategories } from "@/hooks/useMarketplaceCategories";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

const AdminCategoryManager = () => {
  const { t } = useLanguage();
  const { categories, refetch } = useMarketplaceCategories();
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) : 0;
    const { error } = await supabase
      .from("marketplace_categories")
      .insert({ name, sort_order: maxOrder + 1 });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Categoria já existe" : error.message);
    } else {
      toast.success("Categoria adicionada");
      setNewName("");
      await refetch();
    }
    setAdding(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remover a categoria "${name}"?`)) return;
    const { error } = await supabase
      .from("marketplace_categories")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Categoria removida");
      await refetch();
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const current = categories[index];
    const prev = categories[index - 1];
    await Promise.all([
      supabase.from("marketplace_categories").update({ sort_order: prev.sort_order }).eq("id", current.id),
      supabase.from("marketplace_categories").update({ sort_order: current.sort_order }).eq("id", prev.id),
    ]);
    await refetch();
  };

  const handleMoveDown = async (index: number) => {
    if (index >= categories.length - 1) return;
    const current = categories[index];
    const next = categories[index + 1];
    await Promise.all([
      supabase.from("marketplace_categories").update({ sort_order: next.sort_order }).eq("id", current.id),
      supabase.from("marketplace_categories").update({ sort_order: current.sort_order }).eq("id", next.id),
    ]);
    await refetch();
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold">📂 Categorias do Marketplace</h3>

      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nova categoria..."
          className="flex-1 border border-border px-2 py-1 text-xs bg-card text-foreground rounded-sm"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newName.trim()}
          className="bg-primary text-primary-foreground px-3 py-1 text-xs cursor-pointer hover:opacity-90 disabled:opacity-50 rounded-sm"
        >
          + Adicionar
        </button>
      </div>

      <div className="space-y-1">
        {categories.map((cat, i) => (
          <div key={cat.id} className="flex items-center gap-2 border border-border px-2 py-1.5 text-xs bg-card rounded-sm">
            <span className="flex-1 font-medium">{cat.name}</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleMoveUp(i)}
                disabled={i === 0}
                className="px-1.5 py-0.5 text-xs border border-border bg-muted hover:bg-accent cursor-pointer disabled:opacity-30 rounded-sm"
              >↑</button>
              <button
                onClick={() => handleMoveDown(i)}
                disabled={i === categories.length - 1}
                className="px-1.5 py-0.5 text-xs border border-border bg-muted hover:bg-accent cursor-pointer disabled:opacity-30 rounded-sm"
              >↓</button>
              <button
                onClick={() => handleDelete(cat.id, cat.name)}
                className="px-1.5 py-0.5 text-xs bg-destructive text-destructive-foreground cursor-pointer hover:opacity-80 rounded-sm"
              >✕</button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhuma categoria cadastrada.</p>
        )}
      </div>
    </div>
  );
};

export default AdminCategoryManager;
