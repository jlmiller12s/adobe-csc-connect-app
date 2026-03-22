"use client";

import { Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] flex flex-col pt-4 px-4 pb-24 md:p-8">
      <div className="flex items-center mb-6">
        <Link href="/" className="mr-3 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center -mt-20">
        <div className="w-20 h-20 rounded-full bg-adobe-red/10 flex items-center justify-center mb-6">
          <Bell className="text-adobe-red" size={36} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You&apos;re all caught up!</h2>
        <p className="text-gray-500 text-sm text-center max-w-xs">
          No new notifications right now. Check back later for updates.
        </p>
      </div>
    </div>
  );
}
