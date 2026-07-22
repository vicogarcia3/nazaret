"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import DoctorSidebar from "./DoctorSidebar";

type DoctorDashboardShellProps = {
  children: React.ReactNode;
};

export default function DoctorDashboardShell({
  children,
}: DoctorDashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <DoctorSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        clinicName="Consultorios Nazaret"
        logoUrl={null}
      />

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/25 md:hidden"
        />
      )}

      <div
        className={`min-h-screen transition-[margin] duration-300 ${
          sidebarOpen ? "md:ml-64" : "md:ml-0"
        }`}
      >
        <header className="sticky top-0 z-30 border-b border-[#DED9CD] bg-[#FFFCF7]/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSidebarOpen((current) => !current)}
                aria-label={
                  sidebarOpen ? "Cerrar menú" : "Abrir menú"
                }
                className="flex h-10 w-10 items-center justify-center text-[#6F855F] transition hover:bg-[#F0EDE6]"
              >
                <Menu className="h-6 w-6" />
              </button>

              <div>
                <p className="font-serif text-xl font-medium leading-none text-[#263F3B]">
                  Consultorios Nazaret
                </p>

                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A2B38B]">
                  Portal del odontólogo
                </p>
              </div>
            </div>
          </div>
        </header>

        <div>{children}</div>
      </div>
    </div>
  );
}