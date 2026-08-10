"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Palette,
  FileText,
  Users,
  ListChecks,
  Calendar,
  BarChart3,
  BadgePlus,
  ClipboardList,
} from "lucide-react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function AdminSidebar({ open, setOpen }: Props) {
  const pathname = usePathname();

  const menuClass = (href: string) => {
    let active = false;

    if (href === "/dashboard/admin/mi-panel") {
      active = pathname === href;
    } else if (href === "/dashboard/admin/configuracion") {
      active = pathname === href;
    } else {
      active = pathname.startsWith(href);
    }

    return `flex items-center gap-3 px-4 py-3 transition ${
      active
        ? "bg-[#263F3B] text-white"
        : "text-[#5F6F6B] hover:bg-[#F0EDE6]"
    }`;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-4 z-50 rounded-md bg-[#F7F5EF] px-3 py-2 text-[#263F3B] shadow-sm hover:bg-[#F7F5EF]"
      >
        ☰
      </button>

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[#DED9CD] bg-[#FFFCF7] px-6 py-5 shadow-sm transition-transform duration-300 ${          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h1 className="mb-10 pl-10 font-serif text-2xl font-medium text-[#263F3B]">
          Panel
        </h1>

        <nav className="flex-1 space-y-2 text-sm">
          <Link
            href="/dashboard/admin/mi-panel"
            className={menuClass("/dashboard/admin/mi-panel")}
          >
            <LayoutDashboard className="h-4 w-4" />
            Inicio
          </Link>

          <Link
            href="/dashboard/admin/configuracion"
            className={menuClass("/dashboard/admin/configuracion")}
          >
            <Palette className="h-4 w-4" />
            Identidad
          </Link>

          <Link
            href="/dashboard/admin/configuracion/servicios"
            className={menuClass("/dashboard/admin/configuracion/servicios")}
          >
            <FileText className="h-4 w-4" />
            Contenido
          </Link>

          <Link
            href="/dashboard/admin/mi-panel/pacientes"
            className={menuClass("/dashboard/admin/mi-panel/pacientes")}
          >
            <Users className="h-4 w-4" />
            Pacientes
          </Link>

          <Link
            href="/dashboard/admin/mi-panel/historias-clinicas"
            className={menuClass(
              "/dashboard/admin/mi-panel/historias-clinicas"
            )}
          >
            <ClipboardList className="h-4 w-4" />
            Historias Clínicas
          </Link>

          <Link
            href="/dashboard/admin/configuracion/planes"
            className={menuClass("/dashboard/admin/configuracion/planes")}
          >
            <ListChecks className="h-4 w-4" />
            Planes
          </Link>

          <Link
            href="/dashboard/admin/configuracion/obras-sociales"
            className={menuClass(
              "/dashboard/admin/configuracion/obras-sociales"
            )}
          >
            <BadgePlus className="h-4 w-4" />
            Obras Sociales
          </Link>

          <Link
            href="/dashboard/admin/mi-panel/turnos"
            className={menuClass("/dashboard/admin/mi-panel/turnos")}
          >
            <Calendar className="h-4 w-4" />
            Agenda
          </Link>

          <Link
            href="/dashboard/admin/mi-panel/balance"
            className={menuClass("/dashboard/admin/mi-panel/balance")}
          >
            <BarChart3 className="h-4 w-4" />
            Balance
          </Link>
        </nav>

        <div className="border-t border-[#DED9CD] pt-4 space-y-1">
          <Link
            href="/dashboard/admin/usuarios"
            className="flex items-center gap-3 px-4 py-3 text-sm text-[#5F6F6B] transition hover:bg-[#F0EDE6]"
          >
            <Users className="h-4 w-4" />
            Usuarios
          </Link>

          <button
            onClick={() =>
              signOut({
                callbackUrl: "/login",
              })
            }
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#5F6F6B] transition hover:bg-[#F0EDE6]"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}