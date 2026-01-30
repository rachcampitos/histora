"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "../ThemeProvider";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#334155] transition-colors focus:outline-none focus:ring-2 focus:ring-[#4a9d9a] focus:ring-offset-2 dark:focus:ring-offset-[#0f172a] ${className}`}
      aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
    >
      {mounted && theme === "dark" ? (
        <Sun className="w-5 h-5 text-[#fbbf24]" />
      ) : (
        <Moon className="w-5 h-5 text-[#64748b]" />
      )}
    </button>
  );
}
