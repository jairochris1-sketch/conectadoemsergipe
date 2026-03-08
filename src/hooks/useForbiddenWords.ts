import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useForbiddenWords = () => {
  const [words, setWords] = useState<{ id: string; word: string }[]>([]);

  const fetchWords = useCallback(async () => {
    const { data } = await supabase
      .from("forbidden_words")
      .select("id, word")
      .order("word", { ascending: true });
    setWords(data || []);
  }, []);

  useEffect(() => { fetchWords(); }, [fetchWords]);

  const addWord = async (word: string, userId: string) => {
    const trimmed = word.trim().toLowerCase();
    if (!trimmed) return;
    await supabase.from("forbidden_words").insert({ word: trimmed, created_by: userId });
    await fetchWords();
  };

  const removeWord = async (id: string) => {
    await supabase.from("forbidden_words").delete().eq("id", id);
    await fetchWords();
  };

  const containsForbiddenWord = (text: string): boolean => {
    const lower = text.toLowerCase();
    return words.some((w) => {
      const regex = new RegExp(`\\b${w.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(lower);
    });
  };

  return { words, addWord, removeWord, containsForbiddenWord, refreshWords: fetchWords };
};
