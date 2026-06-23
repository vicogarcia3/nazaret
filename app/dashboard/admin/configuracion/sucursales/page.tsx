"use client";

import { useEffect, useState } from "react";

type Branch = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
};

export default function SucursalesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    city: "",
    address: "",
    phone: "",
  });

  async function loadBranches() {
    const res = await fetch("/api/branches");
    const data = await res.json();
    setBranches(data);
  }

  useEffect(() => {
    loadBranches();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await fetch("/api/branches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    setForm({ name: "", city: "", address: "", phone: "" });
    loadBranches();
  }

  async function handleDelete(id: string) {
    const confirmDelete = confirm("¿Seguro que querés eliminar esta sucursal?");

    if (!confirmDelete) return;

    await fetch(`/api/branches/${id}`, {
      method: "DELETE",
    });

    loadBranches();
  }

  function startEdit(branch: Branch) {
    setEditingId(branch.id);
    setForm({
      name: branch.name,
      city: branch.city,
      address: branch.address,
      phone: branch.phone || "",
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();

    if (!editingId) return;

    const res = await fetch(`/api/branches/${editingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("Error al editar:", error);
      alert("No se pudo guardar la sucursal");
      return;
    }

    setEditingId(null);
    setForm({
      name: "",
      city: "",
      address: "",
      phone: "",
    });

    await loadBranches();
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ name: "", city: "", address: "", phone: "" });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Sucursales</h1>

      <form
        onSubmit={editingId ? handleUpdate : handleSubmit}
        className="rounded-xl bg-white p-6 shadow space-y-4"
      >
        <input
          className="w-full rounded border p-3"
          placeholder="Nombre"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          className="w-full rounded border p-3"
          placeholder="Ciudad"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />

        <input
          className="w-full rounded border p-3"
          placeholder="Dirección"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />

        <input
          className="w-full rounded border p-3"
          placeholder="Teléfono"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <div className="flex gap-3">
          <button className="rounded bg-[#A2B38B] hover:bg-[#8FA178] px-4 py-2 text-white">
            {editingId ? "Guardar cambios" : "Crear sucursal"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded bg-gray-300 px-5 py-3 text-black"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-4">
        {branches.map((branch) => (
          <div key={branch.id} className="rounded-xl border bg-white p-6">
            <h2 className="text-2xl font-bold">{branch.name}</h2>

            <p>{branch.city}</p>
            <p>{branch.address}</p>
            <p>{branch.phone}</p>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => startEdit(branch)}
                className="rounded bg-[#A2B38B] hover:bg-[#8FA178] px-4 py-2 text-white"
              >
                Editar
              </button>

              <button
                onClick={() => handleDelete(branch.id)}
                className="rounded bg-[#D97A7A] px-4 py-2 text-white hover:bg-[#C96767]"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}