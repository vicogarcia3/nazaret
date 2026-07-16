import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Palette, FileText, Users, Calendar, ListChecks, BarChart3 } from "lucide-react";

export default async function MiPanelPage() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const cards = [
    {
      title: "Identidad del consultorio",
      description:
        "Nombre del consultorio, lema, descripción e imagen principal.",
      href: "/dashboard/admin/configuracion",
      icon: Palette,
    },
    {
      title: "Contenido del sitio",
      description:
        "Servicios, tratamientos, especialistas, testimonios, datos de contacto y sucursales.",
      href: "/dashboard/admin/configuracion/servicios",
      icon: FileText,
    },
    {
      title: "Pacientes",
      description:
        "Pacientes registrados, sus datos personales e historial clínico.",
      href: "/dashboard/admin/mi-panel/pacientes",
      icon: Users,
    },
    {
      title: "Planes",
      description: "Administración de planes, beneficios y descuentos para pacientes.",
      href: "/dashboard/admin/configuracion/planes",
      icon: ListChecks,
    },
    {
      title: "Agenda",
      description:
        "Calendario de turnos y profesionales",
      href: "/dashboard/admin/mi-panel/turnos",
      icon: Calendar,
    },
    {
      title: "Balance",
      description: "Ingresos, pagos pendientes, gastos y resumen financiero del consultorio.",
      href: "/dashboard/admin/mi-panel/balance",
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <div className="space-y-10">
        <div>
          <h1 className="font-serif text-4xl font-medium leading-tight">
            Panel del consultorio
          </h1>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#6B7774]">
            Desde acá controlás todo lo que ven tus pacientes en el sitio público y
            gestionás la operación interna del consultorio.
          </p>
        </div>

        <section className="grid border border-[#DED9CD] bg-white md:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className="border-b border-[#DED9CD] p-10 transition hover:bg-[#F7F5EF] md:border-r"
              >
                <Icon className="mb-4 h-5 w-7 text-[#A2B38B]" />

                <h2 className="font-serif text-xl font-medium">
                  {card.title}
                </h2>

                <p className="mt-2 max-w-md text-[13px] leading-5 text-[#6B7774]">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </section>
      </div>
    </div>
  );
}