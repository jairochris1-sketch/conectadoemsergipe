import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface ServiceCategory {
  id: string;
  name: string;
  sort_order: number;
}

interface ServiceSubcategory {
  id: string;
  category_id: string;
  name: string;
  sort_order: number;
}

const AdminServiceManager = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [subcategories, setSubcategories] = useState<ServiceSubcategory[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchAllSubcategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("service_categories")
      .select("*")
      .order("sort_order");
    setCategories(data || []);
  };

  const fetchAllSubcategories = async () => {
    const { data } = await supabase
      .from("service_subcategories")
      .select("*")
      .order("sort_order");
    setSubcategories(data || []);
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;

    const maxOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) : 0;
    const { error } = await supabase.from("service_categories").insert({ name, sort_order: maxOrder + 1 });

    if (error) {
      toast.error(error.message.includes("duplicate") ? "Categoria já existe" : error.message);
    } else {
      toast.success("Categoria adicionada");
      setNewCategoryName("");
      fetchCategories();
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Remover a categoria "${name}" e todas as subcategorias?`)) return;
    const { error } = await supabase.from("service_categories").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Categoria removida");
      fetchCategories();
      fetchAllSubcategories();
    }
  };

  const handleAddSubcategory = async (categoryId: string) => {
    const name = newSubcategoryName.trim();
    if (!name) return;

    const subs = subcategories.filter((s) => s.category_id === categoryId);
    const maxOrder = subs.length > 0 ? Math.max(...subs.map((s) => s.sort_order)) : 0;

    const { error } = await supabase.from("service_subcategories").insert({
      category_id: categoryId,
      name,
      sort_order: maxOrder + 1,
    });

    if (error) {
      toast.error(error.message.includes("duplicate") ? "Subcategoria já existe" : error.message);
    } else {
      toast.success("Subcategoria adicionada");
      setNewSubcategoryName("");
      setAddingSubTo(null);
      fetchAllSubcategories();
    }
  };

  const handleDeleteSubcategory = async (id: string, name: string) => {
    if (!confirm(`Remover a subcategoria "${name}"?`)) return;
    const { error } = await supabase.from("service_subcategories").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Subcategoria removida");
      fetchAllSubcategories();
    }
  };

  const handleMoveCategory = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const current = categories[index];
    const target = categories[targetIndex];

    await Promise.all([
      supabase.from("service_categories").update({ sort_order: target.sort_order }).eq("id", current.id),
      supabase.from("service_categories").update({ sort_order: current.sort_order }).eq("id", target.id),
    ]);
    fetchCategories();
  };

  const handleMoveSubcategory = async (categoryId: string, index: number, direction: "up" | "down") => {
    const subs = subcategories.filter((s) => s.category_id === categoryId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= subs.length) return;

    const current = subs[index];
    const target = subs[targetIndex];

    await Promise.all([
      supabase.from("service_subcategories").update({ sort_order: target.sort_order }).eq("id", current.id),
      supabase.from("service_subcategories").update({ sort_order: current.sort_order }).eq("id", target.id),
    ]);
    fetchAllSubcategories();
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold">🛠️ Categorias de Serviços</h3>

      {/* Add category */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Nova categoria..."
          className="flex-1 border border-border px-2 py-1 text-xs bg-card text-foreground rounded-sm"
          onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
        />
        <button
          onClick={handleAddCategory}
          disabled={!newCategoryName.trim()}
          className="bg-primary text-primary-foreground px-3 py-1 text-xs cursor-pointer hover:opacity-90 disabled:opacity-50 rounded-sm flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Adicionar
        </button>
      </div>

      {/* Categories list */}
      <div className="space-y-1">
        {categories.map((cat, i) => {
          const catSubs = subcategories.filter((s) => s.category_id === cat.id);
          const isExpanded = expandedCategory === cat.id;

          return (
            <div key={cat.id} className="border border-border bg-card rounded-sm">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                  className="bg-transparent border-none cursor-pointer p-0.5 text-muted-foreground hover:text-foreground"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <span className="flex-1 text-xs font-medium">{cat.name}</span>
                <span className="text-[10px] text-muted-foreground">{catSubs.length} sub</span>
                <div className="flex gap-0.5">
                  <button
                    onClick={() => handleMoveCategory(i, "up")}
                    disabled={i === 0}
                    className="px-1 py-0.5 text-xs border border-border bg-muted hover:bg-accent cursor-pointer disabled:opacity-30 rounded-sm"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleMoveCategory(i, "down")}
                    disabled={i === categories.length - 1}
                    className="px-1 py-0.5 text-xs border border-border bg-muted hover:bg-accent cursor-pointer disabled:opacity-30 rounded-sm"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="px-1 py-0.5 text-xs bg-destructive text-destructive-foreground cursor-pointer hover:opacity-80 rounded-sm"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Expanded subcategories */}
              {isExpanded && (
                <div className="border-t border-border px-3 py-2 bg-muted/30 space-y-1">
                  {catSubs.map((sub, j) => (
                    <div key={sub.id} className="flex items-center gap-2 text-xs">
                      <span className="flex-1 pl-2 text-muted-foreground">↳ {sub.name}</span>
                      <button
                        onClick={() => handleMoveSubcategory(cat.id, j, "up")}
                        disabled={j === 0}
                        className="px-1 py-0.5 border border-border bg-card hover:bg-accent cursor-pointer disabled:opacity-30 rounded-sm"
                      >
                        <ArrowUp className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => handleMoveSubcategory(cat.id, j, "down")}
                        disabled={j === catSubs.length - 1}
                        className="px-1 py-0.5 border border-border bg-card hover:bg-accent cursor-pointer disabled:opacity-30 rounded-sm"
                      >
                        <ArrowDown className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubcategory(sub.id, sub.name)}
                        className="px-1 py-0.5 bg-destructive/80 text-destructive-foreground cursor-pointer hover:opacity-80 rounded-sm"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add subcategory */}
                  {addingSubTo === cat.id ? (
                    <div className="flex gap-1 mt-2">
                      <input
                        type="text"
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        placeholder="Nome da subcategoria..."
                        className="flex-1 border border-border px-2 py-1 text-xs bg-card rounded-sm"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleAddSubcategory(cat.id)}
                      />
                      <button
                        onClick={() => handleAddSubcategory(cat.id)}
                        className="bg-primary text-primary-foreground px-2 py-1 text-xs cursor-pointer hover:opacity-90 rounded-sm"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => {
                          setAddingSubTo(null);
                          setNewSubcategoryName("");
                        }}
                        className="bg-muted text-foreground border border-border px-2 py-1 text-xs cursor-pointer rounded-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingSubTo(cat.id)}
                      className="text-xs text-primary bg-transparent border-none cursor-pointer hover:underline mt-1 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Adicionar subcategoria
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {categories.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhuma categoria cadastrada.</p>
        )}
      </div>
    </div>
  );
};

export default AdminServiceManager;
