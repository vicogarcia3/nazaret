"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ClipboardList,
  Search,
  UserRound,
  Stethoscope,
} from "lucide-react";

type Doctor = {
  id: string;
  name: string;
  email: string | null;
  specialty: string | null;
  professionalLicense: string | null;
};

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  dni: string | null;
  branchName: string;
  branchCity: string;

  history: {
    id: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

type Props = {
  doctor: Doctor;
  patients: Patient[];
};

export default function ExternalClinicalHistories({
  doctor,
  patients,
}: Props) {
  const [search, setSearch] = useState("");

  const filteredPatients = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return patients;
    }

    return patients.filter((patient) => {
      const searchableText = [
        patient.firstName,
        patient.lastName,
        patient.dni || "",
        patient.branchName,
        patient.branchCity,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(value);
    });
  }, [patients, search]);

  return (
    <main className="min-h-screen bg-[#F7F5EF] px-5 py-10 text-[#263F3B] md:px-8">
      <div className="mx-auto max-w-5xl">
        {/* CABECERA */}

        <header className="mb-8 border-b border-[#DED9CD] pb-7">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                Consultorios Nazaret
              </p>

              <h1 className="mt-3 font-serif text-4xl font-medium">
                Historias Clínicas
              </h1>

              <p className="mt-2 text-sm text-[#6B7774]">
                Consulta profesional de historias clínicas.
              </p>
            </div>

            <div className="border border-[#DED9CD] bg-white px-5 py-4">
              <div className="flex items-start gap-3">
                <Stethoscope className="mt-0.5 h-4 w-4 text-[#A2B38B]" />

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                    Acceso como
                  </p>

                  <p className="mt-1 font-medium">
                    {doctor.name}
                  </p>

                  {doctor.specialty && (
                    <p className="mt-1 text-xs text-[#6B7774]">
                      {doctor.specialty}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* BUSCADOR */}

        <section className="border border-[#DED9CD] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#A2B38B]" />

            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A2B38B]">
              Pacientes
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2B38B]" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar por nombre, apellido, DNI o sucursal"
              className="w-full border border-[#DED9CD] bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#263F3B]"
            />
          </div>
        </section>

        {/* LISTADO */}

        <section className="mt-6 space-y-3">
          {filteredPatients.length === 0 && (
            <div className="border border-[#DED9CD] bg-white p-10 text-center">
              <UserRound className="mx-auto h-7 w-7 text-[#A2B38B]" />

              <h2 className="mt-4 font-serif text-2xl">
                No encontramos pacientes
              </h2>

              <p className="mt-2 text-sm text-[#6B7774]">
                Probá con otro nombre, apellido o DNI.
              </p>
            </div>
          )}

          {filteredPatients.map((patient) => (
            <article
              key={patient.id}
              className="border border-[#DED9CD] bg-white px-6 py-5"
            >
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-serif text-2xl font-medium">
                    {patient.lastName},{" "}
                    {patient.firstName}
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#6B7774]">
                    <span>
                      DNI:{" "}
                      {patient.dni ||
                        "Sin registrar"}
                    </span>

                    <span>
                      {patient.branchName} - {patient.branchCity}
                    </span>
                  </div>

                  {patient.history && (
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#A2B38B]">
                      Última actualización:{" "}
                      {new Date(
                        patient.history.updatedAt
                      ).toLocaleDateString(
                        "es-AR"
                      )}
                    </p>
                  )}
                </div>

                {patient.history ? (
                  <Link
                    href={`/historias-clinicas/${patient.id}`}
                    className="inline-flex items-center justify-center border border-[#263F3B] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#263F3B] transition hover:bg-[#263F3B] hover:text-white"
                  >
                    Ver historia
                  </Link>
                ) : (
                  <span className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A9F9D]">
                    Sin historia clínica
                  </span>
                )}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}