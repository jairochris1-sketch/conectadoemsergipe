import FacebookHeader from "@/components/FacebookHeader";
import ProfileSidebar from "@/components/ProfileSidebar";
import PostFeed from "@/components/PostFeed";
import FriendsSidebar from "@/components/FriendsSidebar";
import FacebookFooter from "@/components/FacebookFooter";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />

      <div className="max-w-[760px] mx-auto px-2 py-3">
        {!user && (
          <div className="bg-accent border border-border p-3 mb-3 text-center">
            <h2 className="text-[16px] font-bold text-primary mb-1" style={{ fontFamily: 'Georgia, serif' }}>
              [ thefacebook ]
            </h2>
            <p className="text-[11px] text-foreground mb-2">
              Thefacebook is an online directory that connects people through social networks at colleges.
            </p>
            <p className="text-[11px]">
              <a href="/register">Register</a> or <a href="/login">Login</a> to get started.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {/* Left column */}
          <div className="w-[180px] shrink-0">
            <ProfileSidebar
              name={user?.name || "Guest User"}
              bio={user?.bio || "Login to see your profile"}
              photoUrl={user?.photoUrl || "/placeholder.svg"}
              school={user?.school}
            />
          </div>

          {/* Center column */}
          <div className="flex-1 min-w-0">
            <PostFeed userName={user?.name} />
          </div>

          {/* Right column */}
          <div className="w-[180px] shrink-0">
            <FriendsSidebar />
          </div>
        </div>
      </div>

      <FacebookFooter />
    </div>
  );
};

export default Index;
