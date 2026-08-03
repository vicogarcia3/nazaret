"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type Doctor = {
  id: string;
  name: string | null;
  user: {
    name: string;
  } | null;
};

type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
};

type Availability = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  doctor: {
    name: string | null;
    user: {
      name: string;
    } | null;
  };
  branch: Branch;
};

export default function DisponibilidadPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);

  const [form, setForm] = useState({
    doctorId: "",
    branchId: "",
    date: "",
    startTime: "09:00",
    endTime: "13:00",
  });

  async function loadData() {
    const [doctorsRes, branchesRes, availabilityRes] = await Promise.all([
      fetch("/api/doctors"),
      fetch("/api/branches"),
      fetch("/api/doctor-availability"),
    ]);

    setDoctors(await doctorsRes.json());
    setBranches(await branchesRes.json());
    setAvailabilities(await availabilityRes.json());
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/doctor-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      toast.error("No se pudo cargar el día.");
      return;
    }

    toast.success("Día cargado correctamente.");

    setForm({
      doctorId: "",
      branchId: "",
      date: "",
      startTime: "09:00",
      endTime: "13:00",
    });

    loadData();
  }

  async function deleteAvailability(id: string) {
  if (!confirm("¿Eliminar este horario?")) return;

  const res = await fetch(`/api/doctor-availability/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    toast.error("No se pudo eliminar el horario.");
    return;
  }

  loadData();
}

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Horarios</h1>
        <p className="mt-2 text-gray-500">
          Cargá los días y horarios en los que la odontóloga atienda en otra sucursal.
          La odontóloga no estará disponible esos días en la sucursal principal.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow">
        <select
          className="w-full rounded border p-3"
          value={form.doctorId}
          onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
          required
        >
          <option value="">Seleccionar odontóloga</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name || doctor.user?.name || "Especialista"}
            </option>
          ))}
        </select>

        <select
          className="w-full rounded border p-3"
          value={form.branchId}
          onChange={(e) => setForm({ ...form, branchId: e.target.value })}
          required
        >
          <option value="">Seleccionar sucursal</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} — {branch.address}, {branch.city}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="w-full rounded border p-3"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />

        <div className="grid gap-4 md:grid-cols-2">
          <input
            type="time"
            className="w-full rounded border p-3"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            required
          />

          <input
            type="time"
            className="w-full rounded border p-3"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            required
          />
        </div>

        <button className="rounded bg-[#A2B38B] px-5 py-3 text-white hover:bg-[#8FA178]">
          Cargar horario
        </button>
      </form>

      <div className="grid gap-4">
        {availabilities.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <p className="text-lg font-bold">
              {item.doctor.name ||
                item.doctor.user?.name ||
                "Especialista"}
            </p>

            <p className="mt-2 text-gray-600">
                📍 {item.branch.name} — {item.branch.address}, {item.branch.city}
            </p>

            <p className="mt-2 text-gray-600">
                📅 {new Date(item.date).toLocaleDateString("es-AR")}
            </p>

            <p className="mt-2 text-gray-600">
                🕘 {item.startTime} - {item.endTime}
            </p>

            <button
              type="button"
              onClick={() => deleteAvailability(item.id)}
              className="mt-4 rounded bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
            >
                Eliminar horario
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}