"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Image as ImageIcon, MessageSquare, Notebook, Calendar, Download, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/photos", label: "Photos", icon: ImageIcon },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/notes", label: "Notes", icon: Notebook },
    { href: "/schedule", label: "Schedule", icon: Calendar },
    { href: "/download", label: "App", icon: Download },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
      <nav className="glass rounded-full px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-black/80">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}`));
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex items-center justify-center p-3 rounded-full transition-all duration-300 active:scale-90 ${
                isActive 
                  ? "bg-gradient-to-tr from-adobe-red to-orange-500 text-white shadow-lg shadow-adobe-red/30 scale-110 -translate-y-1" 
                  : "text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              
              {isActive && (
                <span className="absolute -bottom-2 w-1 h-1 rounded-full bg-adobe-red" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
