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
  shareAll: boolean;
  sharedPatientIds: string[];
};

type DoctorConfig = {
  shareAll: boolean;
  patientIds: string[];
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
  const [selectedBranch, setSelectedBranch] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [savingAccess, setSavingAccess] = useState(false);

  const [selectedDoctorIds, setSelectedDoctorIds] = useState<
    string[]
  >(
    doctors
      .filter((doctor) => doctor.hasClinicalAccess)
      .map((doctor) => doctor.id)
  );

  // Config puntual (shareAll / patientIds) por doctor.
  // Arranca con lo que ya había guardado en la base.
  const [doctorConfigs, setDoctorConfigs] = useState<
    Record<string, DoctorConfig>
  >(() => {
    const initial: Record<string, DoctorConfig> = {};

    doctors.forEach((doctor) => {
      initial[doctor.id] = {
        shareAll: doctor.shareAll,
        patientIds: doctor.sharedPatientIds,
      };
    });

    return initial;
  });

  // Doctor cuyo picker de pacientes está abierto (o null).
  const [pickerDoctorId, setPickerDoctorId] = useState<
    string | null
  >(null);

  // Estado "borrador" dentro del picker (se descarta con Cancelar).
  const [draftShareAll, setDraftShareAll] = useState(true);
  const [draftPatientIds, setDraftPatientIds] = useState<
    string[]
  >([]);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerBranch, setPickerBranch] = useState("");

  const availableBranches = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        city: string;
        address: string;
      }
    >();

    patients.forEach((patient) => {
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
  }, [patients]);

  // Sucursales para el filtro DENTRO del picker (todas, sin
  // depender de los filtros de la lista principal).
  const pickerBranches = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; address: string }
    >();

    patients.forEach((patient) => {
      if (!map.has(patient.branchId)) {
        map.set(patient.branchId, {
          id: patient.branchId,
          name: patient.branchName,
          address: patient.branchAddress,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.address.localeCompare(b.address)
    );
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const value = search.trim().toLowerCase();

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

      const matchesSearch = !value || text.includes(value);

      const matchesBranch =
        !selectedBranch ||
        patient.branchId === selectedBranch;

      return matchesSearch && matchesBranch;
    });
  }, [patients, search, selectedBranch]);

  // Pacientes filtrados DENTRO del picker de un doctor puntual.
  const pickerFilteredPatients = useMemo(() => {
    const value = pickerSearch.trim().toLowerCase();

    return patients.filter((patient) => {
      const text = [
        patient.firstName,
        patient.lastName,
        patient.dni || "",
        patient.branchName,
        patient.branchAddress,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !value || text.includes(value);

      const matchesBranch =
        !pickerBranch || patient.branchId === pickerBranch;

      return matchesSearch && matchesBranch;
    });
  }, [patients, pickerSearch, pickerBranch]);

  function toggleDoctor(doctorId: string) {
    setSelectedDoctorIds((current) =>
      current.includes(doctorId)
        ? current.filter((id) => id !== doctorId)
        : [...current, doctorId]
    );
  }

  function openPicker(doctorId: string) {
    const config = doctorConfigs[doctorId] ?? {
      shareAll: true,
      patientIds: [],
    };

    setDraftShareAll(config.shareAll);
    setDraftPatientIds(config.patientIds);
    setPickerSearch("");
    setPickerBranch("");
    setPickerDoctorId(doctorId);
  }

  function closePicker() {
    setPickerDoctorId(null);
  }

  function togglePickerPatient(patientId: string) {
    setDraftPatientIds((current) =>
      current.includes(patientId)
        ? current.filter((id) => id !== patientId)
        : [...current, patientId]
    );
  }

  function savePickerSelection() {
    if (!pickerDoctorId) {
      return;
    }

    setDoctorConfigs((current) => ({
      ...current,
      [pickerDoctorId]: {
        shareAll: draftShareAll,
        patientIds: draftPatientIds,
      },
    }));

    closePicker();
  }

  async function saveClinicalAccess() {
    try {
      setSavingAccess(true);

      const response = await fetch("/api/clinical-access", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctors: selectedDoctorIds.map((doctorId) => ({
            doctorId,
            shareAll:
              doctorConfigs[doctorId]?.shareAll ?? true,
            patientIds:
              doctorConfigs[doctorId]?.patientIds ?? [],
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.error || "No se pudieron guardar los accesos."
        );
        return;
      }

      toast.success("Accesos actualizados correctamente.");

      setShareOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error guardando accesos:", error);

      toast.error("No se pudieron guardar los accesos.");
    } finally {
      setSavingAccess(false);
    }
  }

  const pickerDoctor = doctors.find(
    (doctor) => doctor.id === pickerDoctorId
  );

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
          onClick={() => setShareOpen(true)}
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
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre, apellido, DNI o sucursal"
            className="w-full border border-[#DED9CD] bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#263F3B]"
          />
        </div>

        <div className="mt-4">
          {/* SUCURSAL */}

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A2B38B]">
              Sucursal
            </label>

            <select
              value={selectedBranch}
              onChange={(event) =>
                setSelectedBranch(event.target.value)
              }
              className="w-full border border-[#DED9CD] bg-white px-4 py-3 text-sm text-[#263F3B] outline-none transition focus:border-[#263F3B]"
            >
              <option value="">Todas las sucursales</option>

              {availableBranches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} — {branch.address}
                </option>
              ))}
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
                <p className="font-serif text-2xl font-medium text-[#263F3B]">
                  {patient.lastName}, {patient.firstName}
                </p>

                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#6B7774]">
                  <span>
                    DNI: {patient.dni || "Sin registrar"}
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
                    ).toLocaleDateString("es-AR")}
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
        ))}
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
                  Seleccioná los especialistas que podrán
                  consultar historias clínicas. Por defecto
                  ven todas; podés elegir cuáles puntualmente
                  desde "Seleccionar historias clínicas".
                </p>
              </div>

              <button
                type="button"
                disabled={savingAccess}
                onClick={() => setShareOpen(false)}
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
                        doctors.filter((doctor) => doctor.email)
                          .length > 0 &&
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
                          setSelectedDoctorIds(
                            selectableDoctorIds
                          );
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
                  No hay especialistas cargados.
                </p>
              ) : (
                <div className="space-y-3">
                  {doctors.map((doctor) => {
                    const selected = selectedDoctorIds.includes(
                      doctor.id
                    );

                    const hasEmail = Boolean(doctor.email);

                    const config = doctorConfigs[doctor.id];

                    const scopeLabel = !config || config.shareAll
                      ? "Todas las historias clínicas"
                      : `${config.patientIds.length} paciente${
                          config.patientIds.length === 1
                            ? ""
                            : "s"
                        } seleccionado${
                          config.patientIds.length === 1
                            ? ""
                            : "s"
                        }`;

                    return (
                      <div
                        key={doctor.id}
                        className={`border p-4 transition ${
                          hasEmail
                            ? "border-[#DED9CD] hover:bg-[#F7F5EF]"
                            : "border-[#EEEAE1] bg-[#FAF9F5] opacity-60"
                        }`}
                      >
                        <label
                          className={`flex items-start gap-4 ${
                            hasEmail
                              ? "cursor-pointer"
                              : "cursor-not-allowed"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={!hasEmail}
                            onChange={() =>
                              toggleDoctor(doctor.id)
                            }
                            className="mt-1 h-4 w-4 accent-[#263F3B]"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[#263F3B]">
                              {doctor.name}
                            </p>

                            {doctor.specialty && (
                              <p className="mt-1 text-xs text-[#6B7774]">
                                {doctor.specialty}
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
                              MP {doctor.professionalLicense}
                            </span>
                          )}
                        </label>

                        {selected && (
                          <div className="mt-3 flex items-center justify-between border-t border-[#DED9CD] pt-3 pl-8">
                            <span className="text-[11px] text-[#6B7774]">
                              {scopeLabel}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                openPicker(doctor.id)
                              }
                              className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#263F3B] underline underline-offset-2 hover:text-[#1D302D]"
                            >
                              Seleccionar historias clínicas
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="shrink-0 flex justify-end gap-3 border-t border-[#DED9CD] bg-white px-6 py-5">
              <button
                type="button"
                disabled={savingAccess}
                onClick={() => setShareOpen(false)}
                className="border border-[#DED9CD] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#263F3B] transition hover:bg-[#F7F5EF] disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={savingAccess}
                onClick={saveClinicalAccess}
                className="bg-[#263F3B] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1D302D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingAccess ? "Guardando..." : "Guardar accesos"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PICKER DE PACIENTES POR DOCTOR */}

      {pickerDoctorId && pickerDoctor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden border border-[#DED9CD] bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-[#DED9CD] px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A2B38B]">
                  {pickerDoctor.name}
                </p>

                <h2 className="mt-2 font-serif text-2xl font-medium text-[#263F3B]">
                  Seleccionar historias clínicas
                </h2>
              </div>

              <button
                type="button"
                onClick={closePicker}
                className="text-[#6B7774] transition hover:text-[#263F3B]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {/* TODAS */}
              <label className="flex cursor-pointer items-center gap-3 border-b border-[#DED9CD] pb-4">
                <input
                  type="checkbox"
                  checked={draftShareAll}
                  onChange={(event) =>
                    setDraftShareAll(event.target.checked)
                  }
                  className="h-4 w-4 accent-[#263F3B]"
                />

                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#263F3B]">
                  Todas — compartir todas las historias
                  clínicas
                </span>
              </label>

              {!draftShareAll && (
                <>
                  {/* FILTROS */}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2B38B]" />

                      <input
                        value={pickerSearch}
                        onChange={(event) =>
                          setPickerSearch(event.target.value)
                        }
                        placeholder="Nombre, apellido o DNI"
                        className="w-full border border-[#DED9CD] bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#263F3B]"
                      />
                    </div>

                    <select
                      value={pickerBranch}
                      onChange={(event) =>
                        setPickerBranch(event.target.value)
                      }
                      className="w-full border border-[#DED9CD] bg-white px-3 py-2.5 text-sm text-[#263F3B] outline-none transition focus:border-[#263F3B]"
                    >
                      <option value="">
                        Todas las sucursales
                      </option>

                      {pickerBranches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name} — {branch.address}
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="mt-3 text-xs text-[#6B7774]">
                    {draftPatientIds.length} paciente
                    {draftPatientIds.length === 1 ? "" : "s"}{" "}
                    seleccionado
                    {draftPatientIds.length === 1 ? "" : "s"}
                  </p>

                  {/* LISTADO DE PACIENTES */}
                  <div className="mt-3 space-y-2">
                    {pickerFilteredPatients.length === 0 ? (
                      <p className="py-6 text-center text-sm text-[#6B7774]">
                        No encontramos pacientes con ese
                        filtro.
                      </p>
                    ) : (
                      pickerFilteredPatients.map((patient) => {
                        const checked =
                          draftPatientIds.includes(patient.id);

                        return (
                          <label
                            key={patient.id}
                            className="flex cursor-pointer items-center gap-3 border border-[#DED9CD] p-3 transition hover:bg-[#F7F5EF]"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                togglePickerPatient(patient.id)
                              }
                              className="h-4 w-4 accent-[#263F3B]"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-[#263F3B]">
                                {patient.lastName},{" "}
                                {patient.firstName}
                              </p>

                              <p className="text-xs text-[#6B7774]">
                                DNI:{" "}
                                {patient.dni || "Sin registrar"}{" "}
                                — {patient.branchName}
                              </p>
                            </div>

                            {!patient.history && (
                              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#B56E6E]">
                                Sin historia
                              </span>
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="shrink-0 flex justify-end gap-3 border-t border-[#DED9CD] bg-white px-6 py-5">
              <button
                type="button"
                onClick={closePicker}
                className="border border-[#DED9CD] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#263F3B] transition hover:bg-[#F7F5EF]"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={savePickerSelection}
                className="bg-[#263F3B] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1D302D]"
              >
                Guardar selección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}