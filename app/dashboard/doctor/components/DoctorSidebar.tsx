"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Home,
  LogOut,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

type DoctorSidebarProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  clinicName: string;
  logoUrl?: string | null;
};

export default function DoctorSidebar({
  open,
  setOpen,
  clinicName,
  logoUrl,
}: DoctorSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard/doctor") {
      return pathname === href;
    }

    return pathname.startsWith(href);
  }

  function menuClass(href: string) {
    return `flex items-center gap-3 px-4 py-3 text-sm transition ${
      isActive(href)
        ? "bg-[#6F855F] text-white"
        : "text-[#5F6F6B] hover:bg-[#F0EDE6]"
    }`;
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-[#DED9CD] bg-[#FFFCF7] px-5 py-5 shadow-sm transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mb-8 flex min-h-12 items-center justify-between gap-3 pl-1">
        <Link
          href="/dashboard/doctor"
          className="flex min-w-0 items-center gap-3"
          onClick={() => setOpen(false)}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={clinicName}
              className="h-11 w-11 shrink-0 object-contain"
            />
          ) : null}

          <div className="min-w-0">
            <span className="line-clamp-2 block text-lg font-semibold leading-tight text-[#263F3B]">
              {clinicName}
            </span>

            <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
              Portal profesional
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        <Link
          href="/dashboard/doctor"
          className={menuClass("/dashboard/doctor")}
        >
          <Home className="h-5 w-5" />
          Inicio
        </Link>

        <Link
          href="/dashboard/doctor/agenda"
          className={menuClass("/dashboard/doctor/agenda")}
        >
          <CalendarDays className="h-5 w-5" />
          Agenda
        </Link>

        <Link
          href="/dashboard/doctor/pacientes"
          className={menuClass("/dashboard/doctor/pacientes")}
        >
          <UsersRound className="h-5 w-5" />
          Pacientes
        </Link>

        <Link
          href="/acceso-clinico"
          className={menuClass("/acceso-clinico")}
        >
          <ClipboardList className="h-5 w-5" />
          Historias clínicas
        </Link>

        <Link
          href="/dashboard/doctor/balance"
          className={menuClass("/dashboard/doctor/balance")}
        >
          <CircleDollarSign className="h-5 w-5" />
          Balance
        </Link>

        <Link
          href="/dashboard/doctor/perfil"
          className={menuClass("/dashboard/doctor/perfil")}
        >
          <UserRound className="h-5 w-5" />
          Mi perfil
        </Link>
      </nav>

      <div className="border-t border-[#DED9CD] pt-4">
        <button
          type="button"
          onClick={() =>
            signOut({
              callbackUrl: "/login",
            })
          }
          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#5F6F6B] transition hover:bg-[#F0EDE6]"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}