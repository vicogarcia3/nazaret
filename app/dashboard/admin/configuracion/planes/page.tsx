"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Eye,
  EyeOff,
  ListChecks,
  Percent,
  Pencil,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/ConfirmProvider";

type Plan = {
  id: string;
  name: string;
  description: string;
  benefits: string | null;
  conditions: string | null;
  price: number | null;
  discount: number;
  visible: boolean;
};

export default function PlanesPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const confirmDialog = useConfirm();

  const [form, setForm] = useState({
    name: "",
    description: "",
    benefits: "",
    conditions: "",
    price: "",
    discount: "",
    visible: false,
  });

  const visiblePlans = useMemo(
    () =>
      plans.filter(
        (plan) => plan.visible
      ).length,
    [plans]
  );

  const averageDiscount = useMemo(() => {
    if (plans.length === 0) {
      return 0;
    }

    const total = plans.reduce(
      (acc, plan) =>
        acc + Number(plan.discount),
      0
    );

    return Math.round(
      total / plans.length
    );
  }, [plans]);

  async function loadPlans() {
    try {
      const res = await fetch(
        "/api/plans"
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(
          "No se pudieron cargar los planes."
        );
        return;
      }

      setPlans(data);
    } catch (error) {
      console.error(
        "Error cargando planes:",
        error
      );

      toast.error(
        "No se pudieron cargar los planes."
      );
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const url = editingId
      ? `/api/plans/${editingId}`
      : "/api/plans";

    const method = editingId
      ? "PUT"
      : "POST";

    try {
      const res = await fetch(url, {
        method,

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          name: form.name,
          description:
            form.description,
          benefits:
            form.benefits,
          conditions:
            form.conditions,
          price:
            form.price,
          discount:
            form.discount,
          visible:
            form.visible,
        }),
      });

      const data =
        await res.json();

      if (!res.ok) {
        toast.error(
          data.error ||
            (editingId
              ? "No se pudo guardar el plan."
              : "No se pudo crear el plan.")
        );

        return;
      }

      toast.success(
        editingId
          ? "Plan actualizado correctamente."
          : "Plan creado correctamente."
      );

      resetForm();
      await loadPlans();
    } catch (error) {
      console.error(
        "Error guardando plan:",
        error
      );

      toast.error(
        editingId
          ? "No se pudo guardar el plan."
          : "No se pudo crear el plan."
      );
    }
  }

  function startEdit(
    plan: Plan
  ) {
    setEditingId(plan.id);
    setOpen(true);

    setForm({
      name:
        plan.name,

      description:
        plan.description,

      benefits:
        plan.benefits || "",

      conditions:
        plan.conditions || "",

      price:
        plan.price?.toString() ||
        "",

      discount:
        plan.discount.toString(),

      visible:
        plan.visible,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(
    id: string
  ) {
    const confirmed =
      await confirmDialog({
        title: "Eliminar plan",

        description:
          "El plan será eliminado definitivamente. Esta acción no se puede deshacer.",

        confirmText:
          "Eliminar",
      });

    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(
        `/api/plans/${id}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        toast.error(
          data.error ||
            "No se pudo eliminar el plan."
        );

        return;
      }

      await loadPlans();

      toast.success(
        "Plan eliminado correctamente."
      );
    } catch (error) {
      console.error(error);

      toast.error(
        "No se pudo eliminar el plan."
      );
    }
  }

  function resetForm() {
    setEditingId(null);
    setOpen(false);

    setForm({
      name: "",
      description: "",
      benefits: "",
      conditions: "",
      price: "",
      discount: "",
      visible: false,
    });
  }

  function benefitsList(
    value: string | null
  ) {
    if (!value) {
      return [];
    }

    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
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
              Administrá los planes de afiliación que pueden mostrarse y contratarse desde el sitio.
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
            {open
              ? "Cerrar"
              : "+ Nuevo plan"}
          </button>
        </header>

        {/* RESUMEN */}

        <section className="grid gap-6 md:grid-cols-3">
          <article className="border border-[#DED9CD] bg-white p-6">
            <ListChecks className="mb-3 h-4 w-4 text-[#A2B38B]" />

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Total de planes
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {plans.length}
            </p>
          </article>

          <article className="border border-[#DED9CD] bg-white p-6">
            <Eye className="mb-3 h-4 w-4 text-[#A2B38B]" />

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Visibles en el sitio
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {visiblePlans}
            </p>
          </article>

          <article className="border border-[#DED9CD] bg-white p-6">
            <Percent className="mb-3 h-4 w-4 text-[#A2B38B]" />

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Descuento promedio
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {averageDiscount}%
            </p>
          </article>
        </section>

        {/* FORMULARIO */}

        {open && (
          <form
            onSubmit={handleSubmit}
            className="border border-[#DED9CD] bg-white p-8"
          >
            <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
              {editingId
                ? "Editar plan"
                : "Nuevo plan"}
            </h2>

            <p className="mt-2 text-sm text-[#6B7774]">
              La información cargada acá será utilizada para presentar el plan en la página pública.
            </p>

            <div className="mt-7 grid gap-6 md:grid-cols-2">
              {/* NOMBRE */}

              <div className="md:col-span-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Nombre del plan
                </p>

                <input
                  className="w-full border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name:
                        e.target.value,
                    })
                  }
                  required
                />
              </div>

              {/* DESCRIPCIÓN */}

              <div className="md:col-span-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Descripción
                </p>

                <textarea
                  className="min-h-[90px] w-full resize-y border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
                  value={
                    form.description
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target.value,
                    })
                  }
                  required
                />
              </div>

              {/* BENEFICIOS */}

              <div className="md:col-span-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Beneficios
                </p>

                <p className="mb-3 text-xs text-[#6B7774]">
                  Escribí un beneficio por línea.
                </p>

                <textarea
                  className="min-h-[130px] w-full resize-y border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
                  placeholder={
                    "Consulta odontológica incluida\n20% de descuento en prótesis\nControl semestral sin cargo"
                  }
                  value={
                    form.benefits
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      benefits:
                        e.target.value,
                    })
                  }
                />
              </div>

              {/* CONDICIONES */}

              <div className="md:col-span-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Condiciones
                </p>

                <textarea
                  className="min-h-[110px] w-full resize-y border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
                  placeholder="Condiciones, alcance, exclusiones o aclaraciones del plan."
                  value={
                    form.conditions
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      conditions:
                        e.target.value,
                    })
                  }
                />
              </div>

              {/* PRECIO */}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Precio mensual
                </p>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
                  value={
                    form.price
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price:
                        e.target.value,
                    })
                  }
                />
              </div>

              {/* DESCUENTO */}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Descuento %
                </p>

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
                  value={
                    form.discount
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discount:
                        e.target.value,
                    })
                  }
                  required
                />
              </div>

              {/* VISIBLE */}

              <label className="flex items-start gap-3 border-t border-[#DED9CD] pt-6 md:col-span-2">
                <input
                  type="checkbox"
                  checked={
                    form.visible
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      visible:
                        e.target.checked,
                    })
                  }
                  className="mt-0.5 h-4 w-4 accent-[#6F855F]"
                />

                <div>
                  <p className="text-sm font-medium text-[#263F3B]">
                    Visible en el sitio
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#6B7774]">
                    Si está visible, el plan se considera disponible y podrá mostrarse para afiliación.
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={
                    resetForm
                  }
                  className="border border-[#DED9CD] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] transition hover:bg-[#F7F5EF]"
                >
                  Cancelar
                </button>
              )}

              <button
                type="submit"
                className="bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1d302d]"
              >
                {editingId
                  ? "Guardar cambios"
                  : "Crear plan"}
              </button>
            </div>
          </form>
        )}

        {/* PLANES EXISTENTES */}

        <section className="grid gap-6">
          {plans.map(
            (plan, index) => {
              const benefits =
                benefitsList(
                  plan.benefits
                );

              return (
                <article
                  key={plan.id}
                  className="border border-[#DED9CD] bg-white p-8"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <span className="text-xs text-[#A2B38B]">
                      #{index + 1}
                    </span>

                    <div className="flex items-center gap-5">
                      <button
                        type="button"
                        onClick={() =>
                          startEdit(
                            plan
                          )
                        }
                        className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] hover:underline"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            plan.id
                          )
                        }
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

                  <p className="mt-3 text-sm leading-6 text-[#6B7774]">
                    {plan.description}
                  </p>

                  {(benefits.length >
                    0 ||
                    plan.conditions) && (
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                      {benefits.length >
                        0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                            Beneficios
                          </p>

                          <ul className="mt-3 space-y-2 text-sm text-[#263F3B]">
                            {benefits.map(
                              (
                                benefit,
                                benefitIndex
                              ) => (
                                <li
                                  key={
                                    benefitIndex
                                  }
                                  className="flex gap-2"
                                >
                                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#A2B38B]" />

                                  <span>
                                    {
                                      benefit
                                    }
                                  </span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                      {plan.conditions && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                            Condiciones
                          </p>

                          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#6B7774]">
                            {
                              plan.conditions
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-8 grid gap-5 border-t border-[#DED9CD] pt-6 text-sm md:grid-cols-3">
                    <div>
                      <Wallet className="mb-2 h-4 w-4 text-[#A2B38B]" />

                      <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                        Precio mensual
                      </span>

                      <span className="mt-2 block text-[15px]">
                        {plan.price !==
                        null
                          ? `$${Number(
                              plan.price
                            ).toLocaleString(
                              "es-AR"
                            )}`
                          : "Sin precio"}
                      </span>
                    </div>

                    <div>
                      <Percent className="mb-2 h-4 w-4 text-[#A2B38B]" />

                      <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                        Descuento
                      </span>

                      <span className="mt-2 block text-[15px]">
                        {
                          plan.discount
                        }
                        %
                      </span>
                    </div>

                    <div>
                      {plan.visible ? (
                        <Eye className="mb-2 h-4 w-4 text-[#A2B38B]" />
                      ) : (
                        <EyeOff className="mb-2 h-4 w-4 text-[#A2B38B]" />
                      )}

                      <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                        Visibilidad
                      </span>

                      <span
                        className={`mt-2 inline-flex rounded px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                          plan.visible
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {plan.visible
                          ? "Visible"
                          : "No visible"}
                      </span>
                    </div>
                  </div>
                </article>
              );
            }
          )}

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