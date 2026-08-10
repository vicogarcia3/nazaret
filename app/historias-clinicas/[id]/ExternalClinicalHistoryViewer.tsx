"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ClinicalHistoryAnnex from "@/app/components/clinical-history/ClinicalHistoryAnnex";
import ClinicalHistoryEditor from "@/app/components/clinical-history/ClinicalHistoryEditor";

type Props = {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dni: string | null;
    phone: string;
    email: string | null;
    branchName: string;
    branchCity: string;
  };

  history: {
    id: string;
    diagnosis: string | null;
    treatment: string | null;
    data: Record<string, unknown>;
    updatedAt: string;
  };

  doctor: {
    id: string;
    name: string;
  };

  entries: {
    id: string;
    professionalName: string;
    treatment: string;
    indications: string | null;
    debit: number | null;
    credit: number | null;
    balance: number | null;
    nextAppointment: string | null;
    patientSignature: string | null;
    createdAt: string;
    updatedAt: string;
    isOwn: boolean;
  }[];
};

export default function ExternalClinicalHistoryViewer({
  patient,
  history,
  doctor,
  entries,
}: Props) {
  return (
    <main className="min-h-screen bg-[#F7F5EF] px-5 py-8 text-[#263F3B]">
      <div className="mx-auto w-full max-w-[1320px]">

        <div className="mx-auto w-full max-w-[1180px]">
          <Link
            href="/historias-clinicas"
            className="inline-flex items-center gap-2 text-sm text-[#6F855F] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a historias clínicas
          </Link>
        </div>

        <div className="mx-auto mt-6 w-full max-w-[1180px] border border-[#DED9CD] bg-white p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A2B38B]">
            Historia clínica
          </p>

          <h1 className="mt-2 font-serif text-4xl">
            {patient.lastName}, {patient.firstName}
          </h1>

          <div className="mt-4 flex flex-wrap gap-5 text-sm text-[#6B7774]">
            <span>
              DNI: {patient.dni || "Sin registrar"}
            </span>

            <span>
              {patient.branchName} - {patient.branchCity}
            </span>

            <span>
              Última actualización:{" "}
              {new Date(history.updatedAt).toLocaleDateString("es-AR")}
            </span>
          </div>
        </div>

        <div className="mx-auto mt-6 w-full max-w-[1180px]">
          <ClinicalHistoryEditor
            patientId={patient.id}
            readOnly
          />
        </div>

        <section className="mt-6">
          <div className="mx-auto mb-2 w-full max-w-[1180px]">
            <h2 className="font-serif text-3xl text-[#263F3B]">
              Anexo
            </h2>

            <p className="mt-2 text-sm text-[#6B7774]">
              Podés agregar prestaciones y modificar únicamente los registros creados por vos.
            </p>
          </div>

          <div className="mx-auto w-full max-w-[1180px]">
            <ClinicalHistoryAnnex
              patientName={`${patient.lastName}, ${patient.firstName}`}
              affiliationNumber={
                typeof history.data.numeroAfiliado === "string"
                ? history.data.numeroAfiliado
                : ""
              }
              folioNumber=""
              clinicalHistoryId={history.id}
              entries={entries}
              allowCreate
            />
          </div>
        </section>
      </div>
    </main>
  );
}