"use client";

import React, { ReactNode } from "react";
import { useApp } from "@/context/AppContext";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { TopHeader } from "./TopHeader";
import { RdoModal } from "./RdoModal";

export function AppLayout({ children }: { children: ReactNode }) {
  const { isCreateModalOpen, closeCreateModal, createModalInitialDate } = useApp();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F7F9FB] text-[#1F2A37]">
      {/* Sidebar for Desktop/Tablet */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-8">
        <TopHeader />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Floating Bottom Nav for Mobile with elevated FAB */}
      <BottomNav />

      {/* Global RDO Modal (multi-step wizard) */}
      <RdoModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        initialDate={createModalInitialDate}
        onSuccess={() => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("rdo-created"));
          }
        }}
      />
    </div>
  );
}
