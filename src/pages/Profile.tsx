import { useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import SEOHead from "@/components/SEOHead";
import FriendsSidebar from "@/components/FriendsSidebar";
import VerificationBadge from "@/components/VerificationBadge";
import { useVerificationBadge } from "@/hooks/useVerificationBadges";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSocial } from "@/context/SocialContext";
import { useFollowers } from "@/hooks/useFollowers";
import { supabase } from "@/integrations/supabase/client";
import { SERGIPE_CITIES } from "@/lib/sergipeCities";
import { useIsMobile } from "@/hooks/use-mobile";

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editSchool, setEditSchool] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editBirthdate, setEditBirthdate] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const { getFriends } = useSocial();
  const isMobile = useIsMobile();

  if (!user) return <Navigate to="/login" />;

  const friends = getFriends();
  const { followerCount } = useFollowers(user?.id);
  const badge = useVerificationBadge(user?.id);

  const startEditing = () => {
    setEditName(user.name);
    setEditBio(user.bio);
    setEditSchool(user.school);
    setEditCity(user.city);
    setEditBirthdate(user.birthdate);
    setEditing(true);
  };

  const handleSave = async () => {
    const success = await updateProfile({
      name: editName,
      bio: editBio,
      school: editSchool,
      city: editCity,
      birthdate: editBirthdate,
    });
    if (success) {
      toast.success("Perfil atualizado com sucesso!");
    } else {
      toast.error("Erro ao salvar o perfil. Tente novamente.");
    }
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
      <SEOHead title="Meu Perfil" description="Gerencie seu perfil no Conectados em Sergipe." path="/profile" />
      <FacebookHeader isLoggedIn={true} userName={user.name} onLogout={logout} />

      <div
        className="mx-auto py-3 px-2"
        style={isMobile ? { padding: "8px" } : { width: "980px", maxWidth: "100%" }}
      >
        <div className="flex flex-col md:flex-row gap-[10px]">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="bg-card border border-border p-3">
              <div className="border-b border-border pb-1.5 mb-2">
                <h2 className="text-[14px] font-bold text-primary flex items-center gap-1" style={{ fontFamily: "klavika, 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                  {t("profile_of")} {user.name}
                  <VerificationBadge {...badge} size="md" />
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="shrink-0">
                  <img
                    src={user.photoUrl || "/placeholder.svg"}
                    alt={user.name}
                    className="w-[130px] h-[130px] border border-border object-cover cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    title={t("click_to_change")}
                  />
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="mt-1 text-[10px] cursor-pointer bg-transparent border-none hover:underline w-full text-center" style={{ color: "hsl(var(--fb-link))" }}>
                    {t("change_photo")}
                  </button>
                </div>
                {!editing ? (
                  <div className="text-[11px] space-y-1">
                    <p><b>{t("name")}:</b> {user.name}</p>
                    <p><b>{t("school")}:</b> {user.school || "-"}</p>
                    <p><b>{t("city")}:</b> {user.city || "-"}</p>
                    <p><b>{t("birthdate")}:</b> {user.birthdate ? new Date(user.birthdate).toLocaleDateString() : "-"}</p>
                    <p><b>{t("bio")}:</b> {user.bio || t("no_bio")}</p>
                    <p><b>{t("friends")}:</b> {friends.length}</p>
                    <p><b>{t("admin.followers")}:</b> {followerCount}</p>
                  </div>
                ) : (
                  <div className="text-[11px] space-y-2 flex-1">
                    <div>
                      <label className="block font-bold mb-0.5">{t("name")}:</label>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border border-border p-1.5 text-[11px] bg-card" />
                    </div>
                    <div>
                      <label className="block font-bold mb-0.5">{t("school")}:</label>
                      <input value={editSchool} onChange={(e) => setEditSchool(e.target.value)} className="w-full border border-border p-1.5 text-[11px] bg-card" />
                    </div>
                    <div>
                      <label className="block font-bold mb-0.5">{t("city")}:</label>
                      <select value={editCity} onChange={(e) => setEditCity(e.target.value)} className="w-full border border-border p-1.5 text-[11px] bg-card">
                        <option value="">Selecione...</option>
                        {SERGIPE_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold mb-0.5">{t("birthdate")}:</label>
                      <input type="date" value={editBirthdate} onChange={(e) => setEditBirthdate(e.target.value)} className="w-full border border-border p-1.5 text-[11px] bg-card" />
                    </div>
                    <div>
                      <label className="block font-bold mb-0.5">{t("bio")}:</label>
                      <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full border border-border p-1.5 text-[11px] resize-none bg-card" rows={3} />
                    </div>
                  </div>
                )}
              </div>
              {!editing ? (
                <button onClick={startEditing} className="mt-2 bg-muted border border-border px-3 py-1 text-[11px] cursor-pointer font-bold hover:opacity-90">
                  {t("edit_profile")}
                </button>
              ) : (
                <div className="flex gap-2 mt-2">
                  <button onClick={handleSave} className="bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] cursor-pointer font-bold hover:opacity-90">{t("save")}</button>
                  <button onClick={() => setEditing(false)} className="bg-muted text-foreground border border-border px-3 py-1 text-[11px] cursor-pointer hover:opacity-90">{t("cancel")}</button>
                </div>
              )}
            </div>

            {/* Friends grid */}
            <div className="bg-card border border-border p-3 mt-[10px]">
              <div className="border-b border-border pb-1.5 mb-2">
                <h3 className="text-[13px] font-bold text-primary">
                  {t("friends")} ({friends.length})
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {friends.length > 0 ? friends.map((friend) => (
                  <div key={friend.id} className="flex items-center gap-1.5 text-[11px] border border-border p-1">
                    <div className="w-[28px] h-[28px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                      {friend.photo ? <img src={friend.photo} alt={friend.name} className="w-full h-full object-cover" /> : <span className="text-[8px] text-muted-foreground">{t("photo")}</span>}
                    </div>
                    <a href="#" className="font-bold truncate text-[10px]">{friend.name}</a>
                  </div>
                )) : (
                  <p className="text-[11px] text-muted-foreground col-span-3">{t("friends.none")}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-full md:shrink-0" style={{ width: isMobile ? "100%" : "220px" }}>
            <FriendsSidebar />
          </div>
        </div>
      </div>

      <FacebookFooter />
    </div>
  );
};

export default Profile;
