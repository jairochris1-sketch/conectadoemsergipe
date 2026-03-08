import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSocial } from "@/context/SocialContext";
import FollowButton from "@/components/FollowButton";
import VerificationBadge from "@/components/VerificationBadge";
import { useBatchVerificationBadges } from "@/hooks/useVerificationBadges";

const MOCK_SHOPS = [
  { name: "Harvard Book Store", description: "Textbooks and supplies" },
  { name: "Campus Café", description: "Coffee and snacks" },
  { name: "Tech Repair Hub", description: "Laptop and phone repairs" },
];

const SearchPage = () => {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const lowerQuery = query.toLowerCase();
  const { t } = useLanguage();
  const { sendFriendRequest, isFriend, hasPendingRequest, searchProfiles } = useSocial();
  const [people, setPeople] = useState<{ id: string; name: string; school: string; photo: string }[]>([]);
  const peopleIds = useMemo(() => people.map(p => p.id), [people]);
  const badges = useBatchVerificationBadges(peopleIds);

  useEffect(() => {
    if (query) {
      searchProfiles(query).then(setPeople);
    }
  }, [query]);

  const filteredShops = MOCK_SHOPS.filter((s) => s.name.toLowerCase().includes(lowerQuery) || s.description.toLowerCase().includes(lowerQuery));

  const handleAddFriend = async (personId: string) => {
    await sendFriendRequest(personId);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Buscar" description="Busque pessoas e lojas no Conectados em Sergipe." path="/search" />
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
      <div className="max-w-[760px] mx-auto px-2 py-3">
        <div className="fb-box">
          <div className="fb-box-header" style={{ fontFamily: 'Georgia, serif', fontSize: '13px' }}>
            {t("search.results_for")} "{query}"
          </div>
          <div className="p-2">
            {people.length > 0 && (
              <div className="mb-3">
                <h3 className="fb-section-title text-[12px]">{t("search.people")}</h3>
                <div className="space-y-0">
                  {people.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-[11px] border-b border-border py-[6px] px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-[40px] h-[40px] bg-muted border border-border flex items-center justify-center text-[8px] text-muted-foreground overflow-hidden shrink-0">
                          {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : "👤"}
                        </div>
                        <div>
                          <div className="flex items-center gap-0.5">
                            <Link to={`/user/${p.id}`} className="font-bold text-[11px]">{p.name}</Link>
                            <VerificationBadge {...(badges.get(p.id) || {})} />
                          </div>
                          <p className="text-muted-foreground text-[10px]">{p.school}</p>
                        </div>
                      </div>
                      {user && user.id !== p.id && (
                        <div className="flex items-center gap-1.5">
                          <FollowButton profileId={p.id} />
                          {isFriend(p.id) ? (
                            <span className="text-[10px] text-muted-foreground">✓ {t("friends.already")}</span>
                          ) : hasPendingRequest(p.id) ? (
                            <span className="text-[10px] text-muted-foreground">{t("friends.pending")}</span>
                          ) : (
                            <button onClick={() => handleAddFriend(p.id)} className="bg-primary text-primary-foreground border-none px-2 py-[2px] text-[10px] cursor-pointer font-bold hover:opacity-90">
                              + {t("friends.add")}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredShops.length > 0 && (
              <div className="mb-3">
                <h3 className="fb-section-title text-[12px]">{t("search.shops")}</h3>
                <div className="space-y-0">
                  {filteredShops.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] border-b border-border py-[6px] px-1">
                      <div className="w-[40px] h-[40px] bg-accent border border-border flex items-center justify-center text-[14px]">🏪</div>
                      <div>
                        <a href="#" className="font-bold text-[11px]">{s.name}</a>
                        <p className="text-muted-foreground text-[10px]">{s.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {people.length === 0 && filteredShops.length === 0 && (
              <p className="text-[11px] text-muted-foreground py-3">{t("search.no_results")} "{query}".</p>
            )}
          </div>
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default SearchPage;
