"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, ListChecks, Percent, Pencil, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

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
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    discount: "",
    active: true,
  });

  const activePlans = useMemo(
    () => plans.filter((plan) => plan.active).length,
    [plans]
  );

  const averageDiscount = useMemo(() => {
    if (plans.length === 0) return 0;

    const total = plans.reduce((acc, plan) => acc + Number(plan.discount), 0);
    return Math.round(total / plans.length);
  }, [plans]);

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

    const url = editingId ? `/api/plans/${editingId}` : "/api/plans";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      toast.error(
        editingId
          ? "No se pudo guardar el plan."
          : "No se pudo crear el plan."
      );
      return;
    }

    resetForm();
    await loadPlans();
  }

  function startEdit(plan: Plan) {
    setEditingId(plan.id);
    setOpen(true);

    setForm({
      name: plan.name,
      description: plan.description,
      price: plan.price?.toString() || "",
      discount: plan.discount.toString(),
      active: plan.active,
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Seguro que querés eliminar este plan?")) return;

    const res = await fetch(`/api/plans/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      toast.error("No se pudo eliminar el plan.");
      return;
    }

    await loadPlans();
  }

  function resetForm() {
    setEditingId(null);
    setOpen(false);

    setForm({
      name: "",
      description: "",
      price: "",
      discount: "",
      active: true,
    });
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <div className="space-y-10">
        <header className="flex items-start justify-between gap-6">
          <div>
            <h1 className="font-serif text-4xl font-medium">
              Planes
            </h1>

            <p className="mt-3 text-sm text-[#6B7774]">
              Administrá los planes de afiliación, descuentos y estado de cada
              beneficio.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (open) {
                resetForm();
              } else {
                setOpen(true);
              }
            }}
            className="bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1d302d]"
          >
            {open ? "Cerrar" : "+ Nuevo plan"}
          </button>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <article className="border border-[#DED9CD] bg-white p-6">
            <ListChecks className="mb-3 h-4 w-4 text-[#A2B38B]" />
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Total de planes
            </p>
            <p className="mt-2 text-2xl font-semibold">{plans.length}</p>
          </article>

          <article className="border border-[#DED9CD] bg-white p-6">
            <CheckCircle className="mb-3 h-4 w-4 text-[#A2B38B]" />
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Activos
            </p>
            <p className="mt-2 text-2xl font-semibold">{activePlans}</p>
          </article>

          <article className="border border-[#DED9CD] bg-white p-6">
            <Percent className="mb-3 h-4 w-4 text-[#A2B38B]" />
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Descuento promedio
            </p>
            <p className="mt-2 text-2xl font-semibold">{averageDiscount}%</p>
          </article>
        </section>

        {open && (
          <form
            onSubmit={handleSubmit}
            className="border border-[#DED9CD] bg-white p-8"
          >
            <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
              {editingId ? "Editar plan" : "Nuevo plan"}
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Nombre del plan
                </p>
                <input
                  className="w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Descripción
                </p>
                <textarea
                  className="min-h-[100px] w-full border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Precio mensual
                </p>
                <input
                  type="number"
                  className="w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Descuento %
                </p>
                <input
                  type="number"
                  className="w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                  value={form.discount}
                  onChange={(e) =>
                    setForm({ ...form, discount: e.target.value })
                  }
                  required
                />
              </div>

              <label className="flex items-center gap-3 text-sm md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                />
                Plan activo
              </label>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="border border-[#DED9CD] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] transition hover:bg-[#F7F5EF]"
                >
                  Cancelar
                </button>
              )}

              <button className="bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1d302d]">
                {editingId ? "Guardar cambios" : "Crear plan"}
              </button>
            </div>
          </form>
        )}

        <section className="grid gap-6">
          {plans.map((plan, index) => (
            <article
              key={plan.id}
              className="border border-[#DED9CD] bg-white p-8"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <span className="text-xs text-[#A2B38B]">#{index + 1}</span>

                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    onClick={() => startEdit(plan)}
                    className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] hover:underline"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(plan.id)}
                    className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D97A7A] hover:underline"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              </div>

              <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
                {plan.name}
              </h2>

              <p className="mt-3 text-sm leading-4 text-[#6B7774]">
                {plan.description}
              </p>

              <div className="mt-8 grid gap-3 text-sm md:grid-cols-3">
                <p>
                  <Wallet className="mb-2 h-4 w-4 text-[#A2B38B]" />
                  <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Precio mensual
                  </span>
                  <span className="mt-2 block text-[15px]">
                    {plan.price
                      ? `$${Number(plan.price).toLocaleString("es-AR")}`
                      : "Sin precio"}
                  </span>
                </p>

                <p>
                  <Percent className="mb-3 h-4 w-4 text-[#A2B38B]" />
                  <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Descuento
                  </span>
                  <span className="mt-2 block text-[15px]">
                    {plan.discount}%
                  </span>
                </p>

                <p>
                  <CheckCircle className="mb-3 h-4 w-4 text-[#A2B38B]" />
                  <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Estado
                  </span>

                  <span
                    className={`mt-2 inline-flex rounded px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                      plan.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {plan.active ? "Activo" : "Inactivo"}
                  </span>
                </p>
              </div>
            </article>
          ))}

          {plans.length === 0 && (
            <article className="border border-[#DED9CD] bg-white p-8">
              <p className="text-sm text-[#6B7774]">
                Todavía no hay planes cargados.
              </p>
            </article>
          )}
        </section>
      </div>
    </div>
  );
}