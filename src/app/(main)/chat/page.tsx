"use client";

import { useEffect, useState, useRef } from "react";
import { createClient, getSharedSession, runSupabaseOperation } from "@/lib/supabase/client";
import { Hash, Plus, Image as ImageIcon, Smile, Send, Loader2, MessageCircle, X } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';

type Channel = { id: string; name: string };
type Message = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  image_url: string | null;
  profiles: { name: string; avatar_url: string | null };
};

export default function ChatPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  
  // New State for enhancements
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load User and Channels
  useEffect(() => {
    async function initializeChat() {
      try {
        setInitError(null);
        // Get current user
        const { data: { session } } = await getSharedSession();
        const user = session?.user;
        setCurrentUser(user || null);

        // Load channels
        const channelsResult = await runSupabaseOperation(
          "Loading chat channels"
          ,
          (client) => client.from('channels').select('*').order('created_at')
        ) as { data: Channel[] | null; error: { message?: string } | null };
        const { data: channelsData, error } = channelsResult;
        if (error) {
          console.error('Error loading channels:', error);
          setInitError(error.message || "Failed to load chat channels.");
        } else if (channelsData && channelsData.length > 0) {
          setChannels(channelsData);
          setSelectedChannel(channelsData[0]);
        }
      } catch (err) {
        console.error('Chat init error:', err);
        setInitError(err instanceof Error ? err.message : "Failed to initialize chat.");
      } finally {
        setLoading(false);
      }
    }
    
    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load messages when channel changes and set up realtime
  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel>;

    async function loadMessages() {
      if (!selectedChannel) return;
      
      const messagesResult = await runSupabaseOperation(
        "Loading channel messages",
        (client) =>
          client
            .from('messages')
            .select(`*, profiles(name, avatar_url)`)
            .eq('channel_id', selectedChannel.id)
            .order('created_at', { ascending: true })
      ) as { data: Message[] | null };
      const { data } = messagesResult;
        
      if (data) setMessages(data as unknown as Message[]);

      // Realtime subscription for the current channel
      subscription = supabase
        .channel(`messages:channel_id=eq.${selectedChannel.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `channel_id=eq.${selectedChannel.id}`,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          async (payload: any) => {
            // Fetch the profile for the new message
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('id', payload.new.user_id)
              .maybeSingle();
              
            const newMsg = {
               ...payload.new,
               profiles: profileData || { name: 'Unknown', avatar_url: null }
            };
            
            setMessages((prev) => [...prev, newMsg as Message]);
          }
        )
        .subscribe();
    }

    loadMessages();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel]);

  // Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      if (fileInputRef.current) {
         fileInputRef.current.value = "";
      }
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !selectedChannel || !currentUser || isSending) return;

    setIsSending(true);
    let uploadedImageUrl = null;

    try {
      // 1. Upload Image (if any)
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `chat/${selectedChannel.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, selectedImage);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath);

        uploadedImageUrl = publicUrl;
      }

      // 2. Insert Message
      const content = newMessage.trim();
      const { error } = await supabase
        .from('messages')
        .insert({
          channel_id: selectedChannel.id,
          user_id: currentUser.id,
          content: content || null,
          image_url: uploadedImageUrl
        });

      if (error) {
        throw error;
      }

      // Clean up after success
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

  if (loading) {
     return <div className="h-[calc(100vh-80px)] md:h-screen flex items-center justify-center bg-gray-50 dark:bg-[#09090b]"><Loader2 className="animate-spin text-adobe-red w-8 h-8"/></div>;
  }

  if (initError) {
    return (
      <div className="h-[calc(100vh-80px)] md:h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#09090b] px-6">
        <p className="text-red-500 text-sm font-medium">Unable to load chat</p>
        <p className="text-gray-500 text-center text-xs max-w-sm mt-2">{initError}</p>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="h-[calc(100vh-80px)] md:h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#09090b] px-6">
        <div className="w-20 h-20 rounded-full bg-adobe-red/10 flex items-center justify-center mb-6">
          <MessageCircle className="text-adobe-red" size={36} />
        </div>
        <h2 className="text-2xl font-bold dark:text-white mb-2">No Channels Yet</h2>
        <p className="text-gray-500 text-center text-sm max-w-xs">Chat channels haven&apos;t been created yet. Check back soon or ask an admin to set them up in Supabase.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] md:h-screen bg-gray-50 dark:bg-[#09090b]">
      {/* Channels Sidebar (Mobile hidden, Desktop visible) */}
      <div className="hidden md:flex flex-col w-72 bg-white/50 dark:bg-black/20 backdrop-blur-3xl border-r border-gray-200/50 dark:border-white/5">
        <div className="p-5 border-b border-gray-200/50 dark:border-white/5 flex justify-between items-center bg-white/40 dark:bg-white/5">
          <h2 className="font-bold text-lg dark:text-white">Channels</h2>
          <button className="w-8 h-8 rounded-full bg-adobe-red/10 text-adobe-red flex items-center justify-center hover:bg-adobe-red hover:text-white transition-colors">
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {channels.map(c => (
            <button 
              key={c.id} 
              onClick={() => setSelectedChannel(c)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm transition-all duration-300 ${selectedChannel?.id === c.id ? 'bg-gradient-to-r from-adobe-red to-orange-500 text-white shadow-md shadow-adobe-red/20 font-semibold translate-x-1' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
              <Hash size={18} className={selectedChannel?.id === c.id ? 'text-white/80' : 'text-gray-400'} />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Mobile Channel Header */}
        <div className="md:hidden flex items-center p-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 space-x-3 z-10">
          <div className="w-10 h-10 rounded-full bg-adobe-red/10 flex items-center justify-center">
             <Hash size={20} className="text-adobe-red" />
          </div>
          <div>
            <h2 className="font-bold text-lg dark:text-white leading-tight">{selectedChannel?.name || "..."}</h2>
            <p className="text-[11px] text-gray-500">Public Channel</p>
          </div>
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
            return (
              <div key={msg.id} className={`flex items-end space-x-2 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mb-1 border border-white/10 flex items-center justify-center bg-gray-800">
                  {msg.profiles?.avatar_url ? (
                    <img src={msg.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-white font-bold">{msg.profiles?.name?.charAt(0) || '?'}</span>
                  )}
                </div>
                <div className="max-w-[75%] flex flex-col items-end">
                  <span className={`text-xs text-gray-400 ${isMe ? 'mr-1 text-right' : 'ml-1 self-start'} mb-1 block`}>
                    {!isMe && <span className="font-medium text-gray-300 mr-2">{msg.profiles?.name}</span>}
                    {timeStr}
                  </span>
                  
                  <div className={`flex flex-col gap-2 ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Render Image if exists */}
                    {msg.image_url && (
                      <div className="rounded-2xl overflow-hidden border border-gray-200/50 dark:border-white/10 shadow-sm max-w-[240px] md:max-w-sm">
                        <img src={msg.image_url} alt="Attachment" className="w-full h-auto object-cover" loading="lazy" />
                      </div>
                    )}
                    
                    {/* Render Text Content if exists */}
                    {msg.content && (
                      <div className={`p-4 rounded-2xl text-sm shadow-md break-words max-w-full ${
                        isMe 
                          ? 'bg-gradient-to-r from-adobe-red to-orange-500 rounded-br-sm text-white shadow-adobe-red/20' 
                          : 'bg-white dark:bg-[#18181b] rounded-bl-sm dark:text-gray-200 border border-gray-100 dark:border-white/5'
                      }`}>
                        {msg.content}
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
          
          {/* Image Preview Area */}
          {imagePreviewUrl && (
             <div className="px-6 py-3 border-b border-gray-100 dark:border-white/5 flex items-center">
                <div className="relative inline-block">
                  <img src={imagePreviewUrl} alt="Preview" className="h-20 w-20 object-cover rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm" />
                  <button 
                    onClick={removeSelectedImage}
                    className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1 shadow-md hover:bg-gray-800 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
             </div>
          )}

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="absolute bottom-full right-4 mb-2 shadow-2xl z-50 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
               <EmojiPicker 
                 theme={"auto" as const} 
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 onEmojiClick={(emojiData: any) => {
                    setNewMessage(prev => prev + emojiData.emoji);
                 }} 
               />
            </div>
          )}

          <div className="px-4 pt-4">
            <form onSubmit={handleSendMessage} className="flex items-center bg-gray-100 dark:bg-[#18181b] rounded-full px-2 py-2 border border-transparent focus-within:border-adobe-red/30 focus-within:bg-white dark:focus-within:bg-[#18181b] transition-all duration-300">
              
              {/* Hidden File Input */}
              <input 
                type="file" 
                accept="image/*,video/mp4,video/quicktime,.gif" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageChange}
              />

              <button 
                type="button" 
                className="p-2 text-gray-400 hover:text-adobe-red transition-colors"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
              >
                <ImageIcon size={20} />
              </button>
              
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={selectedImage ? "Add a caption..." : `Message #${selectedChannel?.name || '...'}`} 
                className="flex-1 bg-transparent focus:outline-none text-sm px-2 dark:text-white"
                disabled={isSending}
              />
              
              <button 
                type="button" 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 transition-colors mr-1 ${showEmojiPicker ? 'text-adobe-red' : 'text-gray-400 hover:text-adobe-red'}`}
                disabled={isSending}
              >
                <Smile size={20} />
              </button>
              
              <button 
                 type="submit" 
                 disabled={(!newMessage.trim() && !selectedImage) || isSending} 
                 className={`w-9 h-9 rounded-full bg-adobe-red text-white flex items-center justify-center transition-colors shadow-sm shadow-adobe-red/30 ${
                   isSending || (!newMessage.trim() && !selectedImage) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-adobe-darkRed'
                 }`}
              >
                {isSending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} className="ml-0.5" />
                )}
              </button>
            </form>
          </div>
          
        </div>
      </div>
    </div>
  );
}
