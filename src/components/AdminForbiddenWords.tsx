import { useState } from "react";
import { useForbiddenWords } from "@/hooks/useForbiddenWords";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const AdminForbiddenWords = () => {
  const { user } = useAuth();
  const { words, addWord, removeWord } = useForbiddenWords();
  const [newWord, setNewWord] = useState("");

  const handleAdd = async () => {
    if (!newWord.trim()) return;
    if (!user) return;
    await addWord(newWord, user.id);
    toast.success(`Palavra "${newWord.trim()}" adicionada ao filtro`);
    setNewWord("");
  };

  const handleRemove = async (id: string, word: string) => {
    await removeWord(id);
    toast.success(`Palavra "${word}" removida do filtro`);
  };

  return (
    <div>
      <h3 className="text-[13px] font-bold text-foreground mb-2">🚫 Palavras Proibidas</h3>
      <p className="text-[10px] text-muted-foreground mb-3">
        Palavras adicionadas aqui serão bloqueadas em posts, comentários e anúncios do marketplace.
      </p>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Digite a palavra proibida..."
          className="flex-1 border border-border bg-background text-foreground px-2 py-1 text-[11px]"
        />
        <button
          onClick={handleAdd}
          className="bg-destructive text-destructive-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90"
        >
          Adicionar
        </button>
      </div>

      {words.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">Nenhuma palavra proibida cadastrada.</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {words.map((w) => (
            <span
              key={w.id}
              className="inline-flex items-center gap-1 bg-destructive/10 text-destructive border border-destructive/20 px-2 py-[2px] text-[10px] rounded"
            >
              {w.word}
              <button
                onClick={() => handleRemove(w.id, w.word)}
                className="text-destructive hover:text-destructive/70 cursor-pointer font-bold ml-1"
                title="Remover"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-2">
        Total: {words.length} palavra(s) no filtro
      </p>
    </div>
  );
};

export default AdminForbiddenWords;
