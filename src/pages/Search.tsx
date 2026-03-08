import { useSearchParams } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { useAuth } from "@/context/AuthContext";

const MOCK_PEOPLE = [
  { name: "Mark Zuckerberg", school: "Harvard University", type: "person" },
  { name: "Eduardo Saverin", school: "Harvard University", type: "person" },
  { name: "Dustin Moskovitz", school: "Harvard University", type: "person" },
  { name: "Chris Hughes", school: "Harvard University", type: "person" },
];

const MOCK_SHOPS = [
  { name: "Harvard Book Store", description: "Textbooks and supplies", type: "shop" },
  { name: "Campus Café", description: "Coffee and snacks", type: "shop" },
  { name: "Tech Repair Hub", description: "Laptop and phone repairs", type: "shop" },
];

const SearchPage = () => {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const lowerQuery = query.toLowerCase();

  const filteredPeople = MOCK_PEOPLE.filter((p) => p.name.toLowerCase().includes(lowerQuery));
  const filteredShops = MOCK_SHOPS.filter((s) => s.name.toLowerCase().includes(lowerQuery) || s.description.toLowerCase().includes(lowerQuery));

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
      <div className="max-w-[760px] mx-auto px-2 py-3">
        <div className="bg-card border border-border p-3">
          <div className="border-b border-border pb-2 mb-3">
            <h2 className="text-[14px] font-bold text-primary" style={{ fontFamily: 'Georgia, serif' }}>
              Search results for "{query}"
            </h2>
          </div>

          {filteredPeople.length > 0 && (
            <div className="mb-4">
              <h3 className="text-[12px] font-bold text-primary mb-2">People</h3>
              <div className="space-y-2">
                {filteredPeople.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] border-b border-border pb-2">
                    <div className="w-[40px] h-[40px] bg-muted border border-border flex items-center justify-center text-[8px] text-muted-foreground">
                      foto
                    </div>
                    <div>
                      <a href="#" className="font-bold">{p.name}</a>
                      <p className="text-muted-foreground">{p.school}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredShops.length > 0 && (
            <div className="mb-4">
              <h3 className="text-[12px] font-bold text-primary mb-2">Shops</h3>
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
            <p className="text-[11px] text-muted-foreground">No results found for "{query}".</p>
          )}
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default SearchPage;
