import { useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import FriendsSidebar from "@/components/FriendsSidebar";
import { useAuth } from "@/context/AuthContext";

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return <Navigate to="/login" />;

  const handleSave = () => {
    updateProfile({ bio });
    setEditing(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateProfile({ photoUrl: url });
  };

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={true} userName={user.name} onLogout={logout} />
      <div className="max-w-[760px] mx-auto px-2 py-3">
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            <div className="bg-card border border-border p-3">
              <div className="border-b border-border pb-2 mb-3">
                <h2 className="text-[16px] font-bold text-primary" style={{ fontFamily: 'Georgia, serif' }}>
                  {user.name}'s Profile
                </h2>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0">
                  <img
                    src={user.photoUrl || "/placeholder.svg"}
                    alt={user.name}
                    className="w-[150px] h-[150px] border border-border object-cover cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    title="Clique para alterar a foto"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 text-[10px] text-primary cursor-pointer bg-transparent border-none hover:underline w-full text-center"
                  >
                    Alterar foto
                  </button>
                </div>
                <div className="text-[11px] space-y-1">
                  <p><b>Name:</b> {user.name}</p>
                  <p><b>Email:</b> {user.email}</p>
                  <p><b>School:</b> {user.school}</p>
                  <p><b>Member since:</b> February 2004</p>
                  <p><b>Bio:</b> {user.bio || "No bio yet."}</p>
                </div>
              </div>

              {!editing ? (
                <button
                  onClick={() => { setEditing(true); setBio(user.bio); }}
                  className="mt-3 bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="mt-3 border-t border-border pt-3 text-[11px] space-y-2">
                  <div>
                    <label className="block font-bold mb-1">Bio:</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full border border-border p-1 text-[11px] resize-none bg-card"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90">
                      Save
                    </button>
                    <button onClick={() => setEditing(false)} className="bg-muted text-foreground border border-border px-3 py-1 text-[11px] cursor-pointer hover:opacity-90">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-[180px] shrink-0">
            <FriendsSidebar />
          </div>
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default Profile;
