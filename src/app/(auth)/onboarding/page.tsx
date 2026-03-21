"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [team, setTeam] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Basic protection to ensure signed in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        // If they already have a name, redirect to main app
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        if (profile?.name) {
          router.push('/');
        }
      }
    };
    checkUser();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name,
        role,
        team,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (updateError) {
      console.error(updateError);
      setError(updateError.message);
      setLoading(false);
    } else {
      // Notify layout component that profile is created
      window.dispatchEvent(new Event("profile-updated"));
      router.push('/');
    }
  };

  return (
    <div className="w-full max-w-sm p-8 bg-zinc-900 rounded-3xl shadow-2xl border border-white/20 relative overflow-hidden">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-adobe-red to-orange-500" />
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Complete Profile</h1>
        <p className="text-sm text-gray-300 font-medium">Just a few more details to get you ready for the conference.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold mb-2 text-white">
            Full Name <span className="text-adobe-red">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            required
            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-adobe-red focus:border-transparent transition-all text-white placeholder:text-gray-500"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-semibold mb-2 text-white">
            Role / Title <span className="text-adobe-red">*</span>
          </label>
          <input
            id="role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Senior Designer"
            required
            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-adobe-red focus:border-transparent transition-all text-white placeholder:text-gray-500"
          />
        </div>

        <div>
          <label htmlFor="team" className="block text-sm font-semibold mb-2 text-white">
            Team / Organization
          </label>
          <input
            id="team"
            type="text"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            placeholder="e.g. Design Systems"
            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-adobe-red focus:border-transparent transition-all text-white placeholder:text-gray-500"
          />
        </div>

        {error && (
          <p className="text-sm text-center text-white/90 font-medium bg-white/10 py-2 px-3 rounded-lg border border-white/10">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !name || !role}
          className="w-full pt-2 pb-2 mt-6 py-3.5 px-4 bg-gradient-to-tr from-adobe-red to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-adobe-red/20 hover:shadow-xl hover:shadow-adobe-red/30 hover:-translate-y-0.5 transition-all focus:outline-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
        >
          {loading ? "Saving..." : "Join the Conference"}
        </button>
      </form>
    </div>
  );
}
