"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

type Doctor = {
  id: string;
  user: {
    name: string | null;
  };
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

  const [doctorId, setDoctorId] = useState("");
  const [items, setItems] = useState<Item[]>([
    { serviceName: "", unitPrice: "" },
  ]);

  const subtotal = items.reduce(
    (acc, item) => acc + Number(item.unitPrice || 0),
    0
  );

  const discountAmount = subtotal * (discountPercent / 100);
  const total = subtotal - discountAmount;
  const [open, setOpen] = useState(false);

  function updateItem(index: number, field: keyof Item, value: string) {
    const copy = [...items];
    copy[index][field] = value;
    setItems(copy);
  }

  function addItem() {
    setItems([...items, { serviceName: "", unitPrice: "" }]);
  }

  function removeItem(index: number) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patientId,
        doctorId,
        items,
      }),
    });

    if (!res.ok) {
      alert("No se pudo crear el presupuesto.");
      return;
    }

    setDoctorId("");
    setItems([{ serviceName: "", unitPrice: "" }]);
    router.refresh();
  }

  return (
  <>
    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1d302d]"
      >
        {open ? "Cerrar" : "+ Crear presupuesto"}
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

        <select
          className="mt-6 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          required
        >
          <option value="">Seleccionar odontólogo</option>

          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.user.name || "Odontólogo sin nombre"}
            </option>
          ))}
        </select>

        <div className="mt-2 space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid gap-2 md:grid-cols-[1fr_180px_40px]"
            >
              <input
                className="border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                placeholder="Tratamiento o concepto"
                value={item.serviceName}
                onChange={(e) =>
                  updateItem(index, "serviceName", e.target.value)
                }
                required
              />

              <input
                className="border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                placeholder="Precio"
                type="number"
                value={item.unitPrice}
                onChange={(e) =>
                  updateItem(index, "unitPrice", e.target.value)
                }
                required
              />

              <button
                type="button"
                onClick={() => removeItem(index)}
                className="flex items-center justify-center text-[#D97A7A] hover:text-red-700"
                title="Eliminar tratamiento"
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
              <span>${subtotal.toLocaleString("es-AR")}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                Descuento ({discountPercent}%)
              </span>
              <span>-${discountAmount.toLocaleString("es-AR")}</span>
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
          <button className="bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1d302d]">
            Crear presupuesto
          </button>
        </div>
      </form>
    )}
  </>
);
}