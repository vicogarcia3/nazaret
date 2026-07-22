"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  CalendarDays,
  CalendarPlus,
  CreditCard,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  User,
  X,
} from "lucide-react";

type PatientSidebarProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  clinicName: string;
  logoUrl?: string | null;
};

export default function PatientSidebar({
  open,
  setOpen,
  clinicName,
  logoUrl,
}: PatientSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard/patient") {
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
      className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[#DED9CD] bg-[#FFFCF7] px-5 py-5 shadow-sm transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mb-8 flex min-h-12 items-center justify-between gap-3 pl-1">
        <Link
          href="/dashboard/patient"
          className="flex min-w-0 items-center gap-3"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={clinicName}
              className="h-11 w-11 shrink-0 object-contain"
            />
          ) : null}

          <span className="line-clamp-2 text-lg font-semibold leading-tight text-[#263F3B]">
            {clinicName}
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
          className="flex h-9 w-9 shrink-0 items-center justify-center text-[#6F855F] transition hover:bg-[#F0EDE6]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        <Link
          href="/dashboard/patient"
          className={menuClass("/dashboard/patient")}
        >
          <Home className="h-5 w-5" />
          Inicio
        </Link>

        <Link
          href="/dashboard/patient/reservar"
          className={menuClass("/dashboard/patient/reservar")}
        >
          <CalendarPlus className="h-5 w-5" />
          Reservar turno
        </Link>

        <Link
          href="/dashboard/patient/turnos"
          className={menuClass("/dashboard/patient/turnos")}
        >
          <CalendarDays className="h-5 w-5" />
          Mis turnos
        </Link>

        <Link
          href="/dashboard/patient/presupuestos"
          className={menuClass("/dashboard/patient/presupuestos")}
        >
          <FileText className="h-5 w-5" />
          Presupuestos
        </Link>

        <Link
          href="/dashboard/patient/pagos"
          className={menuClass("/dashboard/patient/pagos")}
        >
          <CreditCard className="h-5 w-5" />
          Pagos
        </Link>

        <Link
          href="/dashboard/patient/perfil"
          className={menuClass("/dashboard/patient/perfil")}
        >
          <User className="h-5 w-5" />
          Mi perfil
        </Link>

        <Link
          href="/dashboard/patient/ayuda"
          className={menuClass("/dashboard/patient/ayuda")}
        >
          <HelpCircle className="h-5 w-5" />
          Ayuda
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