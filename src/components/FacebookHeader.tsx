import { Link } from "react-router-dom";

interface FacebookHeaderProps {
  isLoggedIn: boolean;
  userName?: string;
  onLogout?: () => void;
}

const FacebookHeader = ({ isLoggedIn, userName, onLogout }: FacebookHeaderProps) => {
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="max-w-[760px] mx-auto flex items-center justify-between px-2 py-1">
        <Link to="/" className="text-primary-foreground no-underline hover:no-underline">
          <h1 className="text-[20px] font-bold tracking-[-1px]" style={{ fontFamily: 'Georgia, serif' }}>
            [ thefacebook ]
          </h1>
        </Link>
        <div className="flex items-center gap-3 text-[11px]">
          {isLoggedIn ? (
            <>
              <span>welcome, <b>{userName}</b></span>
              <Link to="/" className="text-primary-foreground">home</Link>
              <Link to="/profile" className="text-primary-foreground">profile</Link>
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
