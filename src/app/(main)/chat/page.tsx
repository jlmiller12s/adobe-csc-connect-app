"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient, getSharedSession, runSupabaseOperation } from "@/lib/supabase/client";
import { Hash, Plus, Image as ImageIcon, Smile, Send, Loader2, MessageCircle, X, Trash2, ChevronDown } from "lucide-react";

type Channel = { id: string; name: string };
type Message = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  image_url: string | null;
  profiles: { name: string; avatar_url: string | null };
};

// Helper to convert VAPID public key for PushManager.subscribe()
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return arr;
}

// A lightweight emoji picker built with no external dependencies
const EMOJI_CATEGORIES: Record<string, string[]> = {
  "Smileys": ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳"],
  "Gestures": ["👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏"],
  "People": ["👶","🧒","👦","👧","🧑","👱","👨","🧔","👩","🧓","👴","👵","🧕","👮","💂","🕵","👷","🤴","👸","👰","🤵","🧙","🧚","🧛","🧟","🧞","🧜","🧝","🦸","🦹"],
  "Nature": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐙","🐵","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🕷","🦂","🐢","🐍","🦎"],
  "Food": ["🍎","🍊","🍋","🍇","🍓","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶","🌽","🥕","🧄","🧅","🥔","🍠","🥐","🥯","🍞","🥖","🥨","🧀"],
  "Activities": ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷"],
  "Travel": ["🚗","🚕","🚙","🚌","🚎","🏎","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍","🛵","🛺","🚲","🛴","🛹","🛼","🚏","🛣","🛤","⛽","🚨","🚥","🚦","🛑","🚧"],
  "Objects": ["⌚","📱","📲","💻","⌨","🖥","🖨","🖱","🖲","🕹","🗜","💾","💿","📀","📼","📷","📸","📹","🎥","📽","🎞","📞","☎","📟","📠","📺","📻","🧭","⏱","⏲"],
  "Symbols": ["❤","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣","💕","💞","💓","💗","💖","💘","💝","💟","☮","✝","☪","🕉","☸","✡","🔯","🕎","☯","☦","🛐","⛎"],
};

function InlineEmojiPicker({ onEmojiSelect }: { onEmojiSelect: (emoji: string) => void }) {
  const [activeCategory, setActiveCategory] = useState("Smileys");
  const categories = Object.keys(EMOJI_CATEGORIES);
  return (
    <div className="w-72 max-h-80 flex flex-col bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
      <div className="flex overflow-x-auto border-b border-gray-100 dark:border-gray-800 shrink-0 scrollbar-hide">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-2 text-xs whitespace-nowrap font-medium transition-colors ${activeCategory === cat ? 'text-adobe-red border-b-2 border-adobe-red' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}>
            {cat}
          </button>
        ))}
      </div>
      <div className="overflow-y-auto p-2 grid grid-cols-8 gap-0.5">
        {EMOJI_CATEGORIES[activeCategory].map((emoji, i) => (
          <button key={i} onClick={() => onEmojiSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center rounded-md text-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

function DeleteModal({ onConfirm, onCancel, isDeleting }: {
  onConfirm: () => void; onCancel: () => void; isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-200/50 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
          <Trash2 className="text-red-500" size={22} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-1">Delete Message</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">This message will be permanently removed from the conversation.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isDeleting}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('Someone');
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  
  // Emoji / image state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Delete state
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeContextMenu, setActiveContextMenu] = useState<string | null>(null);

  // Mobile channel switcher
  const [showMobileChannels, setShowMobileChannels] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Close emoji picker on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close context menus on outside click
  useEffect(() => {
    function handleWindowClick() { setActiveContextMenu(null); }
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  // Push notification subscription
  useEffect(() => {
    if (!currentUser) return;
    async function subscribeToPush() {
      try {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        const sub = existing ?? await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!).buffer as ArrayBuffer,
        });
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON(), user_id: currentUser!.id }),
        });
      } catch (err) {
        console.warn('Push subscription failed:', err);
      }
    }
    subscribeToPush();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Load User and Channels
  useEffect(() => {
    async function initializeChat() {
      try {
        setInitError(null);
        const { data: { session } } = await getSharedSession();
        setCurrentUser(session?.user || null);

        // Fetch the current user's display name for push notification payloads
        if (session?.user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .maybeSingle();
          if (profile?.name) setCurrentUserName(profile.name);
        }
        const channelsResult = await runSupabaseOperation(
          "Loading chat channels",
          (client) => client.from('channels').select('*').order('created_at')
        ) as { data: Channel[] | null; error: { message?: string } | null };
        const { data: channelsData, error } = channelsResult;
        if (error) {
          setInitError(error.message || "Failed to load chat channels.");
        } else if (channelsData && channelsData.length > 0) {
          setChannels(channelsData);
          setSelectedChannel(channelsData[0]);
        }
      } catch (err) {
        setInitError(err instanceof Error ? err.message : "Failed to initialize chat.");
      } finally {
        setLoading(false);
      }
    }
    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load messages & realtime subscriptions
  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel>;
    async function loadMessages() {
      if (!selectedChannel) return;
      const messagesResult = await runSupabaseOperation(
        "Loading channel messages",
        (client) => client.from('messages')
          .select(`*, profiles(name, avatar_url)`)
          .eq('channel_id', selectedChannel.id)
          .order('created_at', { ascending: true })
      ) as { data: Message[] | null };
      const { data } = messagesResult;
      if (data) setMessages(data as unknown as Message[]);

      subscription = supabase
        .channel(`messages:channel_id=eq.${selectedChannel.id}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${selectedChannel.id}` },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          async (payload: any) => {
            const { data: profileData } = await supabase.from('profiles').select('name, avatar_url').eq('id', payload.new.user_id).maybeSingle();
            setMessages((prev) => [...prev, { ...payload.new, profiles: profileData || { name: 'Unknown', avatar_url: null } } as Message]);
          }
        )
        .on('postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'messages', filter: `channel_id=eq.${selectedChannel.id}` },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        )
        .subscribe();
    }
    loadMessages();
    return () => { if (subscription) subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      let file = e.target.files[0];
      
      if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        try {
          const heic2any = (await import("heic2any")).default;
          const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg" });
          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          file = new File([blob], file.name.replace(/\.heic|\.heif/i, ".jpg"), { type: "image/jpeg" });
        } catch (convErr) {
          console.error("HEIC conversion error:", convErr);
        }
      }

      setSelectedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreviewUrl) { URL.revokeObjectURL(imagePreviewUrl); setImagePreviewUrl(null); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !selectedChannel || !currentUser || isSending) return;
    setIsSending(true);
    let uploadedImageUrl = null;
    try {
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `chat/${selectedChannel.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('photos').upload(filePath, selectedImage);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filePath);
        uploadedImageUrl = publicUrl;
      }
      const content = newMessage.trim();
      const { error } = await supabase.from('messages').insert({
        channel_id: selectedChannel.id,
        user_id: currentUser.id,
        content: content || null,
        image_url: uploadedImageUrl
      });
      if (error) throw error;

      // Fire push notifications to all other subscribers
      const preview = content || (selectedImage ? '📷 Photo' : '');
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_name: selectedChannel.name,
          sender_name: currentUserName,
          message_preview: preview.slice(0, 100),
          channel_id: selectedChannel.id,
          sender_user_id: currentUser.id,
        }),
      }).catch(console.warn); // Fire-and-forget, don't block UI

      setNewMessage("");
      removeSelectedImage();
      setShowEmojiPicker(false);
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Delete a message - NON-OPTIMISTIC: wait for DB confirmation before removing from UI
  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageToDelete.id)
        .eq('user_id', currentUser?.id ?? ''); // Extra safety: only delete own messages

      if (error) throw error;
      // Only remove from UI after DB confirms success
      setMessages((prev) => prev.filter((m) => m.id !== messageToDelete.id));
      setMessageToDelete(null);
    } catch (err) {
      console.error("Error deleting message:", err);
      alert("Failed to delete message. Make sure the delete policy is enabled in Supabase.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Long-press handlers for mobile
  const handleLongPressStart = useCallback((msg: Message) => {
    if (msg.user_id !== currentUser?.id) return;
    longPressTimerRef.current = setTimeout(() => { setMessageToDelete(msg); }, 500);
  }, [currentUser?.id]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
  }, []);

  // Desktop context menu toggle
  const handleDesktopContextMenu = useCallback((e: React.MouseEvent, msg: Message) => {
    if (msg.user_id !== currentUser?.id) return;
    e.stopPropagation();
    setActiveContextMenu((prev) => (prev === msg.id ? null : msg.id));
  }, [currentUser?.id]);

  if (loading) return <div className="h-[calc(100vh-80px)] md:h-screen flex items-center justify-center bg-gray-50 dark:bg-[#09090b]"><Loader2 className="animate-spin text-adobe-red w-8 h-8"/></div>;

  if (initError) return (
    <div className="h-[calc(100vh-80px)] md:h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#09090b] px-6">
      <p className="text-red-500 text-sm font-medium">Unable to load chat</p>
      <p className="text-gray-500 text-center text-xs max-w-sm mt-2">{initError}</p>
    </div>
  );

  if (channels.length === 0) return (
    <div className="h-[calc(100vh-80px)] md:h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#09090b] px-6">
      <div className="w-20 h-20 rounded-full bg-adobe-red/10 flex items-center justify-center mb-6"><MessageCircle className="text-adobe-red" size={36} /></div>
      <h2 className="text-2xl font-bold dark:text-white mb-2">No Channels Yet</h2>
      <p className="text-gray-500 text-center text-sm max-w-xs">Chat channels haven&apos;t been created yet.</p>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-80px)] md:h-screen bg-gray-50 dark:bg-[#09090b]">
      
      {/* Delete confirmation modal */}
      {messageToDelete && (
        <DeleteModal onConfirm={handleDeleteMessage} onCancel={() => setMessageToDelete(null)} isDeleting={isDeleting} />
      )}

      {/* Desktop Channels Sidebar */}
      <div className="hidden md:flex flex-col w-72 bg-white/50 dark:bg-black/20 backdrop-blur-3xl border-r border-gray-200/50 dark:border-white/5">
        <div className="p-5 border-b border-gray-200/50 dark:border-white/5 flex justify-between items-center bg-white/40 dark:bg-white/5">
          <h2 className="font-bold text-lg dark:text-white">Channels</h2>
          <button className="w-8 h-8 rounded-full bg-adobe-red/10 text-adobe-red flex items-center justify-center hover:bg-adobe-red hover:text-white transition-colors">
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {channels.map(c => (
            <button key={c.id} onClick={() => setSelectedChannel(c)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm transition-all duration-300 ${selectedChannel?.id === c.id ? 'bg-gradient-to-r from-adobe-red to-orange-500 text-white shadow-md shadow-adobe-red/20 font-semibold translate-x-1' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
              <Hash size={18} className={selectedChannel?.id === c.id ? 'text-white/80' : 'text-gray-400'} />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">

        {/* Mobile Channel Header — tap to open channel switcher */}
        <div className="md:hidden relative z-20">
          <button
            onClick={() => setShowMobileChannels((v) => !v)}
            className="w-full flex items-center px-4 py-3 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 space-x-3"
          >
            <div className="w-10 h-10 rounded-full bg-adobe-red/10 flex items-center justify-center shrink-0">
              <Hash size={20} className="text-adobe-red" />
            </div>
            <div className="flex-1 text-left">
              <h2 className="font-bold text-base dark:text-white leading-tight">{selectedChannel?.name || "..."}</h2>
              <p className="text-[11px] text-gray-500">Tap to switch channel</p>
            </div>
            <ChevronDown
              size={18}
              className={`text-gray-400 transition-transform duration-200 ${showMobileChannels ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Mobile Channel Dropdown */}
          {showMobileChannels && (
            <div className="absolute top-full left-0 right-0 bg-white dark:bg-[#0f0f0f] border-b border-gray-200/50 dark:border-white/5 shadow-2xl z-30 overflow-hidden">
              {channels.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedChannel(c); setShowMobileChannels(false); }}
                  className={`w-full flex items-center gap-3 px-5 py-4 transition-colors text-sm ${
                    selectedChannel?.id === c.id
                      ? 'bg-adobe-red/10 text-adobe-red font-semibold'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <Hash size={16} className={selectedChannel?.id === c.id ? 'text-adobe-red' : 'text-gray-400'} />
                  {c.name}
                  {selectedChannel?.id === c.id && (
                    <span className="ml-auto text-xs text-adobe-red font-medium">Active</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Channel Header */}
        <div className="hidden md:flex items-center p-5 bg-white/40 dark:bg-black/20 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 space-x-3 z-10">
          <h2 className="font-bold text-xl dark:text-white"># {selectedChannel?.name || "..."}</h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <div className="flex justify-center my-6">
            <span className="px-3 py-1 bg-gray-200/50 dark:bg-white/5 backdrop-blur-md rounded-full text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Today</span>
          </div>
          
          {messages.map((msg) => {
            const isMe = msg.user_id === currentUser?.id;
            const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const showContextMenu = activeContextMenu === msg.id;
            return (
              <div key={msg.id} className={`flex items-end space-x-2 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mb-1 border border-white/10 flex items-center justify-center bg-gray-800">
                  {msg.profiles?.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={msg.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-white font-bold">{msg.profiles?.name?.charAt(0) || '?'}</span>
                  )}
                </div>

                <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className={`text-xs text-gray-400 ${isMe ? 'mr-1 text-right' : 'ml-1'} mb-1 block`}>
                    {!isMe && <span className="font-medium text-gray-300 mr-2">{msg.profiles?.name}</span>}
                    {timeStr}
                  </span>
                  
                  <div className="relative group">
                    <div
                      className="flex flex-col gap-2"
                      onTouchStart={() => handleLongPressStart(msg)}
                      onTouchEnd={handleLongPressEnd}
                      onTouchMove={handleLongPressEnd}
                    >
                      {msg.image_url && (
                        <div className="rounded-2xl overflow-hidden border border-gray-200/50 dark:border-white/10 shadow-sm max-w-[240px] md:max-w-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={msg.image_url} alt="Attachment" className="w-full h-auto object-cover" />
                        </div>
                      )}
                      {msg.content && (
                        <div className={`p-4 rounded-2xl text-sm shadow-md break-words max-w-full ${isMe ? 'bg-gradient-to-r from-adobe-red to-orange-500 rounded-br-sm text-white shadow-adobe-red/20' : 'bg-white dark:bg-[#18181b] rounded-bl-sm dark:text-gray-200 border border-gray-100 dark:border-white/5'}`}>
                          {msg.content}
                        </div>
                      )}
                    </div>

                    {isMe && (
                      <div className="relative">
                        <button
                          onClick={(e) => handleDesktopContextMenu(e, msg)}
                          className="hidden md:flex absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 shadow-sm"
                          title="Delete message"
                        >
                          <Trash2 size={13} />
                        </button>

                        {showContextMenu && (
                          <div className="hidden md:block absolute right-0 bottom-full mb-2 z-40" onClick={(e) => e.stopPropagation()}>
                            <div className="bg-white dark:bg-[#1c1c1e] rounded-xl shadow-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden min-w-[140px]">
                              <button
                                onClick={() => { setMessageToDelete(msg); setActiveContextMenu(null); }}
                                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                              >
                                <Trash2 size={15} />
                                Delete Message
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-white/5 pb-8 md:pb-4 flex flex-col relative w-full">
          {imagePreviewUrl && (
            <div className="px-6 py-3 border-b border-gray-100 dark:border-white/5 flex items-center">
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreviewUrl} alt="Preview" className="h-20 w-20 object-cover rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm" />
                <button onClick={removeSelectedImage} className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1 shadow-md hover:bg-gray-800 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-full right-4 mb-2 z-50">
              <InlineEmojiPicker onEmojiSelect={(emoji) => setNewMessage(prev => prev + emoji)} />
            </div>
          )}

          <div className="px-4 pt-4">
            <input type="file" accept="image/*,.gif,.heic,.heif" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
            <form onSubmit={handleSendMessage} className="flex items-center bg-gray-100 dark:bg-[#18181b] rounded-full px-2 py-2 border border-transparent focus-within:border-adobe-red/30 focus-within:bg-white dark:focus-within:bg-[#18181b] transition-all duration-300">
              <button type="button" className="p-2 text-gray-400 hover:text-adobe-red transition-colors" onClick={() => { setShowEmojiPicker(false); fileInputRef.current?.click(); }} disabled={isSending}>
                <ImageIcon size={20} />
              </button>
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                placeholder={selectedImage ? "Add a caption..." : `Message #${selectedChannel?.name || '...'}`}
                className="flex-1 bg-transparent focus:outline-none text-sm px-2 dark:text-white" disabled={isSending} />
              <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 transition-colors mr-1 ${showEmojiPicker ? 'text-adobe-red' : 'text-gray-400 hover:text-adobe-red'}`} disabled={isSending}>
                <Smile size={20} />
              </button>
              <button type="submit" disabled={(!newMessage.trim() && !selectedImage) || isSending}
                className={`w-9 h-9 rounded-full bg-adobe-red text-white flex items-center justify-center transition-colors shadow-sm shadow-adobe-red/30 ${isSending || (!newMessage.trim() && !selectedImage) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-adobe-darkRed'}`}>
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
