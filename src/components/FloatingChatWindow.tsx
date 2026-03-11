import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSocial } from "@/context/SocialContext";
import VerificationBadge from "@/components/VerificationBadge";
import { useVerificationBadge } from "@/hooks/useVerificationBadges";
import { useOnlineStatus } from "@/hooks/usePresence";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { validateAndCompressImage } from "@/lib/imageCompression";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string | null;
  audio_url?: string | null;
  edited_at?: string | null;
  expires_at?: string | null;
  is_deleted?: boolean;
  read: boolean;
  created_at: string;
}

interface Props {
  partnerId: string;
  partnerName: string;
  partnerPhoto: string;
  onClose: () => void;
  index: number;
}

const EMOJI_LIST = [
  "😀","😂","🥰","😍","😎","🤗","😭","😡","👍","👎",
  "❤️","🔥","🎉","👏","💪","🙏","😊","🤔","😅","🥳",
  "😘","🤣","😢","😱","🤯","💀","👀","💯","✨","🫶",
  "😏","🤝","🙌","💕","😤","🥺","😈","💔","🫡","🤩",
];

const FloatingChatWindow = ({ partnerId, partnerName, partnerPhoto, onClose, index }: Props) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isFriend } = useSocial();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [minimized, setMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEmojis, setShowEmojis] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ msgId: string; x: number; y: number } | null>(null);
  const [disappearingEnabled, setDisappearingEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const badge = useVerificationBadge(partnerId);
  const onlineUsers = useOnlineStatus([partnerId]);
  const isOnline = onlineUsers.has(partnerId);
  const canMessage = isFriend(partnerId);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const { isRecording, recordingTime, maxTime, startRecording, stopRecording, cancelRecording } = useAudioRecorder();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true })
      .limit(50);
    setMessages((data as Message[]) || []);

    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", partnerId)
      .eq("receiver_id", user.id)
      .eq("read", false);
    setUnreadCount(0);
  }, [user, partnerId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => { scrollToBottom(); }, [messages, minimized]);

  // Close emoji picker & context menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojis(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Filter expired messages client-side
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(prev => prev.filter(m => {
        if (!m.expires_at) return true;
        return new Date(m.expires_at) > new Date();
      }));
    }, 30000); // check every 30s
    return () => clearInterval(interval);
  }, []);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`floating-chat-${partnerId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        const isRelevant = (msg.sender_id === user.id && msg.receiver_id === partnerId) ||
                           (msg.sender_id === partnerId && msg.receiver_id === user.id);
        if (!isRelevant) return;
        setMessages(prev => [...prev, msg]);
        if (msg.sender_id === partnerId) {
          if (minimized) {
            setUnreadCount(c => c + 1);
          } else {
            supabase.from("messages").update({ read: true }).eq("id", msg.id);
          }
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const updated = payload.new as Message;
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, (payload) => {
        const deleted = payload.old as { id: string };
        setMessages(prev => prev.filter(m => m.id !== deleted.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, partnerId, minimized]);

  const sendMessage = async (imageUrl?: string, audioUrl?: string) => {
    if (!user || !canMessage) return;
    const content = newMessage.trim();
    if (!content && !imageUrl && !audioUrl) return;

    const insertData: any = {
      sender_id: user.id,
      receiver_id: partnerId,
      content: content || (imageUrl ? "📷 Imagem" : audioUrl ? "🎤 Áudio" : ""),
      image_url: imageUrl || null,
      audio_url: audioUrl || null,
    };

    if (disappearingEnabled) {
      insertData.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    await supabase.from("messages").insert(insertData);
    setNewMessage("");
    inputRef.current?.focus();
  };

  const handleEditMessage = async () => {
    if (!editingMsg || !newMessage.trim()) return;
    await supabase
      .from("messages")
      .update({ content: newMessage.trim(), edited_at: new Date().toISOString() } as any)
      .eq("id", editingMsg.id);
    setEditingMsg(null);
    setNewMessage("");
    inputRef.current?.focus();
  };

  const handleDeleteMessage = async (msgId: string) => {
    await supabase.from("messages").delete().eq("id", msgId);
    setContextMenu(null);
  };

  const startEdit = (msg: Message) => {
    setEditingMsg(msg);
    setNewMessage(msg.content === "📷 Imagem" || msg.content === "🎤 Áudio" ? "" : msg.content);
    setContextMenu(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const cancelEdit = () => {
    setEditingMsg(null);
    setNewMessage("");
  };

  const handleSendAudio = async () => {
    if (!user) return;
    const blob = await stopRecording();
    if (!blob) return;
    setUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.webm`;
      const { error } = await supabase.storage
        .from("chat-audio")
        .upload(fileName, blob, { contentType: "audio/webm" });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("chat-audio").getPublicUrl(fileName);
      await sendMessage(undefined, urlData.publicUrl);
    } catch (err) {
      console.error("Audio upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) return;

    setUploading(true);
    try {
      const { blob } = await validateAndCompressImage(file);
      const ext = "jpg";
      const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("chat-images")
        .upload(fileName, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(fileName);
      await sendMessage(urlData.publicUrl);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojis(false);
    inputRef.current?.focus();
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const handleToggleMinimize = () => {
    if (minimized) {
      setUnreadCount(0);
      if (user) {
        supabase.from("messages").update({ read: true })
          .eq("sender_id", partnerId)
          .eq("receiver_id", user.id)
          .eq("read", false);
      }
    }
    setMinimized(!minimized);
  };

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ msgId: msg.id, x: e.clientX, y: e.clientY });
  };

  const rightOffset = 280 + index * 328;

  const renderMessageContent = (msg: Message) => {
    const isMine = msg.sender_id === user?.id;
    if (msg.is_deleted) {
      return (
        <p className="break-words italic opacity-60 text-[10px]">
          🚫 Mensagem apagada
        </p>
      );
    }
    return (
      <>
        {msg.image_url && (
          <img
            src={msg.image_url}
            alt="Imagem"
            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity mb-1"
            style={{ maxHeight: "160px" }}
            onClick={(e) => { e.stopPropagation(); setPreviewImage(msg.image_url!); }}
          />
        )}
        {msg.audio_url && (
          <AudioPlayer src={msg.audio_url} isMine={isMine} />
        )}
        {msg.content && msg.content !== "📷 Imagem" && msg.content !== "🎤 Áudio" && (
          <p className="break-words">{msg.content}</p>
        )}
        <div className={`flex items-center gap-1 text-[9px] mt-0.5 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
          {formatTime(msg.created_at)}
          {msg.edited_at && <span className="italic">· editada</span>}
          {msg.expires_at && <span title="Mensagem temporária">⏳</span>}
          {isMine && <span>{msg.read ? "✓✓" : "✓"}</span>}
        </div>
      </>
    );
  };

  return (
    <>
      {/* Desktop: positioned from right; Mobile: centered */}
      <div
        className="fixed bottom-0 z-50 animate-scale-in lg:w-[320px] w-[95vw] max-w-[360px] left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0"
        style={{ right: undefined }}
        ref={(el) => { if (el && window.innerWidth >= 1024) { el.style.right = `${rightOffset}px`; el.style.left = 'auto'; el.style.transform = 'none'; } }}
      >
        {/* Header */}
        <div
          onClick={handleToggleMinimize}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground cursor-pointer rounded-t-lg shadow-lg hover:brightness-110 transition-all"
        >
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-primary-foreground/20 shrink-0">
            {partnerPhoto ? (
              <img src={partnerPhoto} alt={partnerName} className="w-full h-full object-cover" />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-xs">👤</span>
            )}
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold truncate">{partnerName}</span>
              <VerificationBadge {...badge} />
            </div>
            {isOnline && <span className="text-[10px] opacity-80">online</span>}
          </div>
          {unreadCount > 0 && (
            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
              {unreadCount}
            </span>
          )}
          {/* Disappearing messages toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setDisappearingEnabled(!disappearingEnabled); }}
            className={`text-sm leading-none transition-opacity ${disappearingEnabled ? "opacity-100" : "opacity-40"}`}
            title={disappearingEnabled ? "Mensagens temporárias: ON (24h)" : "Mensagens temporárias: OFF"}
          >
            ⏳
          </button>
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleMinimize(); }}
              className="text-primary-foreground/80 hover:text-primary-foreground text-lg leading-none"
            >
              {minimized ? "▲" : "▼"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="text-primary-foreground/80 hover:text-primary-foreground text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Chat body */}
        {!minimized && (
          <div className="bg-card border border-t-0 border-border shadow-2xl flex flex-col rounded-b-none" style={{ height: "350px" }}>
            {/* Disappearing indicator */}
            {disappearingEnabled && (
              <div className="px-3 py-1 bg-accent/50 text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                ⏳ Mensagens temporárias ativadas (24h)
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  {t("messages.no_conversations") || "Nenhuma mensagem ainda..."}
                </p>
              )}
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`group flex items-end gap-1.5 animate-fade-in ${isMine ? "justify-end" : "justify-start"}`}
                    onContextMenu={(e) => handleContextMenu(e, msg)}
                  >
                    {!isMine && (
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-muted shrink-0">
                        {partnerPhoto ? (
                          <img src={partnerPhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="flex items-center justify-center w-full h-full text-[8px]">👤</span>
                        )}
                      </div>
                    )}
                    <div className="relative">
                      <div
                        className={`max-w-[75%] px-3 py-1.5 text-xs rounded-2xl ${
                          isMine
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-accent text-foreground rounded-bl-sm"
                        }`}
                      >
                        {renderMessageContent(msg)}
                      </div>
                      {/* Hover actions (small dots) */}
                      <button
                        onClick={(e) => handleContextMenu(e, msg)}
                        className={`absolute top-0 ${isMine ? "-left-5" : "-right-5"} opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground text-xs transition-opacity`}
                      >
                        ⋯
                      </button>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Edit bar */}
            {editingMsg && (
              <div className="px-3 py-1.5 bg-accent/60 border-t border-border flex items-center gap-2 text-[10px]">
                <span className="text-muted-foreground flex-1 truncate">
                  ✏️ Editando: <span className="text-foreground">{editingMsg.content}</span>
                </span>
                <button onClick={cancelEdit} className="text-destructive hover:underline text-[10px]">Cancelar</button>
              </div>
            )}

            {/* Input area */}
            {canMessage ? (
              <div className="border-t border-border p-2 bg-card relative">
                {/* Emoji picker */}
                {showEmojis && (
                  <div
                    ref={emojiRef}
                    className="absolute bottom-full left-0 right-0 bg-card border border-border rounded-t-lg shadow-xl p-2 animate-fade-in"
                  >
                    <div className="grid grid-cols-8 gap-1 max-h-[120px] overflow-y-auto">
                      {EMOJI_LIST.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => insertEmoji(emoji)}
                          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-accent rounded cursor-pointer transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload progress */}
                {uploading && (
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] text-muted-foreground">Enviando...</span>
                  </div>
                )}

                {isRecording ? (
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse shrink-0" />
                    <span className="text-xs text-destructive font-mono flex-1">
                      {formatRecordingTime(recordingTime)} / {formatRecordingTime(maxTime)}
                    </span>
                    <button
                      onClick={cancelRecording}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-base cursor-pointer hover:bg-accent text-muted-foreground transition-colors shrink-0"
                      title="Cancelar"
                    >
                      ✕
                    </button>
                    <button
                      onClick={handleSendAudio}
                      className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer hover:brightness-110 transition-all shrink-0"
                      title="Enviar áudio"
                    >
                      ➤
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1.5 items-center">
                    {/* Emoji button */}
                    <button
                      onClick={() => setShowEmojis(!showEmojis)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-base cursor-pointer transition-colors shrink-0 ${
                        showEmojis ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground"
                      }`}
                      title="Emojis"
                    >
                      😊
                    </button>

                    {!editingMsg && (
                      <>
                        {/* Image upload button */}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-base cursor-pointer hover:bg-accent text-muted-foreground transition-colors shrink-0 disabled:opacity-40"
                          title="Enviar imagem"
                        >
                          📷
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </>
                    )}

                    {/* Text input */}
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          editingMsg ? handleEditMessage() : sendMessage();
                        }
                        if (e.key === "Escape" && editingMsg) {
                          cancelEdit();
                        }
                      }}
                      placeholder={editingMsg ? "Editar mensagem..." : (t("messages.placeholder") || "Digite...")}
                      className="flex-1 border border-border px-3 py-2 text-xs bg-background rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />

                    {/* Send or Record button */}
                    {editingMsg ? (
                      <button
                        onClick={handleEditMessage}
                        disabled={!newMessage.trim()}
                        className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer hover:brightness-110 disabled:opacity-40 transition-all shrink-0"
                      >
                        ✓
                      </button>
                    ) : newMessage.trim() ? (
                      <button
                        onClick={() => sendMessage()}
                        className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer hover:brightness-110 transition-all shrink-0"
                      >
                        ➤
                      </button>
                    ) : (
                      <button
                        onClick={startRecording}
                        disabled={uploading}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-base cursor-pointer hover:bg-accent text-muted-foreground transition-colors shrink-0 disabled:opacity-40"
                        title="Gravar áudio"
                      >
                        🎤
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="border-t border-border p-2 text-center bg-card">
                <p className="text-[10px] text-muted-foreground">
                  ⚠ {t("messages.friends_only") || "Apenas amigos podem trocar mensagens."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (() => {
        const msg = messages.find(m => m.id === contextMenu.msgId);
        if (!msg) return null;
        const isMine = msg.sender_id === user?.id;
        return (
          <div
            ref={contextMenuRef}
            className="fixed z-[100] bg-card border border-border rounded-lg shadow-xl py-1 min-w-[140px] animate-fade-in"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {isMine && !msg.is_deleted && !msg.image_url && !msg.audio_url && (
              <button
                onClick={() => startEdit(msg)}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors flex items-center gap-2"
              >
                ✏️ Editar
              </button>
            )}
            <button
              onClick={() => handleDeleteMessage(msg.id)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2"
            >
              🗑️ Apagar
            </button>
            <button
              onClick={() => setContextMenu(null)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors text-muted-foreground"
            >
              Cancelar
            </button>
          </div>
        );
      })()}

      {/* Image preview modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 bg-black/95 border-none flex items-center justify-center">
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingChatWindow;
