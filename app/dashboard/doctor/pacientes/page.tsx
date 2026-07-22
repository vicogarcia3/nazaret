import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import DoctorPacientesClient from "./DoctorPacientesClient";

export default async function DoctorPacientesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "DOCTOR") {
    redirect("/dashboard");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      branches: {
        select: {
          branchId: true,
        },
      },
    },
  });

  if (!doctor) {
    return (
      <main className="min-h-screen bg-[#F7F5EF] px-5 py-8 md:px-10">
        <section className="border border-[#DED9CD] bg-white p-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#263F3B]">
            Perfil profesional no encontrado
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6B7774]">
            Tu usuario todavía no está asociado a un perfil de odontólogo.
            Comunicate con administración para completar la configuración.
          </p>
        </section>
      </main>
    );
  }

  const branchIds = doctor.branches.map(
    (doctorBranch) => doctorBranch.branchId
  );

  const [patients, branches] = await Promise.all([
    prisma.patient.findMany({
      where: {
        OR: [
          {
            branchId: {
              in: branchIds,
            },
          },
          {
            appointments: {
              some: {
                doctorId: doctor.id,
              },
            },
          },
          {
            budgets: {
              some: {
                doctorId: doctor.id,
              },
            },
          },
        ],
      },
      include: {
        branch: true,
        plan: true,
      },
      orderBy: [
        {
          lastName: "asc",
        },
        {
          firstName: "asc",
        },
      ],
    }),

    prisma.branch.findMany({
      where: {
        id: {
          in: branchIds,
        },
        active: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <DoctorPacientesClient
      patients={patients}
      branches={branches}
    />
  );
}