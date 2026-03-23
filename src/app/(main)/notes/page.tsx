"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, Search, X, Loader2, Trash2, Save, ArrowLeft, Globe, Lock } from "lucide-react";
import { createClient, getSharedSession, runSupabaseOperation } from "@/lib/supabase/client";

type Note = {
  id: string;
  title: string;
  session_title?: string;
  content?: string;
  is_shared: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  profiles?: { name: string; avatar_url: string | null };
};

type FilterTab = "all" | "mine" | "shared";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  // Editor state
  const [editing, setEditing] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSession, setEditSession] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editShared, setEditShared] = useState(false);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  // Fetch user + notes
  useEffect(() => {
    async function init() {
      try {
        setInitError(null);
        const { data: { session } } = await getSharedSession();
        const user = session?.user;
        setCurrentUser(user || null);

        const notesResult = await runSupabaseOperation(
          "Loading notes",
          (client) =>
            client
              .from("notes")
              .select("*, profiles(name, avatar_url)")
              .order("updated_at", { ascending: false })
        ) as { data: Note[] | null; error: { message?: string } | null };
        const { data, error } = notesResult;

        if (error) {
          console.error("Error fetching notes:", error);
          setInitError(error.message || "Failed to load notes.");
        } else {
          setNotes((data || []) as unknown as Note[]);
        }
      } catch (err) {
        console.error("Notes init error:", err);
        setInitError(err instanceof Error ? err.message : "Failed to initialize notes.");
      } finally {
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter & search
  const filteredNotes = notes.filter((n) => {
    if (filter === "mine" && n.user_id !== currentUser?.id) return false;
    if (filter === "shared" && !n.is_shared) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.session_title?.toLowerCase().includes(q) ||
        n.content?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Open editor for new note
  const handleNewNote = () => {
    setEditNote(null);
    setEditTitle("");
    setEditSession("");
    setEditContent("");
    setEditShared(false);
    setEditing(true);
  };

  // Open editor for existing note
  const handleOpenNote = (note: Note) => {
    // Only allow editing own notes
    if (note.user_id !== currentUser?.id) {
      // View-only
      setEditNote(note);
      setEditTitle(note.title);
      setEditSession(note.session_title || "");
      setEditContent(note.content || "");
      setEditShared(note.is_shared);
      setEditing(true);
      return;
    }
    setEditNote(note);
    setEditTitle(note.title);
    setEditSession(note.session_title || "");
    setEditContent(note.content || "");
    setEditShared(note.is_shared);
    setEditing(true);
  };

  // Save (create or update)
  const handleSave = async () => {
    if (!editTitle.trim() || !currentUser) return;
    setSaving(true);

    try {
      if (editNote) {
        // Update existing
        const { error } = await supabase
          .from("notes")
          .update({
            title: editTitle,
            session_title: editSession || null,
            content: editContent,
            is_shared: editShared,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editNote.id);

        if (error) throw error;

        setNotes((prev) =>
          prev.map((n) =>
            n.id === editNote.id
              ? { ...n, title: editTitle, session_title: editSession, content: editContent, is_shared: editShared, updated_at: new Date().toISOString() }
              : n
          )
        );
      } else {
        // Create new
        const { data, error } = await supabase
          .from("notes")
          .insert({
            user_id: currentUser.id,
            title: editTitle,
            session_title: editSession || null,
            content: editContent,
            is_shared: editShared,
          })
          .select("*, profiles(name, avatar_url)")
          .single();

        if (error) throw error;
        if (data) setNotes((prev) => [data as unknown as Note, ...prev]);
      }
      setEditing(false);
    } catch (err) {
      console.error("Error saving note:", err);
      alert("Failed to save note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!editNote) return;
    if (!confirm("Delete this note?")) return;
    setSaving(true);

    try {
      const { error } = await supabase.from("notes").delete().eq("id", editNote.id);
      if (error) throw error;
      setNotes((prev) => prev.filter((n) => n.id !== editNote.id));
      setEditing(false);
    } catch (err) {
      console.error("Error deleting note:", err);
    } finally {
      setSaving(false);
    }
  };

  const isOwner = editNote ? editNote.user_id === currentUser?.id : true;

  // --- EDITOR VIEW ---
  if (editing) {
    return (
      <div className="pb-24 min-h-screen bg-gray-50 dark:bg-[#09090b] flex flex-col">
        {/* Editor Header */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setEditing(false)}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center space-x-2">
            {isOwner && editNote && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                <Trash2 size={18} />
              </button>
            )}
            {isOwner && (
              <button
                onClick={handleSave}
                disabled={saving || !editTitle.trim()}
                className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-adobe-red to-orange-500 text-white font-semibold rounded-xl shadow-md shadow-adobe-red/20 hover:shadow-lg disabled:opacity-50 transition-all text-sm"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Save</span>
              </button>
            )}
          </div>
        </div>

        {/* Editor Body */}
        <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-5">
          <input
            type="text"
            placeholder="Note title..."
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            readOnly={!isOwner}
            className="w-full text-3xl font-bold bg-transparent dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none border-none"
          />

          <input
            type="text"
            placeholder="Session name (optional)"
            value={editSession}
            onChange={(e) => setEditSession(e.target.value)}
            readOnly={!isOwner}
            className="w-full text-sm bg-transparent text-gray-500 dark:text-gray-400 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none border-none"
          />

          <div className="border-t border-gray-200/50 dark:border-white/5 pt-5">
            <textarea
              placeholder="Start taking notes..."
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              readOnly={!isOwner}
              rows={20}
              className="w-full bg-transparent dark:text-gray-200 text-base leading-relaxed placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none resize-none border-none"
            />
          </div>

          {/* Sharing Toggle */}
          {isOwner && (
            <div className="flex items-center justify-between bg-white dark:bg-[#18181b] border border-gray-200/50 dark:border-white/5 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                {editShared ? (
                  <Globe size={18} className="text-green-500" />
                ) : (
                  <Lock size={18} className="text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-semibold dark:text-white">
                    {editShared ? "Shared with everyone" : "Private note"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {editShared ? "All attendees can see this note" : "Only you can see this note"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditShared(!editShared)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${editShared ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${editShared ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#09090b]">
        <Loader2 className="animate-spin text-adobe-red w-8 h-8" />
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#09090b] px-6">
        <p className="text-red-500 text-sm font-medium">Unable to load notes</p>
        <p className="text-gray-500 text-center text-xs max-w-sm mt-2">{initError}</p>
      </div>
    );
  }

  const bgColors = [
    "from-orange-400/20 to-adobe-red/20",
    "from-blue-400/20 to-purple-500/20",
    "from-emerald-400/20 to-teal-500/20",
    "from-pink-400/20 to-rose-500/20",
    "from-amber-400/20 to-yellow-500/20",
    "from-indigo-400/20 to-blue-500/20",
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
          <button
            onClick={handleNewNote}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-adobe-red to-orange-500 text-white flex items-center justify-center shadow-lg shadow-adobe-red/30 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search all notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#18181b] border border-gray-200/50 dark:border-white/5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-adobe-red/50 shadow-sm transition-all dark:text-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Glass Pill Filters */}
      <div className="flex space-x-3 overflow-x-auto hide-scrollbar pb-2">
        {(["all", "mine", "shared"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap tracking-wide transition-all ${
              filter === tab
                ? "bg-adobe-red text-white shadow-md shadow-adobe-red/20"
                : "bg-white dark:bg-[#18181b] text-gray-600 dark:text-gray-300 border border-gray-200/50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5"
            }`}
          >
            {tab === "all" ? "All Notes" : tab === "mine" ? "My Notes" : "Shared"}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-adobe-red/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="text-adobe-red" size={28} />
          </div>
          <h3 className="text-lg font-bold dark:text-white mb-1">No notes yet</h3>
          <p className="text-gray-500 text-sm">Tap the + button to create your first note</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note, index) => (
            <div
              key={note.id}
              onClick={() => handleOpenNote(note)}
              className="relative bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group"
            >
              {/* Background Accent */}
              <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${bgColors[index % bgColors.length]} rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  {note.session_title && (
                    <div className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 tracking-wide uppercase">
                      {note.session_title}
                    </div>
                  )}
                  <div className="flex items-center space-x-2 ml-auto">
                    {note.is_shared ? (
                      <Globe size={14} className="text-green-500" />
                    ) : (
                      <Lock size={14} className="text-gray-400" />
                    )}
                    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-adobe-red transition-colors">
                      <FileText size={16} />
                    </div>
                  </div>
                </div>

                <h3 className="font-bold text-xl leading-tight mb-2 dark:text-white line-clamp-2">{note.title}</h3>

                {note.content && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{note.content}</p>
                )}

                <div className="mt-auto flex justify-between items-center text-sm pt-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
                      {note.profiles?.avatar_url ? (
                        <img src={note.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] font-bold text-gray-500">{note.profiles?.name?.charAt(0) || "?"}</span>
                      )}
                    </div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {note.user_id === currentUser?.id ? "You" : note.profiles?.name || "Unknown"}
                    </span>
                  </div>
                  <span className="text-gray-400 font-medium text-xs">
                    {new Date(note.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
