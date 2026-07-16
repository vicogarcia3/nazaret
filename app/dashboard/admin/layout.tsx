"use client";

import { useState } from "react";
import AdminSidebar from "@/components/dashboard/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#F7F5EF]">
      <AdminSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <main
        className={`min-h-screen bg-[#F7F5EF] p-13 transition-all duration-300 ${
          sidebarOpen ? "ml-72" : "pl-24"
        }`}
      >
        {children}
      </main>
    </div>
  );
}