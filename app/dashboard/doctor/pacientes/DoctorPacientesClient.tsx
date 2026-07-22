"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  FileText,
  MapPin,
  Phone,
  Search,
  Stethoscope,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
};

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  dni: string | null;
  phone: string;
  branch: Branch;
  plan: {
    id: string;
    name: string;
  } | null;
};

type Props = {
  patients: Patient[];
  branches: Branch[];
};

export default function DoctorPacientesClient({
  patients,
  branches,
}: Props) {
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const filteredPatients = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return patients.filter((patient) => {
      const searchableText = [
        patient.firstName,
        patient.lastName,
        `${patient.firstName} ${patient.lastName}`,
        `${patient.lastName} ${patient.firstName}`,
        patient.dni || "",
        patient.phone,
        patient.branch.name,
        patient.branch.address,
        patient.branch.city,
        patient.plan?.name || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch === "" ||
        searchableText.includes(normalizedSearch);

      const matchesBranch =
        branchFilter === "" ||
        patient.branch.id === branchFilter;

      return matchesSearch && matchesBranch;
    });
  }, [patients, search, branchFilter]);

  const hasActiveFilters =
    search.trim() !== "" || branchFilter !== "";

  function clearFilters() {
    setSearch("");
    setBranchFilter("");
  }

  return (
    <main className="min-h-screen bg-[#F7F5EF] px-4 py-6 text-[#263F3B] sm:px-6 md:px-10 md:py-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#8FA07F]">
              Portal profesional
            </p>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
              Pacientes
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7774]">
              Consultá tus pacientes, accedé a sus fichas y gestioná la
              información clínica desde un solo lugar.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <MetricCard
              label="Pacientes"
              value={patients.length}
              icon={<UsersRound className="h-4 w-4" />}
            />
          </div>
        </header>

        <section className="border border-[#DED9CD] bg-white p-4 md:p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(280px,1fr)_360px_auto] xl:items-end">
            <div>
              <label
                htmlFor="patient-search"
                className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8FA07F]"
              >
                Buscar paciente
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8FA07F]" />

                <input
                  id="patient-search"
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Nombre, apellido, DNI o teléfono"
                  className="w-full border border-[#DED9CD] bg-[#FFFCF7] py-2 pl-11 pr-4 text-sm outline-none transition placeholder:text-[#9AA09E] focus:border-[#6F855F]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="branch-filter"
                className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8FA07F]"
              >
                Filtrar por sucursal
              </label>

              <select
                id="branch-filter"
                value={branchFilter}
                onChange={(event) =>
                  setBranchFilter(event.target.value)
                }
                className="w-full border border-[#DED9CD] bg-[#FFFCF7] px-4 py-2 text-sm text-[#263F3B] outline-none transition focus:border-[#6F855F]"
              >
                <option value="">
                  Todas mis sucursales
                </option>

                {branches.map((branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.name} — {branch.address}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {filteredPatients.length === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters}
            onClear={clearFilters}
          />
        ) : (
          <section className="grid gap-4">
            {filteredPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <article className="flex min-h-[78px] min-w-[145px] items-center gap-4 border border-[#DED9CD] bg-white px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF1E8] text-[#6F855F]">
        {icon}
      </div>

      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8FA07F]">
          {label}
        </p>

        <p className="mt-1 text-2xl font-semibold tracking-tight text-[#263F3B]">
          {value}
        </p>
      </div>
    </article>
  );
}

function PatientCard({
  patient,
}: {
  patient: Patient;
}) {
  const fullName = `${patient.lastName}, ${patient.firstName}`;

  return (
    <article className="group border border-[#DED9CD] bg-white transition hover:border-[#8FA07F]">
      <div className="grid gap-6 p-5 md:p-6 xl:grid-cols-[1.15fr_0.75fr_1fr_auto] xl:items-start">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#EEF1E8] text-[#6F855F]">
            <UserRound className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8FA07F]">
              Paciente
            </p>

            <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-[#263F3B] md:text-2xl">
              {fullName}
            </h2>

            <p className="mt-2 text-sm text-[#6B7774]">
              DNI: {patient.dni || "No registrado"}
            </p>
          </div>
        </div>

        <PatientInfo
          icon={<Phone className="h-4 w-4" />}
          label="Teléfono"
          value={patient.phone || "Sin registrar"}
        />

        <PatientInfo
          icon={<MapPin className="h-4 w-4" />}
          label="Sucursal"
          value={patient.branch.name}
          detail={`${patient.branch.address}, ${patient.branch.city}`}
        />

        <div className="flex flex-wrap gap-2 xl:justify-end xl:pt-4">
          <Link
            href={`/dashboard/doctor/pacientes/${patient.id}/historia-clinica`}
            aria-label={`Abrir historia clínica de ${fullName}`}
            className="inline-flex h-11 w-11 items-center justify-center border border-[#DED9CD] text-[#6F855F] transition hover:border-[#6F855F] hover:bg-[#EEF1E8]"
          >
            <Stethoscope className="h-4 w-4" />
          </Link>

          <Link
            href={`/print/historia-clinica/${patient.id}`}
            target="_blank"
            aria-label={`Abrir PDF de ${fullName}`}
            className="inline-flex h-11 w-11 items-center justify-center border border-[#DED9CD] text-[#6F855F] transition hover:border-[#6F855F] hover:bg-[#EEF1E8]"
          >
            <FileText className="h-4 w-4" />
          </Link>

          <Link
            href={`/dashboard/doctor/pacientes/${patient.id}`}
            className="inline-flex h-11 items-center justify-center gap-2 bg-[#A2B38B] px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#6F855F]"
          >
            Ver ficha
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid border-t border-[#EEEAE1] bg-[#FAF9F5] md:grid-cols-3">
        <FooterDetail
          label="Plan"
          value={patient.plan?.name || "Sin plan"}
          icon={<BadgeCheck className="h-4 w-4" />}
        />

        <FooterDetail
          label="Ciudad"
          value={patient.branch.city}
          icon={<MapPin className="h-4 w-4" />}
        />

        <FooterDetail
          label="Acceso clínico"
          value="Historia y ficha disponibles"
          icon={<Stethoscope className="h-4 w-4" />}
          last
        />
      </div>
    </article>
  );
}

function PatientInfo({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 pt-1">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center text-[#8FA07F]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8FA07F]">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-medium leading-5 text-[#263F3B]">
          {value}
        </p>

        {detail && (
          <p className="mt-1 text-xs leading-5 text-[#6B7774]">
            {detail}
          </p>
        )}
      </div>
    </div>
  );
}

function FooterDetail({
  label,
  value,
  icon,
  last = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-5 py-4 ${
        last
          ? ""
          : "border-b border-[#EEEAE1] md:border-b-0 md:border-r"
      }`}
    >
      <div className="text-[#8FA07F]">{icon}</div>

      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8FA07F]">
          {label}
        </p>

        <p className="mt-1 text-xs font-medium text-[#5F6F6B]">
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <section className="flex min-h-[380px] flex-col items-center justify-center border border-[#DED9CD] bg-white px-6 py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF1E8] text-[#6F855F]">
        <UserRound className="h-7 w-7" />
      </div>

      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[#263F3B]">
        {hasFilters
          ? "No encontramos coincidencias"
          : "No hay pacientes disponibles"}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-[#6B7774]">
        {hasFilters
          ? "Probá con otro nombre, DNI, teléfono o seleccioná una sucursal diferente."
          : "Cuando tengas pacientes asociados, aparecerán en esta sección."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-6 inline-flex items-center gap-2 border border-[#263F3B] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#263F3B] transition hover:bg-[#263F3B] hover:text-white"
        >
          <X className="h-4 w-4" />
          Limpiar filtros
        </button>
      )}
    </section>
  );
}