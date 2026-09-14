"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Animated light/dark theme toggle button.
 * Mounted check prevents hydration mismatch (next-themes requirement).
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render a placeholder with the same dimensions while unmounted to avoid layout shift
  if (!mounted) {
    return <div className="h-8 w-8 rounded-md bg-transparent" aria-hidden="true" />;
  }

  const isDark = theme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          id="theme-toggle-btn"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md relative overflow-hidden"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {/* Sun icon — visible in dark mode (clicking switches to light) */}
          <Sun
            className={`
              absolute w-4 h-4 transition-all duration-300
              ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"}
            `}
            aria-hidden="true"
          />
          {/* Moon icon — visible in light mode (clicking switches to dark) */}
          <Moon
            className={`
              absolute w-4 h-4 transition-all duration-300
              ${!isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"}
            `}
            aria-hidden="true"
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isDark ? "Light mode" : "Dark mode"}</TooltipContent>
    </Tooltip>
  );
}
