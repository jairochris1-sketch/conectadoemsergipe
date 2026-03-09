import { useState, useRef, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
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
import { useFollowedStores } from "@/hooks/useStoreFollowers";
import { supabase } from "@/integrations/supabase/client";
import { SERGIPE_CITIES } from "@/lib/sergipeCities";
import ProfileLinksDisplay from "@/components/ProfileLinksDisplay";
import { Store, MapPin } from "lucide-react";

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
  const [hasStore, setHasStore] = useState<boolean | null>(null);
  const [storeSlug, setStoreSlug] = useState("");

  const friends = user ? getFriends() : [];
  const { followerCount } = useFollowers(user?.id);
  const badge = useVerificationBadge(user?.id);
  const { stores: followedStores } = useFollowedStores();

  useEffect(() => {
    if (user) {
      supabase.from("stores").select("slug").eq("user_id", user.id).eq("is_active", true).maybeSingle()
        .then(({ data }) => {
          setHasStore(!!data);
          if (data) setStoreSlug((data as any).slug);
        });
    }
  }, [user]);

  if (!user) return <Navigate to="/login" />;

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
      <div className="max-w-[980px] mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <div className="bg-card border border-border p-5">
              <div className="border-b border-border pb-3 mb-4">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
                  {t("profile_of")} {user.name}
                  <VerificationBadge {...badge} size="md" />
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="shrink-0">
                  <img
                    src={user.photoUrl || "/placeholder.svg"}
                    alt={user.name}
                    className="w-[180px] h-[180px] border border-border object-cover cursor-pointer rounded-sm"
                    onClick={() => fileInputRef.current?.click()}
                    title={t("click_to_change")}
                  />
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="mt-2 text-sm text-primary cursor-pointer bg-transparent border-none hover:underline w-full text-center">
                    {t("change_photo")}
                  </button>
                </div>
                {!editing ? (
                  <div className="text-base space-y-2">
                    <p><b>{t("name")}:</b> {user.name}</p>
                    <p><b>{t("school")}:</b> {user.school || "-"}</p>
                    <p><b>{t("city")}:</b> {user.city || "-"}</p>
                    <p><b>{t("birthdate")}:</b> {user.birthdate ? new Date(user.birthdate).toLocaleDateString() : "-"}</p>
                    <p><b>{t("bio")}:</b> {user.bio || t("no_bio")}</p>
                    <p><b>{t("friends")}:</b> {friends.length}</p>
                    <p><b>{t("admin.followers")}:</b> {followerCount}</p>
                    <ProfileLinksDisplay userId={user.id} />
                  </div>
                ) : (
                  <div className="space-y-3 flex-1">
                    <div>
                      <label className="block font-bold text-sm mb-1">{t("name")}:</label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full border border-border px-3 py-2 text-base bg-card rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-sm mb-1">{t("school")}:</label>
                      <input
                        value={editSchool}
                        onChange={(e) => setEditSchool(e.target.value)}
                        className="w-full border border-border px-3 py-2 text-base bg-card rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-sm mb-1">{t("city")}:</label>
                      <select
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="w-full border border-border px-3 py-2 text-base bg-card rounded-sm"
                      >
                        <option value="">Selecione...</option>
                        {SERGIPE_CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-sm mb-1">{t("birthdate")}:</label>
                      <input
                        type="date"
                        value={editBirthdate}
                        onChange={(e) => setEditBirthdate(e.target.value)}
                        className="w-full border border-border px-3 py-2 text-base bg-card rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-sm mb-1">{t("bio")}:</label>
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        className="w-full border border-border px-3 py-2 text-base resize-none bg-card rounded-sm"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
              {!editing ? (
                <div className="flex flex-wrap gap-3 mt-4">
                  <button onClick={startEditing} className="bg-primary text-primary-foreground border-none px-5 py-2.5 text-base cursor-pointer hover:opacity-90 rounded-sm font-medium">
                    {t("edit_profile")}
                  </button>
                  {hasStore === false && (
                    <Link to="/stores/create" className="no-underline">
                      <button className="bg-accent text-accent-foreground border border-border px-5 py-2.5 text-base cursor-pointer hover:opacity-90 rounded-sm font-medium">
                        🏪 Criar Loja
                      </button>
                    </Link>
                  )}
                  {hasStore === true && (
                    <Link to="/minha-loja" className="no-underline">
                      <button className="bg-accent text-accent-foreground border border-border px-5 py-2.5 text-base cursor-pointer hover:opacity-90 rounded-sm font-medium">
                        🏪 Minha Loja
                      </button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex gap-3 mt-4">
                  <button onClick={handleSave} className="bg-primary text-primary-foreground border-none px-5 py-2.5 text-base cursor-pointer hover:opacity-90 rounded-sm font-medium">{t("save")}</button>
                  <button onClick={() => setEditing(false)} className="bg-muted text-foreground border border-border px-5 py-2.5 text-base cursor-pointer hover:opacity-90 rounded-sm font-medium">{t("cancel")}</button>
                </div>
              )}
            </div>

            <div className="bg-card border border-border p-5 mt-4">
              <div className="border-b border-border pb-3 mb-4">
                <h3 className="text-lg font-bold text-primary" style={{ fontFamily: 'Georgia, serif' }}>
                  {t("friends")} ({friends.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {friends.length > 0 ? friends.map((friend) => (
                  <div key={friend.id} className="flex items-center gap-3 text-sm border border-border p-2 rounded-sm">
                    <div className="w-[40px] h-[40px] bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0 rounded-sm">
                      {friend.photo ? <img src={friend.photo} alt={friend.name} className="w-full h-full object-cover" /> : <span className="text-xs text-muted-foreground">{t("photo")}</span>}
                    </div>
                    <a href="#" className="font-bold truncate">{friend.name}</a>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground col-span-3">{t("friends.none")}</p>
                )}
              </div>
            </div>
          </div>
          <div className="w-full md:w-[220px] md:shrink-0">
            <FriendsSidebar />
          </div>
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default Profile;
