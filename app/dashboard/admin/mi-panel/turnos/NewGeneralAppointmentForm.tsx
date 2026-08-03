"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
};

type Doctor = {
  id: string;
  user: {
    name: string | null;
  };
  branches: {
    branchId: string;
  }[];
};

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  dni: string | null;
  branchId: string;
};

export default function NewGeneralAppointmentForm({
  selectedBranchId,
  branches,
  doctors,
  patients,
  onCreated,
}: {
  selectedBranchId: string;
  branches: Branch[];
  doctors: Doctor[];
  patients: Patient[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    branchId: selectedBranchId,
    date: "",
    time: "",
    notes: "",
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      branchId: selectedBranchId,
      patientId: "",
      doctorId: "",
      time: "",
    }));

    setPatientSearch("");
    setAvailableTimes([]);
  }, [selectedBranchId]);

  const filteredPatients = useMemo(() => {
    const value = patientSearch.toLowerCase().trim();

    return patients.filter((patient) => {
      const fullText = `${patient.firstName} ${patient.lastName} ${
        patient.dni || ""
      }`.toLowerCase();

      return patient.branchId === form.branchId && fullText.includes(value);
    });
  }, [patients, patientSearch, form.branchId]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) =>
      doctor.branches?.some((branch) => branch.branchId === form.branchId)
    );
  }, [doctors, form.branchId]);

  useEffect(() => {
    async function loadAvailableTimes() {
      if (!form.branchId || !form.doctorId || !form.date) {
        setAvailableTimes([]);
        return;
      }

      const params = new URLSearchParams({
        branchId: form.branchId,
        doctorId: form.doctorId,
        date: form.date,
      });

      const res = await fetch(
        `/api/appointments/available-times?${params.toString()}`
      );

      const data = await res.json();

      if (Array.isArray(data)) {
        setAvailableTimes(data);
      } else if (Array.isArray(data.times)) {
        setAvailableTimes(data.times);
      } else {
        setAvailableTimes([]);
      }
    }

    loadAvailableTimes();
  }, [form.branchId, form.doctorId, form.date]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      toast.error("Ocurrió un error al crear el turno.");
      return;
    }

    setForm({
      patientId: "",
      doctorId: "",
      branchId: selectedBranchId,
      date: "",
      time: "",
      notes: "",
    });

    setPatientSearch("");
    setAvailableTimes([]);
    setOpen(false);
    onCreated();
  }

  return (
    <section className="border border-[#DED9CD] bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
          Agendar turno
        </h2>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1d302d]"
        >
          {open ? "Cerrar" : "+ Agendar turno"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Sucursal
            </p>

            <select
              className="w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
              value={form.branchId}
              onChange={(e) =>
                setForm({
                  ...form,
                  branchId: e.target.value,
                  patientId: "",
                  doctorId: "",
                  time: "",
                })
              }
              required
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} — {branch.address}, {branch.city}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Paciente
            </p>

            <div className="flex items-center border border-[#DED9CD] bg-white px-3">
              <Search className="mr-2 h-4 w-4 text-[#A2B38B]" />

              <input
                className="w-full p-2 outline-none"
                placeholder="Nombre, apellido o DNI"
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setForm({ ...form, patientId: "" });
                }}
              />
            </div>

            {patientSearch.trim() !== "" && !form.patientId && (
              <div className="mt-2 border border-[#DED9CD] bg-white">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, patientId: patient.id });
                        setPatientSearch(
                          `${patient.lastName}, ${patient.firstName} — DNI ${
                            patient.dni || "-"
                          }`
                        );
                      }}
                      className="block w-full px-4 py-3 text-left text-sm transition hover:bg-[#F7F5EF]"
                    >
                      <span className="font-medium">
                        {patient.lastName}, {patient.firstName}
                      </span>
                      <span className="ml-2 text-[#6B7774]">
                        DNI {patient.dni || "-"}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-3 text-sm text-[#6B7774]">
                    No se encontraron pacientes para esta sucursal.
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Especialista
            </p>

            <select
              className="w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
              value={form.doctorId}
              onChange={(e) =>
                setForm({ ...form, doctorId: e.target.value, time: "" })
              }
              required
            >
              <option value="">Seleccionar especialista</option>

              {filteredDoctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.user?.name || "Especialista sin nombre"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Día
            </p>

            <input
              type="date"
              className="w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value, time: "" })
              }
              required
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Horario disponible
            </p>

            <select
              className="w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              required
              disabled={!form.doctorId || !form.date}
            >
              <option value="">
                {!form.doctorId || !form.date
                  ? "Seleccioná especialista y día"
                  : availableTimes.length === 0
                  ? "No hay horarios disponibles"
                  : "Seleccionar horario"}
              </option>

              {availableTimes.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Concepto
            </p>

            <input
              className="w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ej: limpieza, control, consulta"
            />
          </div>

          <div className="flex justify-end md:col-span-2">
            <button className="bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1d302d]">
              Guardar turno
            </button>
          </div>
        </form>
      )}
    </section>
  );
}