import Link from "next/link";
import {
  Home,
  CalendarDays,
  FileText,
  CreditCard,
  User,
  HelpCircle,
  LogOut,
  Bell,
  CalendarPlus,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const patient = await prisma.patient.findFirst({
    where: {
      userId: session.user.id,
    },
  });

  const initials = `${patient?.firstName?.charAt(0) ?? ""}${
    patient?.lastName?.charAt(0) ?? ""
  }`.toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-[#DED9CD] bg-[#FFFCF7] px-6 py-8 lg:flex lg:flex-col">
        <div className="mb-14 flex items-center gap-4">
          <div className="font-[var(--font-cormorant)] text-5xl">N</div>

          <div className="text-sm font-semibold uppercase tracking-[0.25em]">
            Consultorios
            <br />
            Nazaret
          </div>
        </div>

        <nav className="flex-1 space-y-2 text-sm">
          <Link
            href="/dashboard/patient"
            className="flex items-center gap-3 px-5 py-4 text-[#5F6F6B] hover:bg-[#F0EDE6]"
          >
            <Home className="h-5 w-5" />
            Inicio
          </Link>

          <Link
            href="/dashboard/patient/reservar"
            className="flex items-center gap-3 px-5 py-4 text-[#5F6F6B] hover:bg-[#F0EDE6]"
          >
            <CalendarPlus className="h-5 w-5" />
            Reservar turno
          </Link>

          <Link
            href="/dashboard/patient/turnos"
            className="flex items-center gap-3 px-5 py-4 text-[#5F6F6B] hover:bg-[#F0EDE6]"
          >
            <CalendarDays className="h-5 w-5" />
            Mis turnos
          </Link>

          <Link
            href="/dashboard/patient/presupuestos"
            className="flex items-center gap-3 px-5 py-4 text-[#5F6F6B] hover:bg-[#F0EDE6]"
          >
            <FileText className="h-5 w-5" />
            Presupuestos
          </Link>

          <Link
            href="/dashboard/patient/pagos"
            className="flex items-center gap-3 px-5 py-4 text-[#5F6F6B] hover:bg-[#F0EDE6]"
          >
            <CreditCard className="h-5 w-5" />
            Pagos
          </Link>

          <Link
            href="/dashboard/patient/perfil"
            className="flex items-center gap-3 px-5 py-4 text-[#5F6F6B] hover:bg-[#F0EDE6]"
          >
            <User className="h-5 w-5" />
            Mi perfil
          </Link>

          <Link
            href="/dashboard/patient/ayuda"
            className="flex items-center gap-3 px-5 py-4 text-[#5F6F6B] hover:bg-[#F0EDE6]"
          >
            <HelpCircle className="h-5 w-5" />
            Ayuda
          </Link>
        </nav>

        <Link
          href="/login"
          className="flex items-center gap-3 border-t border-[#DED9CD] px-5 py-5 text-sm text-[#5F6F6B] hover:bg-[#F0EDE6]"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </Link>
      </aside>

      <main className="lg:ml-72">
        <header className="flex h-24 items-center justify-end border-b border-[#DED9CD] bg-[#FFFCF7] px-10">
          <div className="flex items-center gap-5">
            <Bell className="h-5 w-5 text-[#5F6F6B]" />

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6F855F] text-white font-semibold">
              {initials || "P"}
            </div>

            <span className="text-sm">
              {patient
                ? `${patient.firstName} ${patient.lastName}`
                : "Paciente"}
            </span>
          </div>
        </header>

        <div className="px-10 py-10">{children}</div>
      </main>
    </div>
  );
}