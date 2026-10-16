"use client";

import React, { ReactNode } from "react";
import { AppProvider } from "@/context/AppContext";

export function Providers({ children }: { children: ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
