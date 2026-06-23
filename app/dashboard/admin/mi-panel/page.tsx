import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function MiPanelPage() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const now = new Date();

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const [
    totalPatients,
    todayAppointments,
    pendingAppointments,
    monthlyPayments,
    pendingPayments,
    latePayments,
  ] = await Promise.all([
    prisma.patient.count(),

    prisma.appointment.count({
      where: {
        date: {
          gte: startOfToday,
          lt: endOfToday,
        },
      },
    }),

    prisma.appointment.count({
      where: {
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
    }),

    prisma.payment.aggregate({
      where: {
        status: "PAID",
        paidAt: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    }),

    prisma.payment.aggregate({
      where: {
        status: "PENDING",
      },
      _sum: {
        amount: true,
      },
    }),

    prisma.payment.count({
      where: {
        status: "PENDING",
        dueDate: {
          lt: now,
        },
      },
    }),
  ]);

  const incomeThisMonth = monthlyPayments._sum.amount || 0;
  const pendingAmount = pendingPayments._sum.amount || 0;

  const cards = [
    {
      title: "Pacientes totales",
      value: totalPatients,
      href: "/dashboard/admin/mi-panel/pacientes",
    },
    {
      title: "Turnos de hoy",
      value: todayAppointments,
      href: "/dashboard/admin/mi-panel/turnos",
    },
    {
      title: "Turnos pendientes",
      value: pendingAppointments,
      href: "/dashboard/admin/mi-panel/turnos",
    },
    {
      title: "Ingresos del mes",
      value: `$${incomeThisMonth.toLocaleString("es-AR")}`,
      href: "/dashboard/admin/mi-panel/ingresos",
    },
    {
      title: "Pagos pendientes",
      value: `$${pendingAmount.toLocaleString("es-AR")}`,
      href: "/dashboard/admin/mi-panel/ingresos",
    },
    {
      title: "Pagos demorados",
      value: latePayments,
      href: "/dashboard/admin/mi-panel/ingresos",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Mi panel odontológico</h1>
        <p className="mt-2 text-gray-500">
          Vista general de pacientes, turnos, presupuestos e ingresos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <p className="text-sm font-medium text-gray-500">
              {card.title}
            </p>

            <p className="mt-3 text-3xl font-bold text-gray-900">
              {card.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold">Accesos rápidos</h2>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/dashboard/admin/mi-panel/pacientes"
            className="rounded bg-[#A2B38B] px-4 py-2 text-white hover:bg-[#8FA178]"
          >
            Ver pacientes
          </Link>

          <Link
            href="/dashboard/admin/mi-panel/turnos"
            className="rounded bg-[#A2B38B] px-4 py-2 text-white hover:bg-[#8FA178]"
          >
            Ver turnos
          </Link>

          <Link
            href="/dashboard/admin/mi-panel/presupuestos"
            className="rounded bg-[#A2B38B] px-4 py-2 text-white hover:bg-[#8FA178]"
          >
            Crear presupuesto
          </Link>

          <Link
            href="/dashboard/admin/mi-panel/ingresos"
            className="rounded bg-[#A2B38B] px-4 py-2 text-white hover:bg-[#8FA178]"
          >
            Ver ingresos
          </Link>
        </div>
      </div>
    </div>
  );
}