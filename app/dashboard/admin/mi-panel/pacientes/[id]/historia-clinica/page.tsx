import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import ClinicalHistoryEditor from "@/app/components/clinical-history/ClinicalHistoryEditor";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function HistoriaClinicaPage({
  params,
}: Props) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
      branch: true,
      plan: true,

      histories: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          entries: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  });

  if (!patient) {
    notFound();
  }

  const history = patient.histories[0] ?? null;

  const serializedEntries =
    history?.entries.map((entry) => ({
      id: entry.id,
      professionalName: entry.professionalName,
      professionalLicense: entry.professionalLicense,
      diagnosis: entry.diagnosis,
      treatment: entry.treatment,
      evolution: entry.evolution,
      indications: entry.indications,
      notes: entry.notes,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    })) ?? [];

  return (
    <div className="space-y-8">
      <Link
        href={`/dashboard/admin/mi-panel/pacientes/${patient.id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#A2B38B] transition hover:text-[#8FA178]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al paciente
      </Link>

      <ClinicalHistoryEditor
        patientId={patient.id}
        entries={serializedEntries}
      />
    </div>
  );
}