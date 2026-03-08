import { useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import FriendsSidebar from "@/components/FriendsSidebar";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSocial } from "@/context/SocialContext";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const { getFriends } = useSocial();

  if (!user) return <Navigate to="/login" />;

  const friends = getFriends();

  const handleSave = async () => {
    await updateProfile({ bio });
    setEditing(false);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return;

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    await updateProfile({ photoUrl: urlData.publicUrl + "?t=" + Date.now() });
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
                  {t("profile_of")} {user.name}
                </h2>
              </div>
              <div className="flex gap-3">
                <div className="shrink-0">
                  <img
                    src={user.photoUrl || "/placeholder.svg"}
                    alt={user.name}
                    className="w-[150px] h-[150px] border border-border object-cover cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    title={t("click_to_change")}
                  />
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="mt-1 text-[10px] text-primary cursor-pointer bg-transparent border-none hover:underline w-full text-center">
                    {t("change_photo")}
                  </button>
                </div>
                <div className="text-[11px] space-y-1">
                  <p><b>{t("name")}:</b> {user.name}</p>
                  <p><b>{t("email")}:</b> {user.email}</p>
                  <p><b>{t("school")}:</b> {user.school}</p>
                  {user.city && <p><b>{t("city")}:</b> {user.city}</p>}
                  {user.birthdate && <p><b>{t("birthdate")}:</b> {new Date(user.birthdate).toLocaleDateString()}</p>}
                  <p><b>{t("bio")}:</b> {user.bio || t("no_bio")}</p>
                  <p><b>{t("friends")}:</b> {friends.length}</p>
                </div>
              </div>
              {!editing ? (
                <button onClick={() => { setEditing(true); setBio(user.bio); }} className="mt-3 bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90">
                  {t("edit_profile")}
                </button>
              ) : (
                <div className="mt-3 border-t border-border pt-3 text-[11px] space-y-2">
                  <div>
                    <label className="block font-bold mb-1">{t("bio")}:</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full border border-border p-1 text-[11px] resize-none bg-card" rows={3} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer hover:opacity-90">{t("save")}</button>
                    <button onClick={() => setEditing(false)} className="bg-muted text-foreground border border-border px-3 py-1 text-[11px] cursor-pointer hover:opacity-90">{t("cancel")}</button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-card border border-border p-3 mt-3">
              <div className="border-b border-border pb-2 mb-3">
                <h3 className="text-[14px] font-bold text-primary" style={{ fontFamily: 'Georgia, serif' }}>
                  {t("friends")} ({friends.length})
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {friends.length > 0 ? friends.map((friend) => (
                  <div key={friend.id} className="flex items-center gap-2 text-[11px] border border-border p-1">
                    <div className="w-[30px] h-[30px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                      {friend.photo ? <img src={friend.photo} alt={friend.name} className="w-full h-full object-cover" /> : <span className="text-[8px] text-muted-foreground">{t("photo")}</span>}
                    </div>
                    <a href="#" className="font-bold truncate">{friend.name}</a>
                  </div>
                )) : (
                  <p className="text-[11px] text-muted-foreground col-span-3">{t("friends.none")}</p>
                )}
              </div>
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
