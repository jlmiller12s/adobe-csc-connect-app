import { Image as ImageIcon, MessageSquare, Notebook, CalendarDays } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const quickActions = [
    { label: "Photos", icon: ImageIcon, href: "/photos", color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Chat", icon: MessageSquare, href: "/chat", color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Notes", icon: Notebook, href: "/notes", color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Schedule", icon: CalendarDays, href: "/schedule", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="pb-24 min-h-screen bg-gray-50 dark:bg-[#09090b]">
      {/* Hero Header */}
      <div className="relative pt-12 pb-28 px-6 overflow-hidden bg-black dark:bg-[#09090b]">
        {/* Deep Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[400px] bg-gradient-to-b from-adobe-red/30 via-orange-500/10 to-transparent blur-3xl opacity-80" />
        
        <div className="relative z-10 flex flex-col pt-8 max-w-5xl mx-auto">
          <p className="text-adobe-red font-semibold tracking-wider text-xs mb-3 uppercase">Welcome Back</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 leading-tight">
            Adobe CSC
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-adobe-red">
               Connection Hub
            </span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-sm">
            Your premium digital companion. Connect, share, and capture insights.
          </p>
        </div>
      </div>

      {/* Main Content Area - Overlapping the Hero */}
      <div className="relative z-20 px-4 -mt-16 space-y-6 max-w-5xl mx-auto">
        
        {/* Next Event Glass Card */}
        <div className="glass-card p-6 flex items-center justify-between border-t border-white/20 dark:border-white/5 shadow-2xl">
          <div>
            <p className="text-[10px] text-adobe-red font-bold tracking-widest uppercase mb-2">Up Next</p>
            <h3 className="text-lg md:text-xl font-bold dark:text-white">Opening Keynote</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Main Stage &bull; 9:00 AM</p>
          </div>
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-adobe-red to-orange-500 flex items-center justify-center shadow-lg shadow-adobe-red/30">
             <CalendarDays className="text-white" size={24} />
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="pt-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 ml-2 tracking-wide">Explore</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href} className="glass-card p-5 hover:-translate-y-1 transition-all duration-300 active:scale-95 group">
                <div className={`w-12 h-12 rounded-2xl ${action.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className={action.color} size={24} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-sm block dark:text-gray-200">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity Snippet */}
        <div className="glass-card p-6 pb-8">
           <h3 className="text-sm font-bold mb-4 ml-1 tracking-wide dark:text-white">Recent Highlights</h3>
           <div className="h-40 rounded-2xl bg-gray-100/50 dark:bg-white/5 flex items-center justify-center border border-gray-200/50 dark:border-white/5">
              <span className="text-sm font-medium text-gray-400">Activity feed forming...</span>
           </div>
        </div>
      </div>
    </div>
  );
}
