import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  ClipboardList,
  Images,
} from "lucide-react";

import ClinicalHistoryAnnex from "@/app/components/clinical-history/ClinicalHistoryAnnex";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DoctorAnexoHistoriaClinicaPage({
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
      name: true,
    },
  });

  if (!doctor) {
    notFound();
  }

  // El odontólogo solamente puede acceder a pacientes
  // cuya Historia Clínica lo tenga asignado en el campo "odontologo".
  const patient = await prisma.patient.findFirst({
    where: {
      id,
      histories: {
        some: {
          data: {
            path: ["odontologo"],
            equals: doctor.name,
          },
        },
      },
    },
    include: {
      histories: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          annexEntries: {
            orderBy: {
              createdAt: "asc",
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

  const historyData =
    history?.data &&
    typeof history.data === "object" &&
    !Array.isArray(history.data)
      ? (history.data as Record<string, unknown>)
      : {};

  /*
   * Si "consentimientoNombre" existe pero está
   * vacío (arranca así por defecto en el
   * formulario), igual caemos al nombre real
   * del paciente.
   */
  const patientName =
    typeof historyData.consentimientoNombre ===
      "string" &&
    historyData.consentimientoNombre.trim()
      ? historyData.consentimientoNombre
      : `${patient.firstName} ${patient.lastName}`;

  const affiliationNumber =
    typeof historyData.numeroAfiliado === "string" &&
    historyData.numeroAfiliado.trim()
      ? historyData.numeroAfiliado
      : "";

  const entries =
    history?.annexEntries.map((entry) => ({
      id: entry.id,

      professionalName: entry.professionalName,

      treatment: entry.treatment,

      indications: entry.indications,

      debit:
        entry.debit !== null
          ? Number(entry.debit)
          : null,

      credit:
        entry.credit !== null
          ? Number(entry.credit)
          : null,

      balance:
        entry.balance !== null
          ? Number(entry.balance)
          : null,

      performedAt: entry.performedAt.toISOString(),

      nextAppointment: entry.nextAppointment
        ? entry.nextAppointment.toISOString()
        : null,

      patientSignature: entry.patientSignature,

      createdAt: entry.createdAt.toISOString(),

      updatedAt: entry.updatedAt.toISOString(),

      /*
       * El doctor solo puede modificar las
       * entradas que él mismo creó.
       */
      isOwn: entry.createdByDoctorId === doctor.id,
    })) ?? [];

  const basePath = `/dashboard/doctor/pacientes/${patient.id}/historia-clinica`;

  return (
    <main className="min-h-screen bg-[#F7F6F2] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href={`/dashboard/doctor/pacientes/${patient.id}`}
          className="inline-flex items-center gap-2 text-sm text-[#6F855F] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al paciente
        </Link>

        <div className="border-b border-[#DED9CD]">
          <nav className="flex flex-wrap gap-2">
            <Link
              href={basePath}
              className="inline-flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6B7774] transition hover:border-[#A2B38B] hover:text-[#263F3B]"
            >
              <FileText className="h-4 w-4" />
              Historia general
            </Link>

            <Link
              href={`${basePath}/anexo`}
              className="inline-flex items-center gap-2 border-b-2 border-[#263F3B] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#263F3B]"
            >
              <ClipboardList className="h-4 w-4" />
              Anexo
            </Link>

            <Link
              href={`${basePath}/imagenes`}
              className="inline-flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6B7774] transition hover:border-[#A2B38B] hover:text-[#263F3B]"
            >
              <Images className="h-4 w-4" />
              Imágenes / Radiografías
            </Link>
          </nav>
        </div>

        {!history ? (
          <div className="border border-[#DED9CD] bg-white p-8">
            <p className="font-medium text-[#263F3B]">
              Todavía no existe una historia clínica.
            </p>

            <p className="mt-2 text-sm text-[#6B7774]">
              Primero guardá la Historia General
              para poder registrar prestaciones en
              el anexo.
            </p>

            <Link
              href={basePath}
              className="mt-5 inline-flex bg-[#263F3B] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white"
            >
              Ir a Historia General
            </Link>
          </div>
        ) : (
          <ClinicalHistoryAnnex
            patientName={patientName}
            affiliationNumber={affiliationNumber}
            folioNumber=""
            clinicalHistoryId={history.id}
            entries={entries}
            allowCreate
          />
        )}
      </div>
    </main>
  );
}