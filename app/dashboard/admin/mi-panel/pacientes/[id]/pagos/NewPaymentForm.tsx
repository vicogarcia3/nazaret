"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
};

type Budget = {
  id: string;
  total: any;
  status: string | null;
  createdAt: Date | string;
};

export default function NewPaymentForm({
  patientId,
  branches,
  defaultBranchId,
  budgets,
}: {
  patientId: string;
  branches: Branch[];
  defaultBranchId: string;
  budgets: Budget[];
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    concept: "",
    amount: "",
    dueDate: "",
    branchId: defaultBranchId,
    budgetId: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patientId,
        concept: form.concept,
        amount: Number(form.amount),
        dueDate: form.dueDate,
        branchId: form.branchId,
        status: "PENDING",
        budgetId: form.budgetId || null,
      }),
    });

    if (!res.ok) {
      alert("No se pudo registrar el pago.");
      return;
    }

    setForm({
      concept: "",
      amount: "",
      dueDate: "",
      branchId: defaultBranchId,
      budgetId: "",
    });

    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-[#DED9CD] bg-white p-6"
    >
      <h2 className="font-[var(--font-cormorant)] text-xl font-medium">
        Registrar pago
      </h2>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <input
          className="border border-[#DED9CD] bg-white p-3"
          placeholder="Concepto"
          value={form.concept}
          onChange={(e) => setForm({ ...form, concept: e.target.value })}
        />

        <input
          className="border border-[#DED9CD] bg-white p-3"
          placeholder="Monto"
          type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />

        <input
          className="border border-[#DED9CD] bg-white p-3"
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          required
        />

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

        <select
          className="border border-[#DED9CD] bg-white p-3 md:col-span-2"
          value={form.budgetId}
          onChange={(e) => setForm({ ...form, budgetId: e.target.value })}
        >
          <option value="">Sin presupuesto asociado</option>

          {budgets.map((budget, index) => (
            <option key={budget.id} value={budget.id}>
              Presupuesto #{index + 1} — $
              {Number(budget.total).toLocaleString("es-AR")}
            </option>
          ))}
        </select>

      </div>

      <div className="mt-6 flex justify-end">
        <button className="bg-[#263F3B] px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]">
          Guardar pago
        </button>
      </div>
    </form>
  );
}