"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Hash, Plus, Image as ImageIcon, Smile, Send, Loader2, MessageCircle } from "lucide-react";

type Channel = { id: string; name: string };
type Message = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { name: string; avatar_url: string | null };
};

export default function ChatPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

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
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Load channels
        const { data: channelsData, error } = await supabase.from('channels').select('*').order('created_at');
        if (error) {
          console.error('Error loading channels:', error);
        } else if (channelsData && channelsData.length > 0) {
          setChannels(channelsData);
          setSelectedChannel(channelsData[0]);
        }
      } catch (err) {
        console.error('Chat init error:', err);
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
      
      const { data } = await supabase
        .from('messages')
        .select(`*, profiles(name, avatar_url)`)
        .eq('channel_id', selectedChannel.id)
        .order('created_at', { ascending: true });
        
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
          async (payload) => {
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChannel || !currentUser) return;

    const content = newMessage;
    setNewMessage(""); // Optimistic clear

    const { error } = await supabase
      .from('messages')
      .insert({
        channel_id: selectedChannel.id,
        user_id: currentUser.id,
        content: content
      });

    if (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) {
     return <div className="h-[calc(100vh-80px)] md:h-screen flex items-center justify-center bg-gray-50 dark:bg-[#09090b]"><Loader2 className="animate-spin text-adobe-red w-8 h-8"/></div>;
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
                <div className="max-w-[75%]">
                  <span className={`text-xs text-gray-400 ${isMe ? 'mr-1 text-right' : 'ml-1'} mb-1 block`}>
                    {!isMe && <span className="font-medium text-gray-300 mr-2">{msg.profiles?.name}</span>}
                    {timeStr}
                  </span>
                  <div className={`p-4 rounded-2xl text-sm shadow-md break-words ${
                    isMe 
                      ? 'bg-gradient-to-r from-adobe-red to-orange-500 rounded-br-sm text-white shadow-adobe-red/20' 
                      : 'bg-white dark:bg-[#18181b] rounded-bl-sm dark:text-gray-200 border border-gray-100 dark:border-white/5'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-white/5 pb-8 md:pb-4">
          <form onSubmit={handleSendMessage} className="flex items-center bg-gray-100 dark:bg-[#18181b] rounded-full px-2 py-2 border border-transparent focus-within:border-adobe-red/30 focus-within:bg-white dark:focus-within:bg-[#18181b] transition-all duration-300">
            <button type="button" className="p-2 text-gray-400 hover:text-adobe-red transition-colors">
              <ImageIcon size={20} />
            </button>
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message #${selectedChannel?.name || '...'}`} 
              className="flex-1 bg-transparent focus:outline-none text-sm px-2 dark:text-white"
            />
            <button type="button" className="p-2 text-gray-400 hover:text-adobe-red transition-colors mr-1">
              <Smile size={20} />
            </button>
            <button 
               type="submit" 
               disabled={!newMessage.trim()} 
               className="w-9 h-9 rounded-full bg-adobe-red text-white flex items-center justify-center hover:bg-adobe-darkRed transition-colors shadow-sm shadow-adobe-red/30 disabled:opacity-50"
            >
              <Send size={16} className="ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
