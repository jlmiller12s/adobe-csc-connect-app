import { FileText, Plus, Search } from "lucide-react";

export default function NotesPage() {
  const notes = [
    { id: 1, title: "Keynote Takeaways", session: "Opening Keynote", author: "Jane Doe", date: "April 10", isShared: true, bg: "from-orange-400/20 to-adobe-red/20" },
    { id: 2, title: "Firefly AI Tricks", session: "The Future of GenAI", author: "John Smith", date: "April 10", isShared: true, bg: "from-blue-400/20 to-purple-500/20" },
    { id: 3, title: "My Private Ideas", session: "GenAI in Enterprise", author: "Me", date: "April 10", isShared: false, bg: "from-emerald-400/20 to-teal-500/20" },
  ];

  return (
    <div className="pb-24 p-5 md:p-8 max-w-5xl mx-auto space-y-8 min-h-screen bg-gray-50 dark:bg-[#09090b]">
      
      {/* Header and Search */}
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold dark:text-white tracking-tight">Notes Library</h1>
            <p className="text-gray-500 text-sm mt-1">Capture insights and ideas</p>
          </div>
          <button className="w-12 h-12 rounded-full bg-gradient-to-tr from-adobe-red to-orange-500 text-white flex items-center justify-center shadow-lg shadow-adobe-red/30 hover:scale-105 active:scale-95 transition-all">
            <Plus size={24} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search all notes..." 
            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#18181b] border border-gray-200/50 dark:border-white/5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-adobe-red/50 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Glass Pill Filters */}
      <div className="flex space-x-3 overflow-x-auto hide-scrollbar pb-2">
        <button className="px-5 py-2 rounded-full text-sm font-semibold bg-adobe-red text-white shadow-md shadow-adobe-red/20 whitespace-nowrap tracking-wide">
          All Shared
        </button>
        <button className="px-5 py-2 rounded-full text-sm font-semibold bg-white dark:bg-[#18181b] text-gray-600 dark:text-gray-300 border border-gray-200/50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition whitespace-nowrap tracking-wide">
          My Notes
        </button>
        <button className="px-5 py-2 rounded-full text-sm font-semibold bg-white dark:bg-[#18181b] text-gray-600 dark:text-gray-300 border border-gray-200/50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition whitespace-nowrap tracking-wide">
          Bookmarks
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map(note => (
          <div key={note.id} className="relative bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group">
            {/* Background Accent */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${note.bg} rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 tracking-wide uppercase">
                  {note.session}
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-adobe-red transition-colors">
                  <FileText size={16} />
                </div>
              </div>
              
              <h3 className="font-bold text-xl leading-tight mb-3 dark:text-white line-clamp-2">{note.title}</h3>
              
              <div className="mt-8 flex justify-between items-center text-sm">
                 <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-800" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{note.author}</span>
                 </div>
                 <span className="text-gray-400 font-medium text-xs">{note.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
