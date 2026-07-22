import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ClinicalHistoryEditor from "@/app/components/clinical-history/ClinicalHistoryEditor";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function HistoriaClinicaPage({ params }: Props) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
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
    <div className="space-y-8">
      <Link
        href={`/dashboard/admin/mi-panel/pacientes/${patient.id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#A2B38B] transition hover:text-[#8FA178]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al paciente
      </Link>

      <ClinicalHistoryEditor patientId={patient.id} />
    </div>
  );
}