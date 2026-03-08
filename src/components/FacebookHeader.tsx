import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

interface FacebookHeaderProps {
  isLoggedIn: boolean;
  userName?: string;
  onLogout?: () => void;
}

const FacebookHeader = ({ isLoggedIn, userName, onLogout }: FacebookHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="max-w-[760px] mx-auto flex items-center justify-between px-2 py-1">
        <Link to="/" className="text-primary-foreground no-underline hover:no-underline">
          <h1 className="text-[20px] font-bold tracking-[-1px]" style={{ fontFamily: 'Georgia, serif' }}>
            [ thefacebook ]
          </h1>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="border border-border px-1 py-[2px] text-[11px] text-foreground bg-card w-[140px]"
          />
          <button type="submit" className="bg-muted border border-border border-l-0 px-1 py-[2px] cursor-pointer flex items-center">
            <Search className="w-3 h-3 text-foreground" />
          </button>
        </form>

        <div className="flex items-center gap-3 text-[11px]">
          {isLoggedIn ? (
            <>
              <span>welcome, <b>{userName}</b></span>
              <Link to="/" className="text-primary-foreground">home</Link>
              <Link to="/profile" className="text-primary-foreground">profile</Link>
              <Link to="/marketplace" className="text-primary-foreground">marketplace</Link>
              <button onClick={onLogout} className="text-primary-foreground bg-transparent border-none cursor-pointer text-[11px] hover:underline">
                logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-primary-foreground">login</Link>
              <Link to="/register" className="text-primary-foreground">register</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacebookHeader;
