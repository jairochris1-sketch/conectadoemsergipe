import { useSearchParams } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSocial } from "@/context/SocialContext";

const MOCK_PEOPLE = [
  { id: "1", name: "Mark Zuckerberg", school: "Harvard University" },
  { id: "mock-2", name: "Eduardo Saverin", school: "Harvard University" },
  { id: "mock-3", name: "Dustin Moskovitz", school: "Harvard University" },
  { id: "mock-4", name: "Chris Hughes", school: "Harvard University" },
];

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
  const { sendFriendRequest, isFriend, hasPendingRequest } = useSocial();

  const filteredPeople = MOCK_PEOPLE.filter((p) => p.name.toLowerCase().includes(lowerQuery));
  const filteredShops = MOCK_SHOPS.filter((s) => s.name.toLowerCase().includes(lowerQuery) || s.description.toLowerCase().includes(lowerQuery));

  const handleAddFriend = (personId: string, personName: string) => {
    if (!user) return;
    sendFriendRequest(user.id, user.name, user.photoUrl, personId);
  };

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
      <div className="max-w-[760px] mx-auto px-2 py-3">
        <div className="bg-card border border-border p-3">
          <div className="border-b border-border pb-2 mb-3">
            <h2 className="text-[14px] font-bold text-primary" style={{ fontFamily: 'Georgia, serif' }}>
              {t("search.results_for")} "{query}"
            </h2>
          </div>

          {filteredPeople.length > 0 && (
            <div className="mb-4">
              <h3 className="text-[12px] font-bold text-primary mb-2">{t("search.people")}</h3>
              <div className="space-y-2">
                {filteredPeople.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-[11px] border-b border-border pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-[40px] h-[40px] bg-muted border border-border flex items-center justify-center text-[8px] text-muted-foreground">
                        {t("photo")}
                      </div>
                      <div>
                        <a href="#" className="font-bold">{p.name}</a>
                        <p className="text-muted-foreground">{p.school}</p>
                      </div>
                    </div>
                    {user && user.id !== p.id && (
                      <div>
                        {isFriend(user.id, p.id) ? (
                          <span className="text-[10px] text-muted-foreground">✓ {t("friends.already")}</span>
                        ) : hasPendingRequest(user.id, p.id) ? (
                          <span className="text-[10px] text-muted-foreground">{t("friends.pending")}</span>
                        ) : (
                          <button
                            onClick={() => handleAddFriend(p.id, p.name)}
                            className="bg-primary text-primary-foreground border-none px-2 py-[2px] text-[10px] cursor-pointer hover:opacity-90"
                          >
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
            <div className="mb-4">
              <h3 className="text-[12px] font-bold text-primary mb-2">{t("search.shops")}</h3>
              <div className="space-y-2">
                {filteredShops.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] border-b border-border pb-2">
                    <div className="w-[40px] h-[40px] bg-accent border border-border flex items-center justify-center text-[8px] text-muted-foreground">
                      🏪
                    </div>
                    <div>
                      <a href="#" className="font-bold">{s.name}</a>
                      <p className="text-muted-foreground">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredPeople.length === 0 && filteredShops.length === 0 && (
            <p className="text-[11px] text-muted-foreground">{t("search.no_results")} "{query}".</p>
          )}
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default SearchPage;
