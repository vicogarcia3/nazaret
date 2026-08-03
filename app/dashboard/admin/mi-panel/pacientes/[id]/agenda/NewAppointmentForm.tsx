"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Doctor = {
  id: string;
  name: string | null;
  user: {
    name: string | null;
  } | null;
  specialty: string | null;
};

type Branch = {
  id: string;
  name: string;
  address: string;
};

export default function NewAppointmentForm({
  patientId,
  doctors,
  branches,
  defaultBranchId,
}: {
  patientId: string;
  doctors: Doctor[];
  branches: Branch[];
  defaultBranchId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    date: "",
    time: "",
    doctorId: "",
    branchId: defaultBranchId,
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patientId,
        doctorId: form.doctorId,
        branchId: form.branchId,
        date: `${form.date}T${form.time}:00`,
        notes: form.notes,
      }),
    });

    if (!res.ok) {
      toast.error("No se pudo crear el turno.");
      return;
    }

    setForm({
      date: "",
      time: "",
      doctorId: "",
      branchId: defaultBranchId,
      notes: "",
    });

    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]"
      >
        {open ? "Cerrar" : "+ Nuevo turno"}
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="mt-2 border border-[#DED9CD] bg-white p-8"
        >
          <h2 className="font-[var(--font-cormorant)] text-xl font-medium">
            Nuevo turno
          </h2>

          <div className="mt-6 grid gap-2 md:grid-cols-2">
            <input
              type="date"
              className="border border-[#DED9CD] bg-white p-3"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />

            <input
              type="time"
              className="border border-[#DED9CD] bg-white p-3"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              required
            />

            <select
              className="border border-[#DED9CD] bg-white p-3"
              value={form.doctorId}
              onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              required
            >
              <option value="">Seleccionar odontólogo</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name || doctor.user?.name || "Odontólogo sin nombre"}
                </option>
              ))}
            </select>

            <select
              className="border border-[#DED9CD] bg-white p-3"
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              required
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} — {branch.address}
                </option>
              ))}
            </select>

            <textarea
              className="border border-[#DED9CD] bg-white p-3 md:col-span-2"
              placeholder="Concepto / notas"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="mt-5 flex justify-end">
            <button className="bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]">
              Guardar turno
            </button>
          </div>
        </form>
      )}
    </>
  );
}