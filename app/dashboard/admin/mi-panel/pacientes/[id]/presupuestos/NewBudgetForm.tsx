"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Doctor = {
  id: string;
  name: string | null;
  specialty?: string | null;
  user: {
    name: string | null;
  } | null;
};

type Item = {
  serviceName: string;
  unitPrice: string;
};

export default function NewBudgetForm({
  patientId,
  doctors,
  discountPercent,
}: {
  patientId: string;
  doctors: Doctor[];
  discountPercent: number;
}) {
  const router = useRouter();

  const [doctorIds, setDoctorIds] = useState<string[]>([]);
  const [items, setItems] = useState<Item[]>([
    {
      serviceName: "",
      unitPrice: "",
    },
  ]);

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const subtotal = items.reduce(
    (accumulator, item) =>
      accumulator + Number(item.unitPrice || 0),
    0
  );

  const discountAmount =
    subtotal * (discountPercent / 100);

  const total = subtotal - discountAmount;

  function updateItem(
    index: number,
    field: keyof Item,
    value: string
  ) {
    setItems((currentItems) =>
      currentItems.map((item, currentIndex) =>
        currentIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function addItem() {
    setItems((currentItems) => [
      ...currentItems,
      {
        serviceName: "",
        unitPrice: "",
      },
    ]);
  }

  function removeItem(index: number) {
    if (items.length === 1) {
      return;
    }

    setItems((currentItems) =>
      currentItems.filter(
        (_, currentIndex) => currentIndex !== index
      )
    );
  }

  function toggleDoctor(doctorId: string) {
    setDoctorIds((currentDoctorIds) =>
      currentDoctorIds.includes(doctorId)
        ? currentDoctorIds.filter(
            (currentId) => currentId !== doctorId
          )
        : [...currentDoctorIds, doctorId]
    );
  }

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (doctorIds.length === 0) {
      toast.error(
        "Seleccioná al menos un especialista."
      );
      return;
    }

    const invalidItem = items.some(
      (item) =>
        !item.serviceName.trim() ||
        !Number.isFinite(Number(item.unitPrice)) ||
        Number(item.unitPrice) <= 0
    );

    if (invalidItem) {
      toast.error(
        "Completá todos los tratamientos con un precio válido."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          doctorIds,
          items: items.map((item) => ({
            serviceName: item.serviceName.trim(),
            unitPrice: Number(item.unitPrice),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo crear el presupuesto."
        );
      }

      toast.success(
        "Presupuesto creado correctamente."
      );

      setDoctorIds([]);
      setItems([
        {
          serviceName: "",
          unitPrice: "",
        },
      ]);
      setOpen(false);

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo crear el presupuesto."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() =>
            setOpen((current) => !current)
          }
          className="bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1d302d]"
        >
          {open
            ? "Cerrar"
            : "+ Crear presupuesto"}
        </button>
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 border border-[#DED9CD] bg-white p-8"
        >
          <Plus className="mb-4 h-5 w-5 text-[#A2B38B]" />

          <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
            Crear presupuesto
          </h2>

          <div className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
              Especialistas
            </p>

            <p className="mt-1 text-sm text-[#6B7774]">
              Seleccioná uno o más profesionales
              vinculados al presupuesto.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {doctors.map((doctor) => {
                const selected =
                  doctorIds.includes(doctor.id);

                const doctorName =
                  doctor.name ||
                  doctor.user?.name ||
                  "Especialista sin nombre";

                return (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() =>
                      toggleDoctor(doctor.id)
                    }
                    className={`flex items-center justify-between gap-4 border p-4 text-left transition ${
                      selected
                        ? "border-[#263F3B] bg-[#F0F2EA]"
                        : "border-[#DED9CD] bg-white hover:border-[#A2B38B]"
                    }`}
                  >
                    <span>
                      <span className="block font-medium text-[#263F3B]">
                        {doctorName}
                      </span>

                      {doctor.specialty && (
                        <span className="mt-1 block text-sm text-[#6B7774]">
                          {doctor.specialty}
                        </span>
                      )}
                    </span>

                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
                        selected
                          ? "border-[#263F3B] bg-[#263F3B] text-white"
                          : "border-[#A2B38B] text-transparent"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                  </button>
                );
              })}
            </div>

            {doctors.length === 0 && (
              <p className="mt-3 text-sm text-[#6B7774]">
                No hay especialistas disponibles.
              </p>
            )}
          </div>

          <div className="mt-6 space-y-2">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid gap-2 md:grid-cols-[1fr_180px_40px]"
              >
                <input
                  className="border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                  placeholder="Tratamiento o concepto"
                  value={item.serviceName}
                  onChange={(event) =>
                    updateItem(
                      index,
                      "serviceName",
                      event.target.value
                    )
                  }
                  required
                />

                <input
                  className="border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                  placeholder="Precio"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(event) =>
                    updateItem(
                      index,
                      "unitPrice",
                      event.target.value
                    )
                  }
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    removeItem(index)
                  }
                  className="flex items-center justify-center text-red-400 hover:text-red-700"
                  title="Eliminar tratamiento"
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-5 border border-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] transition hover:bg-[#263F3B] hover:text-white"
          >
            Agregar tratamiento
          </button>

          <div className="mt-8 border-t border-[#DED9CD] pt-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Subtotal
                </span>

                <span>
                  $
                  {subtotal.toLocaleString("es-AR")}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Descuento ({discountPercent}%)
                </span>

                <span>
                  -$
                  {discountAmount.toLocaleString(
                    "es-AR"
                  )}
                </span>
              </div>

              <div className="flex justify-between border-t border-[#DED9CD] pt-4">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#263F3B]">
                  Total
                </span>

                <span className="text-base font-semibold">
                  ${total.toLocaleString("es-AR")}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={
                submitting ||
                doctorIds.length === 0
              }
              className="inline-flex items-center gap-2 bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1d302d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Creando..."
                : "Crear presupuesto"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}