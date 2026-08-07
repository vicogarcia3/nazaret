import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ClinicalHistoryEditor from "@/app/components/clinical-history/ClinicalHistoryEditor";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DoctorClinicalHistoryPage({
  params,
}: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "DOCTOR") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      branches: {
        select: {
          branchId: true,
        },
      },
    },
  });

  if (!doctor) {
    notFound();
  }

  const branchIds = doctor.branches.map(
    (doctorBranch) => doctorBranch.branchId
  );

  const patient = await prisma.patient.findFirst({
    where: {
      id,
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
              doctors: {
                some: {
                  doctorId: doctor.id,
                },
              },
            },
          },
        },
      ],
    },
    include: {
      user: true,
      branch: true,
      plan: true,
    },
  });

  if (!patient) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F7F6F2] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href={`/dashboard/doctor/pacientes/${patient.id}`}
              className="text-sm text-[#6F855F] hover:underline"
            >
              ← Volver al paciente
            </Link>

            <h1 className="mt-2 font-serif text-3xl text-[#263F3B]">
              Historia clínica
            </h1>

            <p className="mt-1 text-sm text-gray-600">
              {patient.lastName}, {patient.firstName}
            </p>
          </div>

          <Link
            href={`/print/historia-clinica/${patient.id}`}
            target="_blank"
            className="inline-flex items-center justify-center bg-[#263F3B] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1d302d]"
          >
            Ver PDF
          </Link>
        </div>

        <ClinicalHistoryEditor patientId={patient.id} />
      </div>
    </main>
  );
}