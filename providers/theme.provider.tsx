"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { PropsWithChildren } from "react";

/**
 * Wraps the app in next-themes ThemeProvider.
 * defaultTheme="dark" sets dark as the initial theme.
 * attribute="class" applies the `.dark` class to <html> which
 * matches the @custom-variant dark (&:is(.dark *)) rule in globals.css.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange={false}>
      {children}
    </NextThemesProvider>
  );
}
