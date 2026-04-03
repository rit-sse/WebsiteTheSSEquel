"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useThemeMode } from "@/contexts/ThemeModeContext";

export default function DarkModeToggle() {
  const { theme, toggleTheme } = useThemeMode();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
        <span className="sr-only">Toggle theme</span>
      </button>
    );
  }

  return (
    <button
      className="w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  );
}
