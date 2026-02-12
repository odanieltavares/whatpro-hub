import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar";

export default function MainLayout() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isEmbed = params.get("embed") === "1";

  if (isEmbed) {
    return (
      <main className="w-full h-screen">
        <div className="h-full">
          <Outlet />
        </div>
      </main>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <div className="flex h-16 items-center border-b px-4">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold ml-4">WhatPro Hub</h1>
        </div>
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}
