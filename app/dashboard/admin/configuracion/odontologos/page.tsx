"use client";

import { useEffect, useState } from "react";

type Branch = {
  id: string;
  name: string;
  city: string;
  address: string;
};

type Doctor = {
  id: string;
  specialty: string | null;
  description: string | null;
  photo: string | null;
  active: boolean;
  user: {
    name: string;
    email: string;
  };
  branches: {
    branch: Branch;
  }[];
};

export default function OdontologosPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    specialty: "",
    description: "",
    photo: "",
    active: true,
    branchIds: [] as string[],
  });

  async function loadDoctors() {
    const res = await fetch("/api/doctors");
    const data = await res.json();
    setDoctors(data);
  }

  async function loadBranches() {
    const res = await fetch("/api/branches");
    const data = await res.json();
    setBranches(data);
  }

  useEffect(() => {
    loadDoctors();
    loadBranches();
  }, []);

  function toggleBranch(branchId: string) {
    const exists = form.branchIds.includes(branchId);

    setForm({
      ...form,
      branchIds: exists
        ? form.branchIds.filter((id) => id !== branchId)
        : [...form.branchIds, branchId],
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await fetch("/api/doctors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    resetForm();
    loadDoctors();
  }

  function startEdit(doctor: Doctor) {
    setEditingId(doctor.id);

    setForm({
      name: doctor.user.name,
      email: doctor.user.email,
      password: "",
      specialty: doctor.specialty || "",
      description: doctor.description || "",
      photo: doctor.photo || "",
      active: doctor.active,
      branchIds: doctor.branches.map((item) => item.branch.id),
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();

    if (!editingId) return;

    const res = await fetch(`/api/doctors/${editingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      alert("No se pudo guardar el odontólogo");
      return;
    }

    resetForm();
    loadDoctors();
  }

  async function handleDelete(id: string) {
    const confirmDelete = confirm("¿Seguro que querés eliminar este odontólogo?");

    if (!confirmDelete) return;

    const res = await fetch(`/api/doctors/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("No se pudo eliminar el odontólogo");
      return;
    }

    loadDoctors();
  }

  function resetForm() {
    setEditingId(null);

    setForm({
      name: "",
      email: "",
      password: "",
      specialty: "",
      description: "",
      photo: "",
      active: true,
      branchIds: [],
    });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Odontólogos</h1>

      <form
        onSubmit={editingId ? handleUpdate : handleSubmit}
        className="rounded-xl bg-white p-6 shadow space-y-4"
      >
        <input
          className="w-full rounded border p-3"
          placeholder="Nombre completo"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          type="email"
          className="w-full rounded border p-3"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        {!editingId && (
          <input
            type="password"
            className="w-full rounded border p-3"
            placeholder="Contraseña inicial"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        )}

        <input
          className="w-full rounded border p-3"
          placeholder="Especialidad"
          value={form.specialty}
          onChange={(e) => setForm({ ...form, specialty: e.target.value })}
        />

        <textarea
          className="w-full rounded border p-3"
          placeholder="Descripción"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <input
          type="file"
          accept="image/*"
          className="w-full rounded border p-3"
          onChange={async (e) => {
            const file = e.target.files?.[0];

            if (!file) return;

            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            setForm((prev) => ({
                ...prev,
                photo: data.url,
            }));
          }}
        />

        {form.photo && (
          <img
            src={form.photo}
            alt="Vista previa"
            className="h-32 w-32 rounded-full object-cover"
          />
        )}

        <div className="rounded border p-4">
          <p className="mb-3 font-semibold">Sucursales</p>

          <div className="grid gap-2">
            {branches.map((branch) => (
              <label key={branch.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.branchIds.includes(branch.id)}
                  onChange={() => toggleBranch(branch.id)}
                />
                <span>
                  {branch.name} — {branch.address}, {branch.city}
                </span>
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Especialista activo
        </label>

        <div className="flex gap-3">
          <button className="rounded bg-[#A2B38B] px-5 py-3 text-white hover:bg-[#8FA178]">
            {editingId ? "Guardar cambios" : "Crear especialista"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded bg-gray-300 px-5 py-3 text-black"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-4">
        {doctors.map((doctor) => (
          <div
            key={doctor.id}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-5">
              {doctor.photo ? (
                <img
                  src={doctor.photo}
                  alt={doctor.user.name}
                  className="h-24 w-24 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 text-2xl font-bold text-gray-500">
                  {doctor.user.name.charAt(0)}
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800">
                      {doctor.user.name}
                    </h2>

                    <p className="text-sm text-gray-500">
                      {doctor.user.email}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      doctor.active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {doctor.active ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <p>
                    <span className="font-medium text-gray-700">
                      Especialidad:
                    </span>{" "}
                    {doctor.specialty || "Sin especialidad"}
                  </p>

                  <p>
                    <span className="font-medium text-gray-700">
                      Sucursales:
                    </span>{" "}
                    {doctor.branches.length > 0
                      ? doctor.branches
                          .map((item) => item.branch.name)
                          .join(", ")
                      : "Sin sucursales"}
                  </p>

                  <p className="text-gray-600">
                    {doctor.description || "Sin descripción"}
                  </p>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => startEdit(doctor)}
                  className="rounded-lg bg-[#A2B38B] px-4 py-2 text-white transition hover:bg-[#8FA178]"
                >
                  Editar
                </button>

                <button
                  onClick={() => handleDelete(doctor.id)}
                  className="rounded-lg bg-[#D97A7A] px-4 py-2 text-white transition hover:bg-[#C96767]"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}