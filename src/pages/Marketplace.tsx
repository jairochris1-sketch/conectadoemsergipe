import { useState } from "react";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { useAuth } from "@/context/AuthContext";

interface MarketItem {
  id: number;
  title: string;
  price: string;
  description: string;
  seller: string;
  category: string;
}

const INITIAL_ITEMS: MarketItem[] = [
  { id: 1, title: "Intro to Computer Science Textbook", price: "$45", description: "CS50 textbook, good condition. Some highlighting.", seller: "Mark Zuckerberg", category: "Books" },
  { id: 2, title: "Dorm Room Mini Fridge", price: "$80", description: "Works perfectly, graduating and need to sell.", seller: "Eduardo Saverin", category: "Electronics" },
  { id: 3, title: "Economics 101 Notes", price: "$10", description: "Full semester notes, got an A in the class.", seller: "Chris Hughes", category: "Books" },
  { id: 4, title: "Bicycle - 21 speed", price: "$120", description: "Great for getting around campus.", seller: "Dustin Moskovitz", category: "Other" },
  { id: 5, title: "HP Laptop", price: "$350", description: "2 years old, runs great. Comes with charger.", seller: "Andrew McCollum", category: "Electronics" },
  { id: 6, title: "Harvard Hoodie XL", price: "$25", description: "Worn twice, too big for me.", seller: "Arie Hasit", category: "Clothing" },
];

const CATEGORIES = ["All", "Books", "Electronics", "Clothing", "Other"];

const Marketplace = () => {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<MarketItem[]>(INITIAL_ITEMS);
  const [category, setCategory] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", price: "", description: "", category: "Other" });

  const filtered = category === "All" ? items : items.filter((i) => i.category === category);

  const handlePost = () => {
    if (!newItem.title || !newItem.price || !user) return;
    setItems([{ id: Date.now(), ...newItem, seller: user.name }, ...items]);
    setNewItem({ title: "", price: "", description: "", category: "Other" });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />
      <div className="max-w-[760px] mx-auto px-2 py-3">
        <div className="bg-card border border-border p-3">
          <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
            <h2 className="text-[16px] font-bold text-primary" style={{ fontFamily: 'Georgia, serif' }}>
              Marketplace
            </h2>
            {user && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90"
              >
                {showForm ? "Cancel" : "+ Sell Item"}
              </button>
            )}
          </div>

          {/* Post form */}
          {showForm && user && (
            <div className="border border-border p-2 bg-accent mb-3 text-[11px] space-y-2">
              <div>
                <label className="block font-bold mb-1">Title:</label>
                <input type="text" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} className="w-full border border-border p-1 text-[11px] bg-card" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block font-bold mb-1">Price:</label>
                  <input type="text" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} className="w-full border border-border p-1 text-[11px] bg-card" placeholder="$25" />
                </div>
                <div className="flex-1">
                  <label className="block font-bold mb-1">Category:</label>
                  <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="w-full border border-border p-1 text-[11px] bg-card">
                    {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Description:</label>
                <textarea value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className="w-full border border-border p-1 text-[11px] resize-none bg-card" rows={2} />
              </div>
              <button onClick={handlePost} className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90">
                Post Item
              </button>
            </div>
          )}

          {/* Category filter */}
          <div className="flex gap-2 mb-3 text-[11px]">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-2 py-[2px] border border-border cursor-pointer text-[11px] ${category === c ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Items list */}
          <div className="space-y-2">
            {filtered.map((item) => (
              <div key={item.id} className="border border-border p-2 flex gap-3">
                <div className="w-[60px] h-[60px] bg-muted border border-border flex items-center justify-center text-[8px] text-muted-foreground shrink-0">
                  📦
                </div>
                <div className="text-[11px] flex-1">
                  <div className="flex justify-between">
                    <a href="#" className="font-bold">{item.title}</a>
                    <span className="font-bold text-primary">{item.price}</span>
                  </div>
                  <p className="text-muted-foreground mt-1">{item.description}</p>
                  <p className="mt-1">Seller: <a href="#">{item.seller}</a> · <span className="text-muted-foreground">{item.category}</span></p>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-[11px] text-muted-foreground">No items in this category.</p>
            )}
          </div>
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default Marketplace;
