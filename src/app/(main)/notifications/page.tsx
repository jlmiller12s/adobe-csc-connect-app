"use client";

import { useEffect, useState } from "react";
import { Bell, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { createClient, getSharedSession } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  link_url: string | null;
  created_at: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadNotifications() {
      try {
        const { data: { session } } = await getSharedSession();
        if (!session?.user) return;

        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(50);
        
        if (!error && data) {
          setNotifications(data);
          
          // Mark all as read
          const unreadIds = data.filter(n => !n.is_read).map(n => n.id);
          if (unreadIds.length > 0) {
            await supabase
              .from("notifications")
              .update({ is_read: true })
              .in("id", unreadIds);
          }
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] flex flex-col pt-4 px-4 pb-24 md:p-8">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => router.push('/')} 
          className="mr-3 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          aria-label="Go back to home screen"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-adobe-red border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center -mt-20">
          <div className="w-20 h-20 rounded-full bg-adobe-red/10 flex items-center justify-center mb-6">
            <Bell className="text-adobe-red" size={36} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You&apos;re all caught up!</h2>
          <p className="text-gray-500 text-sm text-center max-w-xs">
            No new notifications right now. Check back later for updates.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3 max-w-2xl mx-auto w-full">
          {notifications.map((notif) => (
            <Link 
              href={notif.link_url || "#"} 
              key={notif.id}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${
                notif.is_read 
                  ? "bg-white dark:bg-[#18181b] border-gray-100 dark:border-white/5" 
                  : "bg-adobe-red/5 border-adobe-red/20 dark:bg-adobe-red/10 dark:border-adobe-red/20"
              }`}
            >
              <div className="mt-1 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                {notif.type === 'chat' ? (
                  <MessageSquare size={18} className="text-blue-600 dark:text-blue-400" />
                ) : (
                  <Bell size={18} className="text-adobe-red" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className={`text-sm md:text-base font-semibold truncate ${!notif.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                    {notif.title}
                  </h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className={`text-sm line-clamp-2 ${!notif.is_read ? 'text-gray-800 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                  {notif.body}
                </p>
              </div>
              {!notif.is_read && (
                <div className="w-2 h-2 rounded-full bg-adobe-red mt-2 shrink-0" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
