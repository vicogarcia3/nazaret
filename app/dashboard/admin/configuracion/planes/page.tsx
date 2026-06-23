"use client";

import { useEffect, useState } from "react";

type Plan = {
  id: string;
  name: string;
  description: string;
  price: number | null;
  discount: number;
  active: boolean;
};

export default function PlanesPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    discount: "",
    active: true,
  });

  async function loadPlans() {
    const res = await fetch("/api/plans");
    const data = await res.json();
    setPlans(data);
  }

  useEffect(() => {
    loadPlans();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await fetch("/api/plans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    resetForm();
    loadPlans();
  }

  function startEdit(plan: Plan) {
    setEditingId(plan.id);

    setForm({
      name: plan.name,
      description: plan.description,
      price: plan.price?.toString() || "",
      discount: plan.discount.toString(),
      active: plan.active,
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();

    if (!editingId) return;

    const res = await fetch(`/api/plans/${editingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      alert("No se pudo guardar el plan");
      return;
    }

    resetForm();
    loadPlans();
  }

  async function handleDelete(id: string) {
    const confirmDelete = confirm("¿Seguro que querés eliminar este plan?");

    if (!confirmDelete) return;

    await fetch(`/api/plans/${id}`, {
      method: "DELETE",
    });

    loadPlans();
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      price: "",
      discount: "",
      active: true,
    });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Planes</h1>

      <form
        onSubmit={editingId ? handleUpdate : handleSubmit}
        className="rounded-xl bg-white p-6 shadow space-y-4"
      >
        <input
          className="w-full rounded border p-3"
          placeholder="Nombre del plan"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <textarea
          className="w-full rounded border p-3"
          placeholder="Descripción"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />

        <input
          type="number"
          className="w-full rounded border p-3"
          placeholder="Precio mensual"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />

        <input
          type="number"
          className="w-full rounded border p-3"
          placeholder="Descuento %"
          value={form.discount}
          onChange={(e) => setForm({ ...form, discount: e.target.value })}
          required
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Plan activo
        </label>

        <div className="flex gap-3">
          <button className="rounded bg-[#A2B38B] px-5 py-3 text-white hover:bg-[#8FA178]">
            {editingId ? "Guardar cambios" : "Crear plan"}
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
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">{plan.name}</h2>

            <p className="mt-2 text-gray-600">{plan.description}</p>

            <p className="mt-2">
              Precio mensual:{" "}
              {plan.price ? `$${plan.price}` : "Sin precio cargado"}
            </p>

            <p>Descuento: {plan.discount}%</p>

            <p className="mt-2 text-sm">
              Estado:{" "}
              <span className={plan.active ? "text-green-600" : "text-red-600"}>
                {plan.active ? "Activo" : "Inactivo"}
              </span>
            </p>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => startEdit(plan)}
                className="rounded bg-[#A2B38B] px-4 py-2 text-white hover:bg-[#8FA178]"
              >
                Editar
              </button>

              <button
                onClick={() => handleDelete(plan.id)}
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