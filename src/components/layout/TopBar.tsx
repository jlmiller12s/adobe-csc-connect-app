"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import Link from "next/link";

export function TopBar() {
  const pathname = usePathname();
  
  // Basic title mapping
  const getTitle = () => {
    if (pathname === "/") return "Dashboard";
    if (pathname.startsWith("/photos")) return "Photos";
    if (pathname.startsWith("/chat")) return "Chat Hub";
    if (pathname.startsWith("/notes")) return "Conference Notes";
    if (pathname.startsWith("/schedule")) return "Schedule";
    if (pathname.startsWith("/directory")) return "Directory";
    return "CSC Connect";
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b border-border bg-background/80 backdrop-blur-md md:hidden">
      <h1 className="text-lg font-semibold">{getTitle()}</h1>
      <div className="flex items-center space-x-3">
        <Link href="/search" className="p-2 -mr-2 text-gray-500 hover:text-foreground">
          <Search size={20} />
        </Link>
        <Link href="/notifications" className="relative p-2 text-gray-500 hover:text-foreground">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-adobe-red" />
        </Link>
      </div>
    </header>
  );
}
