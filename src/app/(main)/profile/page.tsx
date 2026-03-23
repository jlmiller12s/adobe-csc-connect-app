"use client";

import { useEffect, useState, useRef } from "react";
import { createClient, getSharedSession, runSupabaseOperation } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Loader2, LogOut, X } from "lucide-react";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [team, setTeam] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function getProfile() {
      try {
        setLoading(true);
        setLoadError(null);
        const { data: { session } } = await getSharedSession();
        const user = session?.user;
        
        if (user) {
          const profileResult = await runSupabaseOperation(
            "Loading profile",
            (client) =>
              client
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle()
          ) as {
            data: {
              name: string | null;
              role: string | null;
              team: string | null;
              bio: string | null;
              avatar_url: string | null;
            } | null;
          };
          const { data: profile } = profileResult;
            
          if (profile) {
            setName(profile.name || "");
            setRole(profile.role || "");
            setTeam(profile.team || "");
            setBio(profile.bio || "");
            setAvatarUrl(profile.avatar_url || null);
          }
        }
      } catch (err) {
        console.error("Profile load error:", err);
        setLoadError(err instanceof Error ? err.message : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    
    getProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const { data: { session } } = await getSharedSession();
    const user = session?.user;
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name,
        role,
        team,
        bio,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error(error);
      setMessage("Error saving profile: " + error.message);
    } else {
      setMessage("Profile updated successfully!");
      // Dispatch event to update Sidebar
      window.dispatchEvent(new Event("profile-updated"));
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const { data: { session } } = await getSharedSession();
      const user = session?.user;
      if (!user) throw new Error("Not authenticated");

      // Upload to 'photos' bucket under an 'avatars' folder
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      // Update profile record with new avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          name: name || "User", 
          role, 
          team, 
          bio,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (updateError) throw updateError;
      
      setAvatarUrl(publicUrl);
      // Dispatch event to update Sidebar immediately
      window.dispatchEvent(new Event("profile-updated"));
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pb-20">
        <Loader2 className="animate-spin text-adobe-red w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="pb-28 bg-black min-h-screen pt-4 px-4 md:px-8 text-white relative">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleSignOut}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors bg-white/5 py-2 px-4 rounded-xl border border-white/10 hover:bg-white/10"
            >
              <LogOut size={16} />
              <span className="text-sm font-medium hidden sm:inline">Log out</span>
            </button>
            <Link 
              href="/"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 shadow-sm transition-colors"
            >
              <X size={20} />
            </Link>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          {loadError && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              {loadError}
            </div>
          )}
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8 pb-8 border-b border-white/10">
            <div className="relative group mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 bg-black flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-gray-500">{name.charAt(0) || '?'}</span>
                )}
              </div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-8 h-8 bg-adobe-red text-white rounded-full flex items-center justify-center shadow-lg border-2 border-zinc-900 hover:scale-105 transition-transform disabled:opacity-50"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
              <input 
                type="file" 
                accept="image/*" 
                hidden 
                ref={fileInputRef}
                onChange={handleAvatarUpload}
              />
            </div>
            <h2 className="text-xl font-bold">{name || "Your Profile"}</h2>
            <p className="text-sm text-gray-400">{role} {team ? `· ${team}` : ''}</p>
          </div>

          {/* Settings Form */}
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-300">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:outline-none focus:ring-2 focus:ring-adobe-red transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="role" className="block text-sm font-medium mb-2 text-gray-300">
                  Role
                </label>
                <input
                  id="role"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:outline-none focus:ring-2 focus:ring-adobe-red transition-all"
                />
              </div>

              <div>
                <label htmlFor="team" className="block text-sm font-medium mb-2 text-gray-300">
                  Team
                </label>
                <input
                  id="team"
                  type="text"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:outline-none focus:ring-2 focus:ring-adobe-red transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-2 text-gray-300">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:outline-none focus:ring-2 focus:ring-adobe-red transition-all resize-none"
              />
            </div>

            {/* Note on Passwords */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-6">
              <h3 className="text-sm font-semibold mb-1 text-adobe-red">Authentication</h3>
              <p className="text-xs text-gray-400">
                You are currently signed in via secure Magic Link. There is no password to reset!
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <span className="text-sm text-green-400 font-medium">
                {message}
              </span>
              <button
                type="submit"
                disabled={saving}
                className="py-3 px-6 bg-white text-black font-bold rounded-xl shadow-lg hover:bg-gray-200 hover:-translate-y-0.5 transition-all focus:outline-none disabled:opacity-50 flex items-center space-x-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
