"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Read from DOM on mount to sync with the blocking script
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Prevent hydration errors by not rendering the wrong state initially,
  // but emojis are static enough that we can just render the button.
  return (
    <button
      onClick={toggleTheme}
      className="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:scale-105 active:scale-95 transition-all shadow-sm"
      aria-label="Toggle Dark Mode"
    >
      <span className="text-lg leading-none translate-y-[1px]">
        {theme === "light" ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
