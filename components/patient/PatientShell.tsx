"use client";

import { useState } from "react";
import { Bell, Menu } from "lucide-react";
import PatientSidebar from "./PatientSidebar";

type PatientShellProps = {
  children: React.ReactNode;
  patientName: string;
  initials: string;
  patientImage?: string | null;
  clinicName: string;
  logoUrl?: string | null;
};

export default function PatientShell({
  children,
  patientName,
  initials,
  patientImage,
  clinicName,
  logoUrl,
}: PatientShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <PatientSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        clinicName={clinicName}
        logoUrl={logoUrl}
      />

      <div
        className={`min-h-screen transition-[margin] duration-300 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-0"
        }`}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#DED9CD] bg-[#FFFCF7]/95 px-5 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen((current) => !current)}
              aria-label={
                sidebarOpen ? "Cerrar menú" : "Abrir menú"
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center text-[#6F855F] transition hover:bg-[#F0EDE6]"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="hidden min-w-0 items-center gap-3 sm:flex">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={clinicName}
                  className="h-9 w-9 shrink-0 object-contain"
                />
              ) : null}

              <span className="truncate text-sm font-semibold text-[#263F3B]">
                {clinicName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              aria-label="Notificaciones"
              className="flex h-10 w-10 items-center justify-center text-[#6F855F] transition hover:bg-[#F0EDE6]"
            >
              <Bell className="h-5 w-5" />
            </button>

            {patientImage ? (
              <img
                src={patientImage}
                alt={patientName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6F855F] text-sm font-semibold text-white">
                {initials || "P"}
              </div>
            )}

            <span className="hidden max-w-48 truncate text-sm font-medium md:block">
              {patientName}
            </span>
          </div>
        </header>

        <main className="px-5 py-6 md:px-8 md:py-8 xl:px-10">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}