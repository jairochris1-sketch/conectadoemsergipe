import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Calendar, MapPin, Plus, Trash2, Clock, X, Edit2 } from "lucide-react";
import { SERGIPE_CITIES } from "@/lib/sergipeCities";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CulturalEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_end_date: string | null;
  location: string;
  city: string | null;
  image_url: string | null;
  category: string;
  created_by: string;
  created_at: string;
}

const EVENT_CATEGORIES = [
  "Geral", "Música", "Teatro", "Dança", "Cinema", "Exposição", 
  "Festival", "Feira", "Palestra", "Workshop", "Esporte", "Religioso", "Outros"
];

const CulturalEvents = () => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<CulturalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterCity, setFilterCity] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("Geral");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("cultural_events")
      .select("*")
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true });
    setEvents((data as unknown as CulturalEvent[]) || []);
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setEventDate(""); setEventEndDate("");
    setLocation(""); setCity(""); setCategory("Geral");
    setImageFile(null); setImagePreview(""); setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!user || !title.trim() || !eventDate || !location.trim()) {
      toast.error("Preencha título, data e local");
      return;
    }
    setPosting(true);

    let image_url = "";
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/events/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("post-images").upload(path, imageFile, { upsert: true });
      if (!error) {
        const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }
    }

    const payload: any = {
      title: title.trim(),
      description: description.trim() || null,
      event_date: new Date(eventDate).toISOString(),
      event_end_date: eventEndDate ? new Date(eventEndDate).toISOString() : null,
      location: location.trim(),
      city: city || null,
      category,
      created_by: user.id,
    };
    if (image_url) payload.image_url = image_url;

    if (editingId) {
      const { error } = await supabase.from("cultural_events").update(payload).eq("id", editingId);
      if (error) { toast.error("Erro ao atualizar"); setPosting(false); return; }
      toast.success("Evento atualizado!");
    } else {
      if (!image_url) payload.image_url = null;
      const { error } = await supabase.from("cultural_events").insert(payload);
      if (error) { toast.error("Erro ao criar evento"); setPosting(false); return; }
      toast.success("Evento criado!");
    }

    setPosting(false);
    resetForm();
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este evento?")) return;
    await supabase.from("cultural_events").delete().eq("id", id);
    toast.success("Evento excluído");
    fetchEvents();
  };

  const startEdit = (ev: CulturalEvent) => {
    setEditingId(ev.id);
    setTitle(ev.title);
    setDescription(ev.description || "");
    setEventDate(new Date(ev.event_date).toISOString().slice(0, 16));
    setEventEndDate(ev.event_end_date ? new Date(ev.event_end_date).toISOString().slice(0, 16) : "");
    setLocation(ev.location);
    setCity(ev.city || "");
    setCategory(ev.category);
    setImagePreview(ev.image_url || "");
    setShowForm(true);
  };

  const filtered = events.filter(ev => {
    if (filterCity && ev.city !== filterCity) return false;
    if (filterCategory && ev.category !== filterCategory) return false;
    return true;
  });

  // Group events by month
  const grouped = filtered.reduce<Record<string, CulturalEvent[]>>((acc, ev) => {
    const key = format(new Date(ev.event_date), "MMMM yyyy", { locale: ptBR });
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Agenda Cultural - Conectadoemsergipe" description="Eventos culturais em Sergipe" />
      <FacebookHeader isLoggedIn={!!user} userName={user?.name} onLogout={logout} />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 pt-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" /> Agenda Cultural
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Eventos culturais em Sergipe</p>
          </div>
          {user && (
            <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="gap-1.5">
              <Plus className="w-4 h-4" /> Criar Evento
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-xs h-8"
          >
            <option value="">Todas as cidades</option>
            {SERGIPE_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-xs h-8"
          >
            <option value="">Todas as categorias</option>
            {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm">
                {editingId ? "Editar Evento" : "Novo Evento"}
              </h3>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome do evento *" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data/hora início *</label>
                <Input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data/hora fim (opcional)</label>
                <Input type="datetime-local" value={eventEndDate} onChange={e => setEventEndDate(e.target.value)} />
              </div>
            </div>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Local do evento *" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={city} onChange={e => setCity(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10">
                <option value="">Cidade</option>
                {SERGIPE_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10">
                {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none"
              placeholder="Descrição do evento"
            />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Imagem (opcional)</label>
              <div className="flex items-center gap-3">
                {imagePreview && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="text-xs" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={posting} size="sm">
                {posting ? "Salvando..." : editingId ? "Atualizar" : "Criar Evento"}
              </Button>
              <Button variant="ghost" size="sm" onClick={resetForm}>Cancelar</Button>
            </div>
          </div>
        )}

        {/* Events list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum evento encontrado</p>
          </div>
        ) : (
          Object.entries(grouped).map(([month, evts]) => (
            <div key={month} className="mb-6">
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3 capitalize">{month}</h2>
              <div className="space-y-3">
                {evts.map(ev => {
                  const date = new Date(ev.event_date);
                  const isOwner = user?.id === ev.created_by;
                  return (
                    <div key={ev.id} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition-shadow">
                      {/* Date column */}
                      <div className="w-full sm:w-20 bg-primary/5 flex sm:flex-col items-center justify-center p-3 gap-1 shrink-0">
                        <span className="text-2xl font-bold text-primary">{format(date, "dd")}</span>
                        <span className="text-xs text-primary font-medium uppercase">{format(date, "MMM", { locale: ptBR })}</span>
                      </div>
                      {/* Image */}
                      {ev.image_url && (
                        <div className="sm:w-36 shrink-0">
                          <img src={ev.image_url} alt={ev.title} className="w-full h-32 sm:h-full object-cover" />
                        </div>
                      )}
                      {/* Content */}
                      <div className="flex-1 p-3 sm:p-4 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground text-sm">{ev.title}</h3>
                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(date, "HH:mm")}
                                {ev.event_end_date && ` - ${format(new Date(ev.event_end_date), "HH:mm")}`}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {ev.location}
                              </span>
                              {ev.city && (
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{ev.city}</span>
                              )}
                            </div>
                            <span className="inline-block mt-1 text-[10px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{ev.category}</span>
                          </div>
                          {isOwner && (
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => startEdit(ev)} className="text-muted-foreground hover:text-primary p-1">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(ev.id)} className="text-muted-foreground hover:text-destructive p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        {ev.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ev.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
      <FacebookFooter />
    </div>
  );
};

export default CulturalEvents;
