"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ClipboardList,
  Search,
  Share2,
  X,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  dni: string | null;

  branchId: string;
  branchName: string;
  branchCity: string;
  branchAddress: string;

  history: {
    id: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

type Doctor = {
  id: string;
  name: string;
  email: string | null;
  specialty: string | null;
  professionalLicense: string | null;
  hasClinicalAccess: boolean;
};

type Props = {
  patients: Patient[];
  doctors: Doctor[];
};

export default function ClinicalHistoriesManager({
  patients,
  doctors,
}: Props) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [shareOpen, setShareOpen] =
    useState(false);
  const [savingAccess, setSavingAccess] =
    useState(false);

  const [selectedDoctorIds, setSelectedDoctorIds] =
    useState<string[]>(
      doctors
        .filter(
          (doctor) =>
            doctor.hasClinicalAccess
        )
        .map((doctor) => doctor.id)
    );

  const cities = useMemo(() => {
    return Array.from(
      new Set(
        patients
          .map((patient) => patient.branchCity)
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [patients]);

  const availableBranches = useMemo(() => {
    const source = selectedCity
      ? patients.filter(
          (patient) =>
            patient.branchCity === selectedCity
        )
      : patients;

    const map = new Map<
      string,
      {
        id: string;
        name: string;
        city: string;
        address: string;
      }
    >();

    source.forEach((patient) => {
      if (!map.has(patient.branchId)) {
        map.set(patient.branchId, {
          id: patient.branchId,
          name: patient.branchName,
          city: patient.branchCity,
          address: patient.branchAddress,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.address.localeCompare(b.address)
    );
  }, [patients, selectedCity]);

  const filteredPatients = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    return patients.filter((patient) => {
      const text = [
        patient.firstName,
        patient.lastName,
        patient.dni || "",
        patient.branchName,
        patient.branchCity,
        patient.branchAddress,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !value || text.includes(value);

      const matchesCity =
        !selectedCity ||
        patient.branchCity === selectedCity;

      const matchesBranch =
        !selectedBranch ||
        patient.branchId === selectedBranch;

      return (
        matchesSearch &&
        matchesCity &&
        matchesBranch
      );
    });
  }, [
    patients,
    search,
    selectedCity,
    selectedBranch,
  ]);

  function toggleDoctor(doctorId: string) {
    setSelectedDoctorIds((current) =>
      current.includes(doctorId)
        ? current.filter(
            (id) => id !== doctorId
          )
        : [...current, doctorId]
    );
  }

  async function saveClinicalAccess() {
    try {
      setSavingAccess(true);

      const response = await fetch(
        "/api/clinical-access",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            doctorIds:
              selectedDoctorIds,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        toast.error(
          data.error ||
            "No se pudieron guardar los accesos."
        );
        return;
      }

      toast.success(
        "Accesos actualizados correctamente."
      );

      setShareOpen(false);
      router.refresh();
    } catch (error) {
      console.error(
        "Error guardando accesos:",
        error
      );

      toast.error(
        "No se pudieron guardar los accesos."
      );
    } finally {
      setSavingAccess(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[#A2B38B]">
            <ClipboardList className="h-5 w-5" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">
              Gestión clínica
            </span>
          </div>

          <h1 className="font-serif text-4xl font-medium text-[#263F3B]">
            Historias Clínicas
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7774]">
            Consultá todas las historias clínicas y
            administrá el acceso de los especialistas
            del consultorio.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShareOpen(true)
          }
          className="inline-flex items-center justify-center gap-2 bg-[#263F3B] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1D302D]"
        >
          <Share2 className="h-4 w-4" />

          Compartir
        </button>
      </div>

      {/* BUSCADOR Y FILTROS */}
      <section className="border border-[#DED9CD] bg-white p-6">
        <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A2B38B]">
          Buscar paciente
        </label>

        <div className="relative mt-3">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2B38B]" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Nombre, apellido, DNI o sucursal"
            className="w-full border border-[#DED9CD] bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#263F3B]"
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {/* CIUDAD */}

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A2B38B]">
              Ciudad
            </label>

            <select
              value={selectedCity}
              onChange={(event) => {
                setSelectedCity(event.target.value);

                // Al cambiar de ciudad limpiamos
                // la sucursal seleccionada.
                setSelectedBranch("");
              }}
              className="w-full border border-[#DED9CD] bg-white px-4 py-3 text-sm text-[#263F3B] outline-none transition focus:border-[#263F3B]"
            >
              <option value="">
                Todas las ciudades
              </option>

              {cities.map((city) => (
                <option
                  key={city}
                  value={city}
                >
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* SUCURSAL */}

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A2B38B]">
              Sucursal
            </label>

            <select
              value={selectedBranch}
              onChange={(event) =>
                setSelectedBranch(
                  event.target.value
                )
              }
              className="w-full border border-[#DED9CD] bg-white px-4 py-3 text-sm text-[#263F3B] outline-none transition focus:border-[#263F3B]"
            >
              <option value="">
                Todas las sucursales
              </option>

              {availableBranches.map(
                (branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.name} —{" "}
                    {branch.address}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </section>

      {/* LISTADO */}

      <section className="space-y-4">
        {filteredPatients.length === 0 && (
          <div className="border border-[#DED9CD] bg-white p-10 text-center">
            <UserRound className="mx-auto h-7 w-7 text-[#A2B38B]" />

            <h2 className="mt-4 font-serif text-2xl text-[#263F3B]">
              No encontramos pacientes
            </h2>

            <p className="mt-2 text-sm text-[#6B7774]">
              Probá con otro nombre,
              apellido o DNI.
            </p>
          </div>
        )}

        {filteredPatients.map(
          (patient) => (
            <article
              key={patient.id}
              className="border border-[#DED9CD] bg-white px-6 py-5"
            >
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <p className="font-serif text-2xl font-medium text-[#263F3B]">
                    {patient.lastName},{" "}
                    {patient.firstName}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#6B7774]">
                    <span>
                      DNI:{" "}
                      {patient.dni ||
                        "Sin registrar"}
                    </span>

                    <span>
                      {patient.branchName} — {patient.branchAddress},{" "}
                      {patient.branchCity}
                    </span>
                  </div>

                  {patient.history && (
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A2B38B]">
                      Última actualización:{" "}
                      {new Date(
                        patient.history.updatedAt
                      ).toLocaleDateString(
                        "es-AR"
                      )}
                    </p>
                  )}
                </div>

                <div>
                  {patient.history ? (
                    <Link
                      href={`/dashboard/admin/mi-panel/pacientes/${patient.id}/historia-clinica`}
                      className="inline-flex items-center justify-center border border-[#263F3B] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#263F3B] transition hover:bg-[#263F3B] hover:text-white"
                    >
                      Ver historia
                    </Link>
                  ) : (
                    <span className="inline-flex px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A9F9D]">
                      Sin historia clínica
                    </span>
                  )}
                </div>
              </div>
            </article>
          )
        )}
      </section>

      {/* MODAL COMPARTIR */}

      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden border border-[#DED9CD] bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-[#DED9CD] px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A2B38B]">
                  Acceso profesional
                </p>

                <h2 className="mt-2 font-serif text-3xl font-medium text-[#263F3B]">
                  Compartir historias clínicas
                </h2>

                <p className="mt-2 max-w-lg text-sm leading-6 text-[#6B7774]">
                  Seleccioná los especialistas que
                  podrán consultar todas las historias
                  clínicas del consultorio.
                </p>
              </div>

              <button
                type="button"
                disabled={savingAccess}
                onClick={() =>
                  setShareOpen(false)
                }
                className="text-[#6B7774] transition hover:text-[#263F3B]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {doctors.length > 0 && (
                    <div className="mb-4 flex items-center justify-between border-b border-[#DED9CD] pb-4">
                        <label className="flex cursor-pointer items-center gap-3">
                        <input
                            type="checkbox"
                            checked={
                            doctors.filter((doctor) => doctor.email).length > 0 &&
                            doctors
                                .filter((doctor) => doctor.email)
                                .every((doctor) =>
                                selectedDoctorIds.includes(doctor.id)
                                )
                            }
                            onChange={(event) => {
                            const selectableDoctorIds = doctors
                                .filter((doctor) => doctor.email)
                                .map((doctor) => doctor.id);

                            if (event.target.checked) {
                                setSelectedDoctorIds(selectableDoctorIds);
                            } else {
                                setSelectedDoctorIds([]);
                            }
                            }}
                            className="h-4 w-4 accent-[#263F3B]"
                        />

                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#263F3B]">
                            Seleccionar todos
                        </span>
                        </label>

                        <span className="text-xs text-[#6B7774]">
                        {
                            selectedDoctorIds.filter((id) =>
                            doctors.some(
                                (doctor) =>
                                doctor.id === id && doctor.email
                            )
                            ).length
                        }{" "}
                        de{" "}
                        {
                            doctors.filter((doctor) => doctor.email)
                            .length
                        }{" "}
                        seleccionados
                        </span>
                    </div>
                    )}
              {doctors.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#6B7774]">
                  No hay especialistas
                  cargados.
                </p>
              ) : (
                <div className="space-y-3">
                  {doctors.map(
                    (doctor) => {
                      const selected =
                        selectedDoctorIds.includes(
                          doctor.id
                        );

                      const hasEmail =
                        Boolean(
                          doctor.email
                        );

                      return (
                        <label
                          key={doctor.id}
                          className={`flex items-start gap-4 border p-4 transition ${
                            hasEmail
                              ? "cursor-pointer border-[#DED9CD] hover:bg-[#F7F5EF]"
                              : "cursor-not-allowed border-[#EEEAE1] bg-[#FAF9F5] opacity-60"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={
                              selected
                            }
                            disabled={
                              !hasEmail
                            }
                            onChange={() =>
                              toggleDoctor(
                                doctor.id
                              )
                            }
                            className="mt-1 h-4 w-4 accent-[#263F3B]"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[#263F3B]">
                              {doctor.name}
                            </p>

                            {doctor.specialty && (
                              <p className="mt-1 text-xs text-[#6B7774]">
                                {
                                  doctor.specialty
                                }
                              </p>
                            )}

                            <p
                              className={`mt-2 text-xs ${
                                hasEmail
                                  ? "text-[#6F855F]"
                                  : "text-[#B56E6E]"
                              }`}
                            >
                              {doctor.email ||
                                "Sin email cargado"}
                            </p>
                          </div>

                          {doctor.professionalLicense && (
                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#A2B38B]">
                              MP{" "}
                              {
                                doctor.professionalLicense
                              }
                            </span>
                          )}
                        </label>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            <div className="shrink-0 flex justify-end gap-3 border-t border-[#DED9CD] bg-white px-6 py-5">
              <button
                type="button"
                disabled={savingAccess}
                onClick={() =>
                  setShareOpen(false)
                }
                className="border border-[#DED9CD] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#263F3B] transition hover:bg-[#F7F5EF] disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={savingAccess}
                onClick={
                  saveClinicalAccess
                }
                className="bg-[#263F3B] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1D302D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingAccess
                  ? "Guardando..."
                  : "Guardar accesos"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}