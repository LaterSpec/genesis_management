"use client";

import * as React from "react";
import { useTheme } from "@/components/ThemeProvider";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <button className="p-2 text-on-surface/70 hover:bg-primary-container/10 hover:text-primary rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center">
        <span className="material-symbols-outlined">dark_mode</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="p-2 text-on-surface/70 hover:bg-primary-container/10 hover:text-primary rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center"
      title="Alternar tema oscuro/claro"
    >
      <span className="material-symbols-outlined">
        {resolvedTheme === "dark" ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
