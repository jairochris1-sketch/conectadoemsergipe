import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SERGIPE_CITIES } from "@/lib/sergipeCities";
import { Phone, MapPin, ChevronRight, Plus, Trash2, ImagePlus, Pencil } from "lucide-react";
import { validateAndCompressImage } from "@/lib/imageCompression";
import ServiceEditForm from "@/components/ServiceEditForm";

interface ServiceCategory {
  id: string;
  name: string;
  sort_order: number;
}

interface ServiceSubcategory {
  id: string;
  category_id: string;
  name: string;
  sort_order: number;
}

interface ServiceListing {
  id: string;
  user_id: string;
  category_id: string;
  subcategory_id: string | null;
  title: string;
  description: string;
  whatsapp: string;
  city: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  profile?: { name: string; photo_url: string | null };
}

const Services = () => {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [subcategories, setSubcategories] = useState<ServiceSubcategory[]>([]);
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingListing, setEditingListing] = useState<ServiceListing | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newListing, setNewListing] = useState({
    title: "",
    description: "",
    whatsapp: "",
    city: "",
    category_id: "",
    subcategory_id: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory);
      fetchListings();
    }
  }, [selectedCategory, selectedSubcategory]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("service_categories")
      .select("*")
      .order("sort_order");
    setCategories(data || []);
    setLoading(false);
  };

  const fetchSubcategories = async (categoryId: string) => {
    const { data } = await supabase
      .from("service_subcategories")
      .select("*")
      .eq("category_id", categoryId)
      .order("sort_order");
    setSubcategories(data || []);
  };

  const fetchListings = async () => {
    let query = supabase
      .from("service_listings")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (selectedCategory) {
      query = query.eq("category_id", selectedCategory);
    }
    if (selectedSubcategory) {
      query = query.eq("subcategory_id", selectedSubcategory);
    }

    const { data } = await query;

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((l) => l.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, photo_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));
      const enriched = data.map((l) => ({
        ...l,
        profile: profileMap.get(l.user_id),
      }));
      setListings(enriched);
    } else {
      setListings([]);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Faça login para anunciar");
      return;
    }
    if (!newListing.title.trim() || !newListing.category_id || !newListing.whatsapp.trim()) {
      toast.error("Preencha título, categoria e WhatsApp");
      return;
    }

    setUploading(true);
    let uploadedUrl = "";

    try {
      if (imageFile) {
        const { blob } = await validateAndCompressImage(imageFile);
        const path = `services/${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(path, blob, { contentType: "image/jpeg" });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
          uploadedUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from("service_listings").insert({
        user_id: user.id,
        title: newListing.title.trim(),
        description: newListing.description.trim(),
        whatsapp: newListing.whatsapp.trim(),
        city: newListing.city,
        category_id: newListing.category_id,
        subcategory_id: newListing.subcategory_id || null,
        image_url: uploadedUrl,
      });

      if (error) {
        toast.error("Erro ao criar anúncio");
      } else {
        toast.success("Serviço anunciado!");
        setShowForm(false);
        setNewListing({ title: "", description: "", whatsapp: "", city: "", category_id: "", subcategory_id: "" });
        setImageFile(null);
        setImagePreview(null);
        fetchListings();
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este anúncio?")) return;
    await supabase.from("service_listings").delete().eq("id", id);
    toast.success("Anúncio removido");
    fetchListings();
  };

  const selectedCategoryName = categories.find((c) => c.id === selectedCategory)?.name;
  const filteredSubcategories = subcategories.filter((s) => s.category_id === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />

      <div className="max-w-[900px] mx-auto px-2 py-3">
        <div className="bg-card border border-border p-3 mb-3">
          <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
            <h2 className="text-lg font-bold text-primary">🛠️ Serviços</h2>
            {user && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-primary text-primary-foreground px-3 py-1.5 text-sm flex items-center gap-1 hover:opacity-90 rounded-sm"
              >
                <Plus className="w-4 h-4" /> Anunciar
              </button>
            )}
          </div>

          {/* Form */}
          {showForm && (
            <div className="border border-border p-3 mb-4 bg-accent rounded-sm space-y-3">
              <h3 className="text-sm font-bold">Novo Anúncio de Serviço</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">Categoria *</label>
                  <select
                    value={newListing.category_id}
                    onChange={(e) => {
                      setNewListing({ ...newListing, category_id: e.target.value, subcategory_id: "" });
                      if (e.target.value) fetchSubcategories(e.target.value);
                    }}
                    className="w-full border border-border p-2 text-sm bg-card rounded-sm"
                  >
                    <option value="">Selecione...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {subcategories.filter((s) => s.category_id === newListing.category_id).length > 0 && (
                  <div>
                    <label className="text-xs font-bold block mb-1">Subcategoria</label>
                    <select
                      value={newListing.subcategory_id}
                      onChange={(e) => setNewListing({ ...newListing, subcategory_id: e.target.value })}
                      className="w-full border border-border p-2 text-sm bg-card rounded-sm"
                    >
                      <option value="">Nenhuma</option>
                      {subcategories
                        .filter((s) => s.category_id === newListing.category_id)
                        .map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold block mb-1">Título *</label>
                  <input
                    type="text"
                    value={newListing.title}
                    onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                    placeholder="Ex: Eletricista residencial"
                    className="w-full border border-border p-2 text-sm bg-card rounded-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">WhatsApp *</label>
                  <input
                    type="text"
                    value={newListing.whatsapp}
                    onChange={(e) => setNewListing({ ...newListing, whatsapp: e.target.value })}
                    placeholder="(79) 99999-9999"
                    className="w-full border border-border p-2 text-sm bg-card rounded-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Cidade</label>
                  <select
                    value={newListing.city}
                    onChange={(e) => setNewListing({ ...newListing, city: e.target.value })}
                    className="w-full border border-border p-2 text-sm bg-card rounded-sm"
                  >
                    <option value="">Selecione...</option>
                    {SERGIPE_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Descrição</label>
                <textarea
                  value={newListing.description}
                  onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                  placeholder="Descreva seu serviço..."
                  rows={2}
                  className="w-full border border-border p-2 text-sm bg-card rounded-sm resize-none"
                />
              </div>

              {/* Image upload */}
              <div>
                <label className="text-xs font-bold block mb-1">Imagem (opcional)</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs border border-border bg-card hover:bg-muted rounded-sm cursor-pointer"
                  >
                    <ImagePlus className="w-4 h-4" /> Selecionar imagem
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  {imagePreview && (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-sm border border-border" />
                      <button
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground w-5 h-5 rounded-full text-[10px] flex items-center justify-center cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="bg-primary text-primary-foreground px-4 py-2 text-sm hover:opacity-90 rounded-sm disabled:opacity-50"
                >
                  {uploading ? "Enviando..." : "Publicar"}
                </button>
                <button
                  onClick={() => { setShowForm(false); setImageFile(null); setImagePreview(null); }}
                  className="bg-muted text-foreground border border-border px-4 py-2 text-sm hover:opacity-90 rounded-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Categories grid */}
          {!selectedCategory && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedSubcategory(null);
                  }}
                  className="bg-accent hover:bg-muted border border-border p-3 text-left text-sm font-medium flex items-center justify-between rounded-sm cursor-pointer"
                >
                  <span className="truncate">{cat.name}</span>
                  <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
              {loading && <p className="col-span-full text-xs text-muted-foreground">Carregando...</p>}
              {!loading && categories.length === 0 && (
                <p className="col-span-full text-xs text-muted-foreground">Nenhuma categoria disponível.</p>
              )}
            </div>
          )}

          {/* Selected category view */}
          {selectedCategory && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                    setListings([]);
                  }}
                  className="text-primary text-sm hover:underline bg-transparent border-none cursor-pointer"
                >
                  ← Voltar
                </button>
                <span className="text-sm font-bold">{selectedCategoryName}</span>
              </div>

              {/* Subcategories */}
              {filteredSubcategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    onClick={() => setSelectedSubcategory(null)}
                    className={`px-3 py-1 text-xs border rounded-sm cursor-pointer ${
                      !selectedSubcategory ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"
                    }`}
                  >
                    Todos
                  </button>
                  {filteredSubcategories.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubcategory(sub.id)}
                      className={`px-3 py-1 text-xs border rounded-sm cursor-pointer ${
                        selectedSubcategory === sub.id ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Listings */}
              <div className="space-y-2">
                {listings.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum serviço anunciado nesta categoria.</p>
                )}
                {listings.map((listing) => (
                  <div key={listing.id} className="border border-border bg-card rounded-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      {/* Image */}
                      <div className="sm:w-[140px] h-[140px] sm:h-auto bg-muted shrink-0 flex items-center justify-center overflow-hidden">
                        {listing.image_url ? (
                          <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground text-xs gap-1 p-4">
                            <span className="text-3xl">🛠️</span>
                            <span>Sem imagem</span>
                          </div>
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 p-3 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-muted border border-border rounded-full overflow-hidden shrink-0">
                              {listing.profile?.photo_url ? (
                                <img src={listing.profile.photo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs text-muted-foreground flex items-center justify-center h-full">👤</span>
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold">{listing.title}</h4>
                              <Link to={`/user/${listing.user_id}`} className="text-xs text-primary hover:underline">
                                {listing.profile?.name || "Usuário"}
                              </Link>
                            </div>
                          </div>
                          {user && listing.user_id === user.id && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setEditingListing(listing)}
                                className="text-primary bg-transparent border-none cursor-pointer p-1 hover:opacity-70"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(listing.id)}
                                className="text-destructive bg-transparent border-none cursor-pointer p-1 hover:opacity-70"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        {listing.description && (
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{listing.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {listing.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {listing.city}
                            </span>
                          )}
                          {listing.whatsapp && (
                            <a
                              href={`https://wa.me/55${listing.whatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-green-600 hover:underline"
                            >
                              <Phone className="w-3 h-3" /> WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <FacebookFooter />
    </div>
  );
};

export default Services;
