"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the login link!");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm p-8 bg-zinc-900 rounded-3xl shadow-2xl border border-white/20 relative overflow-hidden">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-adobe-red to-orange-500" />
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-adobe-red">Adobe CSC</h1>
        <p className="text-sm text-gray-300 mt-2 font-medium">Sign in to access the conference app</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold mb-2 text-white">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@adobe.com"
            required
            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-adobe-red focus:border-transparent transition-all text-white placeholder:text-gray-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 bg-gradient-to-tr from-adobe-red to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-adobe-red/20 hover:shadow-xl hover:shadow-adobe-red/30 hover:-translate-y-0.5 transition-all focus:outline-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
        >
          {loading ? "Sending link..." : "Send Magic Link"}
        </button>

        {message && (
          <p className="mt-4 text-sm text-center text-white/90 font-medium bg-white/10 py-2 px-3 rounded-lg border border-white/10">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
