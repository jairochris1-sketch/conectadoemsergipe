import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface Campaign {
  id: string;
  item_id: string;
  item_title: string;
  budget: number;
  spent: number;
  target_city: string;
  target_category: string;
  status: string;
  impressions: number;
  clicks: number;
  created_at: string;
  ends_at: string;
}

interface MyItem {
  id: string;
  title: string;
}

const CATEGORIES = [
  "Móveis", "Imóveis", "Celulares", "Carros", "Motos", "Bicicletas",
  "Som", "Roupas", "Bolos/Doces", "Mudas Frutíferas", "Sofá/Mesa/Cadeiras",
  "Fogão", "Geladeira", "Guarda-Roupa", "Eletrônicos", "Livros", "Outros"
];

const SellerDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [credits, setCredits] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [myItems, setMyItems] = useState<MyItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    item_id: "",
    budget: 10,
    target_city: "",
    target_category: "",
  });
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    // Load or create credits
    const { data: creditData } = await supabase
      .from("ad_credits")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (creditData) {
      setCredits(creditData.balance);
    } else {
      await supabase.from("ad_credits").insert({ user_id: user.id, balance: 100 });
      setCredits(100);
    }

    // Load campaigns with item titles
    const { data: campData } = await supabase
      .from("sponsored_campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (campData && campData.length > 0) {
      const itemIds = [...new Set(campData.map((c: any) => c.item_id))];
      const { data: items } = await supabase
        .from("marketplace_items")
        .select("id, title")
        .in("id", itemIds);
      const itemMap = new Map(items?.map((i) => [i.id, i.title]) || []);

      setCampaigns(campData.map((c: any) => ({
        ...c,
        item_title: itemMap.get(c.item_id) || "Item removido",
      })));
    } else {
      setCampaigns([]);
    }

    // Load user's marketplace items
    const { data: userItems } = await supabase
      .from("marketplace_items")
      .select("id, title")
      .eq("user_id", user.id);
    setMyItems(userItems || []);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async () => {
    if (!user || !newCampaign.item_id || newCampaign.budget < 1) return;
    if (newCampaign.budget > credits) return;
    setCreating(true);

    // Deduct credits
    await supabase
      .from("ad_credits")
      .update({ balance: credits - newCampaign.budget, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    // Create campaign
    await supabase.from("sponsored_campaigns").insert({
      user_id: user.id,
      item_id: newCampaign.item_id,
      budget: newCampaign.budget,
      target_city: newCampaign.target_city,
      target_category: newCampaign.target_category,
    });

    setNewCampaign({ item_id: "", budget: 10, target_city: "", target_category: "" });
    setShowForm(false);
    setCreating(false);
    await loadData();
  };

  const pauseCampaign = async (id: string) => {
    await supabase.from("sponsored_campaigns").update({ status: "paused" }).eq("id", id);
    await loadData();
  };

  const resumeCampaign = async (id: string) => {
    await supabase.from("sponsored_campaigns").update({ status: "active" }).eq("id", id);
    await loadData();
  };

  if (!user) return <Navigate to="/login" />;

  const ctr = (c: Campaign) => c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={true} userName={user.name} onLogout={logout} />
      <div className="max-w-[760px] mx-auto px-2 py-3">
        <div className="bg-card border border-border p-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
            <h2 className="text-[16px] font-bold text-primary" style={{ fontFamily: 'Georgia, serif' }}>
              📢 {t("ads.title")}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[11px] bg-accent border border-border px-2 py-[2px]">
                💰 {t("ads.credits")}: <b>{credits}</b>
              </span>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90"
              >
                {showForm ? t("marketplace.cancel") : t("ads.new_campaign")}
              </button>
            </div>
          </div>

          {/* Create campaign form */}
          {showForm && (
            <div className="border border-border p-3 bg-accent mb-3 text-[11px] space-y-2">
              <h3 className="font-bold text-[12px]">{t("ads.create_campaign")}</h3>

              {myItems.length === 0 ? (
                <p className="text-muted-foreground">{t("ads.no_items")}</p>
              ) : (
                <>
                  <div>
                    <label className="block font-bold mb-1">{t("ads.select_product")}</label>
                    <select
                      value={newCampaign.item_id}
                      onChange={(e) => setNewCampaign({ ...newCampaign, item_id: e.target.value })}
                      className="w-full border border-border p-1 text-[11px] bg-card"
                    >
                      <option value="">{t("ads.choose_item")}</option>
                      {myItems.map((item) => (
                        <option key={item.id} value={item.id}>{item.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block font-bold mb-1">{t("ads.budget")} ({t("ads.credits")})</label>
                      <input
                        type="number"
                        min={1}
                        max={credits}
                        value={newCampaign.budget}
                        onChange={(e) => setNewCampaign({ ...newCampaign, budget: parseInt(e.target.value) || 0 })}
                        className="w-full border border-border p-1 text-[11px] bg-card"
                      />
                      <p className="text-[9px] text-muted-foreground mt-1">
                        {t("ads.available")}: {credits} {t("ads.credits")}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block font-bold mb-1">{t("ads.target_city")}</label>
                      <input
                        type="text"
                        value={newCampaign.target_city}
                        onChange={(e) => setNewCampaign({ ...newCampaign, target_city: e.target.value })}
                        className="w-full border border-border p-1 text-[11px] bg-card"
                        placeholder={t("ads.all_cities")}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block font-bold mb-1">{t("ads.target_category")}</label>
                      <select
                        value={newCampaign.target_category}
                        onChange={(e) => setNewCampaign({ ...newCampaign, target_category: e.target.value })}
                        className="w-full border border-border p-1 text-[11px] bg-card"
                      >
                        <option value="">{t("ads.all_categories")}</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleCreate}
                    disabled={creating || !newCampaign.item_id || newCampaign.budget < 1 || newCampaign.budget > credits}
                    className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90 disabled:opacity-50"
                  >
                    {creating ? "..." : t("ads.launch")}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Campaigns list */}
          <div className="space-y-2">
            {campaigns.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">{t("ads.no_campaigns")}</p>
            ) : (
              campaigns.map((camp) => (
                <div key={camp.id} className="border border-border p-2 text-[11px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">{camp.item_title}</span>
                    <span className={`text-[9px] px-2 py-[1px] border ${
                      camp.status === "active"
                        ? "border-green-500 text-green-700 bg-green-50"
                        : camp.status === "paused"
                        ? "border-yellow-500 text-yellow-700 bg-yellow-50"
                        : "border-border text-muted-foreground"
                    }`}>
                      {camp.status === "active" ? t("ads.active") : camp.status === "paused" ? t("ads.paused") : t("ads.ended")}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 my-2 text-center">
                    <div className="bg-accent border border-border p-1">
                      <p className="text-[9px] text-muted-foreground">{t("ads.impressions")}</p>
                      <p className="font-bold text-[13px]">{camp.impressions}</p>
                    </div>
                    <div className="bg-accent border border-border p-1">
                      <p className="text-[9px] text-muted-foreground">{t("ads.clicks")}</p>
                      <p className="font-bold text-[13px]">{camp.clicks}</p>
                    </div>
                    <div className="bg-accent border border-border p-1">
                      <p className="text-[9px] text-muted-foreground">CTR</p>
                      <p className="font-bold text-[13px]">{ctr(camp)}%</p>
                    </div>
                    <div className="bg-accent border border-border p-1">
                      <p className="text-[9px] text-muted-foreground">{t("ads.spent_budget")}</p>
                      <p className="font-bold text-[13px]">{camp.spent}/{camp.budget}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                    <span>
                      {camp.target_city ? `📍 ${camp.target_city}` : t("ads.all_cities")}
                      {camp.target_category ? ` · ${camp.target_category}` : ""}
                    </span>
                    <div className="flex gap-1">
                      {camp.status === "active" && (
                        <button onClick={() => pauseCampaign(camp.id)} className="border border-border px-2 py-[1px] bg-muted cursor-pointer text-[9px] hover:bg-accent">
                          ⏸ {t("ads.pause")}
                        </button>
                      )}
                      {camp.status === "paused" && (
                        <button onClick={() => resumeCampaign(camp.id)} className="border border-border px-2 py-[1px] bg-muted cursor-pointer text-[9px] hover:bg-accent">
                          ▶ {t("ads.resume")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default SellerDashboard;
