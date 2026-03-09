import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MarketplaceCategory {
  id: string;
  name: string;
  sort_order: number;
}

export const useMarketplaceCategories = () => {
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from("marketplace_categories")
      .select("*")
      .order("sort_order", { ascending: true });
    setCategories(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const categoryNames = categories.map(c => c.name);
  const categoryNamesWithAll = ["All", ...categoryNames];

  return { categories, categoryNames, categoryNamesWithAll, loading, refetch: fetchCategories };
};
