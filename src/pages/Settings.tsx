import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Bell, Lock, Palette, User, LogOut, Shield, Eye, Moon, Sun, Volume2, ArrowLeft, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

interface UserSettings {
  // Privacy
  profileVisibility: "public" | "friends" | "private";
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  allowMessagesFrom: "everyone" | "friends" | "nobody";
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  messageNotifications: boolean;
  friendRequestNotifications: boolean;
  marketplaceNotifications: boolean;
  soundEnabled: boolean;
  
  // Preferences
  theme: "light" | "dark" | "system";
  language: "pt" | "en";
  compactMode: boolean;
}

const defaultSettings: UserSettings = {
  profileVisibility: "public",
  showOnlineStatus: true,
  showLastSeen: true,
  allowMessagesFrom: "everyone",
  emailNotifications: true,
  pushNotifications: true,
  messageNotifications: true,
  friendRequestNotifications: true,
  marketplaceNotifications: true,
  soundEnabled: true,
  theme: "light",
  language: "pt",
  compactMode: false,
};

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    // Load settings from database
    const loadSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error loading settings:", error);
        setLoading(false);
        return;
      }
      
      if (data) {
        setSettings({
          profileVisibility: data.profile_visibility as UserSettings["profileVisibility"],
          showOnlineStatus: data.show_online_status,
          showLastSeen: data.show_last_seen,
          allowMessagesFrom: data.allow_messages_from as UserSettings["allowMessagesFrom"],
          emailNotifications: data.email_notifications,
          pushNotifications: data.push_notifications,
          messageNotifications: data.message_notifications,
          friendRequestNotifications: data.friend_request_notifications,
          marketplaceNotifications: data.marketplace_notifications,
          soundEnabled: data.sound_enabled,
          theme: data.theme as UserSettings["theme"],
          language: data.language as UserSettings["language"],
          compactMode: data.compact_mode,
        });
      }
      setLoading(false);
    };
    
    loadSettings();
  }, [user, navigate]);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    if (!user) return;
    setSaving(true);
    
    const dbSettings = {
      user_id: user.id,
      profile_visibility: settings.profileVisibility,
      show_online_status: settings.showOnlineStatus,
      show_last_seen: settings.showLastSeen,
      allow_messages_from: settings.allowMessagesFrom,
      email_notifications: settings.emailNotifications,
      push_notifications: settings.pushNotifications,
      message_notifications: settings.messageNotifications,
      friend_request_notifications: settings.friendRequestNotifications,
      marketplace_notifications: settings.marketplaceNotifications,
      sound_enabled: settings.soundEnabled,
      theme: settings.theme,
      language: settings.language,
      compact_mode: settings.compactMode,
    };
    
    // Use upsert to insert or update
    const { error } = await supabase
      .from("user_settings")
      .upsert(dbSettings, { onConflict: "user_id" });
    
    if (error) {
      console.error("Error saving settings:", error);
      toast({ title: "Erro", description: "Não foi possível salvar as configurações.", variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas!", description: "Suas preferências foram atualizadas." });
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) return null;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header for settings */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold">Configurações</h1>
        </div>
      </header>
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-muted-foreground text-sm">Gerencie suas preferências de conta</p>
          </div>
        </div>

        <Tabs defaultValue="privacy" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Privacidade</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Preferências</span>
            </TabsTrigger>
          </TabsList>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-primary" />
                  Visibilidade do Perfil
                </CardTitle>
                <CardDescription>Controle quem pode ver seu perfil e informações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Quem pode ver meu perfil?</Label>
                  <RadioGroup 
                    value={settings.profileVisibility} 
                    onValueChange={(v) => updateSetting("profileVisibility", v as any)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public" className="flex-1 cursor-pointer">
                        <span className="font-medium">Público</span>
                        <p className="text-xs text-muted-foreground">Qualquer pessoa pode ver seu perfil</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="friends" id="friends" />
                      <Label htmlFor="friends" className="flex-1 cursor-pointer">
                        <span className="font-medium">Apenas amigos</span>
                        <p className="text-xs text-muted-foreground">Somente seus amigos podem ver</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="private" id="private" />
                      <Label htmlFor="private" className="flex-1 cursor-pointer">
                        <span className="font-medium">Privado</span>
                        <p className="text-xs text-muted-foreground">Ninguém pode ver seu perfil</p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-medium flex items-center gap-2">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        Mostrar status online
                      </Label>
                      <p className="text-xs text-muted-foreground">Outros podem ver quando você está online</p>
                    </div>
                    <Switch 
                      checked={settings.showOnlineStatus} 
                      onCheckedChange={(v) => updateSetting("showOnlineStatus", v)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-medium">Mostrar "visto por último"</Label>
                      <p className="text-xs text-muted-foreground">Outros podem ver quando você esteve online</p>
                    </div>
                    <Switch 
                      checked={settings.showLastSeen} 
                      onCheckedChange={(v) => updateSetting("showLastSeen", v)} 
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-sm font-medium">Quem pode me enviar mensagens?</Label>
                  <RadioGroup 
                    value={settings.allowMessagesFrom} 
                    onValueChange={(v) => updateSetting("allowMessagesFrom", v as any)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="everyone" id="msg-everyone" />
                      <Label htmlFor="msg-everyone" className="cursor-pointer">Todos</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="friends" id="msg-friends" />
                      <Label htmlFor="msg-friends" className="cursor-pointer">Apenas amigos</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="nobody" id="msg-nobody" />
                      <Label htmlFor="msg-nobody" className="cursor-pointer">Ninguém</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="w-5 h-5 text-primary" />
                  Notificações
                </CardTitle>
                <CardDescription>Configure como você deseja receber notificações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Notificações por email</Label>
                    <p className="text-xs text-muted-foreground">Receba atualizações no seu email</p>
                  </div>
                  <Switch 
                    checked={settings.emailNotifications} 
                    onCheckedChange={(v) => updateSetting("emailNotifications", v)} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Notificações push</Label>
                    <p className="text-xs text-muted-foreground">Receba notificações no navegador</p>
                  </div>
                  <Switch 
                    checked={settings.pushNotifications} 
                    onCheckedChange={(v) => updateSetting("pushNotifications", v)} 
                  />
                </div>

                <div className="border-t pt-5 space-y-5">
                  <h4 className="font-medium text-sm text-muted-foreground">Tipos de notificação</h4>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-medium">Novas mensagens</Label>
                      <p className="text-xs text-muted-foreground">Quando alguém te envia uma mensagem</p>
                    </div>
                    <Switch 
                      checked={settings.messageNotifications} 
                      onCheckedChange={(v) => updateSetting("messageNotifications", v)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-medium">Solicitações de amizade</Label>
                      <p className="text-xs text-muted-foreground">Quando alguém quer ser seu amigo</p>
                    </div>
                    <Switch 
                      checked={settings.friendRequestNotifications} 
                      onCheckedChange={(v) => updateSetting("friendRequestNotifications", v)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-medium">Marketplace</Label>
                      <p className="text-xs text-muted-foreground">Atualizações sobre seus anúncios</p>
                    </div>
                    <Switch 
                      checked={settings.marketplaceNotifications} 
                      onCheckedChange={(v) => updateSetting("marketplaceNotifications", v)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-medium flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                        Sons de notificação
                      </Label>
                      <p className="text-xs text-muted-foreground">Reproduzir som ao receber notificações</p>
                    </div>
                    <Switch 
                      checked={settings.soundEnabled} 
                      onCheckedChange={(v) => updateSetting("soundEnabled", v)} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Palette className="w-5 h-5 text-primary" />
                  Aparência
                </CardTitle>
                <CardDescription>Personalize a aparência do site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Tema</Label>
                  <RadioGroup 
                    value={settings.theme} 
                    onValueChange={(v) => updateSetting("theme", v as any)}
                    className="grid grid-cols-3 gap-3"
                  >
                    <div className="relative">
                      <RadioGroupItem value="light" id="theme-light" className="sr-only" />
                      <Label 
                        htmlFor="theme-light" 
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          settings.theme === "light" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
                        }`}
                      >
                        <Sun className="w-6 h-6" />
                        <span className="text-sm font-medium">Claro</span>
                      </Label>
                    </div>
                    <div className="relative">
                      <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
                      <Label 
                        htmlFor="theme-dark" 
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          settings.theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
                        }`}
                      >
                        <Moon className="w-6 h-6" />
                        <span className="text-sm font-medium">Escuro</span>
                      </Label>
                    </div>
                    <div className="relative">
                      <RadioGroupItem value="system" id="theme-system" className="sr-only" />
                      <Label 
                        htmlFor="theme-system" 
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          settings.theme === "system" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary/60 to-muted-foreground" />
                        <span className="text-sm font-medium">Sistema</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Modo compacto</Label>
                    <p className="text-xs text-muted-foreground">Reduz espaçamentos para mostrar mais conteúdo</p>
                  </div>
                  <Switch 
                    checked={settings.compactMode} 
                    onCheckedChange={(v) => updateSetting("compactMode", v)} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                  <LogOut className="w-5 h-5" />
                  Sair da conta
                </CardTitle>
                <CardDescription>Encerrar sua sessão neste dispositivo</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair da minha conta
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="sticky bottom-4 mt-6">
          <Button onClick={saveSettings} disabled={saving} className="w-full h-12 text-base shadow-lg">
            {saving ? "Salvando..." : "Salvar configurações"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
