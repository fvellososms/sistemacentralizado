"use client";

import React, { ReactNode } from "react";
import { AppProvider } from "@/context/AppContext";
import { GlobalToastViewport } from "@/components/ui";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      {children}
      <GlobalToastViewport />
    </AppProvider>
  );
}
