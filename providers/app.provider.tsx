import { PropsWithChildren } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/theme.provider";

export default function AppProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  );
}
