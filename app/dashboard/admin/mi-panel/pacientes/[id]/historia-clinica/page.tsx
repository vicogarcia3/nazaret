import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ClinicalHistoryEditor from "../ClinicalHistoryEditor";

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
        className="text-sm text-[#A2B38B] hover:underline"
      >
        ← Volver al paciente
      </Link>

      <ClinicalHistoryEditor patientId={patient.id} />
    </div>
  );
}