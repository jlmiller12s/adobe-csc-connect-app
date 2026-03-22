"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Image as ImageIcon, MessageSquare, Notebook, Calendar } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

type ProfileData = { name: string; avatar_url: string | null } | null;

export function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<ProfileData>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        if (data) setProfile(data);
      }
    }
    loadProfile();

    // Subscribe to auth changes to refresh if needed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
       if (session?.user) {
         const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
         if (data) setProfile(data);
       } else {
         setProfile(null);
       }
    });

    // Listen to manual updates from the profile page
    const handleProfileUpdate = () => {
      loadProfile();
    };
    window.addEventListener("profile-updated", handleProfileUpdate);

    return () => {
       authListener.subscription.unsubscribe();
       window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, [supabase]);

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/photos", label: "Photos", icon: ImageIcon },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/notes", label: "Notes", icon: Notebook },
    { href: "/schedule", label: "Schedule", icon: Calendar },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 border-r border-border bg-background h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-adobe-red">Adobe CSC</h1>
        <p className="text-sm text-gray-500">Connect App</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors ${
                isActive 
                  ? "bg-adobe-red/10 text-adobe-red font-medium" 
                  : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
              }`}
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Link href="/profile" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-gray-500">{profile?.name?.charAt(0) || '?'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{profile?.name || "My Profile"}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
