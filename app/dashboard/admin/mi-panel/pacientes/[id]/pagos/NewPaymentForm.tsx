"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
};

type Budget = {
  id: string;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  createdAt: Date | string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function getCurrentDate() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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

  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    concept: "",
    amount: "",
    dueDate: getCurrentDate(),
    branchId: defaultBranchId,
    budgetId: "",
  });

  const selectedBudget = useMemo(
    () =>
      budgets.find((budget) => budget.id === form.budgetId) || null,
    [budgets, form.budgetId]
  );

  const enteredAmount = Number(form.amount) || 0;

  const previewPaidAmount = selectedBudget
    ? selectedBudget.paidAmount + enteredAmount
    : 0;

  const previewRemainingAmount = selectedBudget
    ? Math.max(selectedBudget.remainingAmount - enteredAmount, 0)
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Ingresá un monto válido mayor a cero.");
      return;
    }

    if (selectedBudget && amount > selectedBudget.remainingAmount) {
      toast.error(
        `El monto no puede superar el saldo pendiente de ${formatCurrency(
          selectedBudget.remainingAmount
        )}.`
      );
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          concept: form.concept,
          amount,
          dueDate: form.dueDate,
          branchId: form.branchId,
          status: "PAID",
          budgetId: form.budgetId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "No se pudo registrar el pago."
        );
      }

      toast.success(
        data.message || "Pago registrado correctamente."
      );

      setForm({
        concept: "",
        amount: "",
        dueDate: getCurrentDate(),
        branchId: defaultBranchId,
        budgetId: "",
      });

      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo registrar el pago."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="border border-[#DED9CD] bg-white">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="new-payment-form"
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-[#F7F5EF]"
      >
        <div>
          <h2 className="font-[var(--font-cormorant)] text-xl font-medium">
            Registrar pago
          </h2>

          <p className="mt-1 text-xs text-[#6B7774]">
            Cargá un nuevo pago y asocialo a un presupuesto.
          </p>
        </div>

        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#A2B38B] transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        id="new-payment-form"
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <form
            onSubmit={handleSubmit}
            className="border-t border-[#DED9CD] p-6"
          >
            <div className="grid gap-2 md:grid-cols-2">
              <input
                className="border border-[#DED9CD] bg-white p-3 outline-none transition focus:border-[#263F3B]"
                placeholder="Concepto"
                value={form.concept}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    concept: e.target.value,
                  }))
                }
              />

              <input
                className="border border-[#DED9CD] bg-white p-3 outline-none transition focus:border-[#263F3B]"
                placeholder="Monto abonado"
                type="number"
                min="0.01"
                step="0.01"
                max={
                  selectedBudget
                    ? selectedBudget.remainingAmount
                    : undefined
                }
                value={form.amount}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    amount: e.target.value,
                  }))
                }
                required
              />

              <input
                className="border border-[#DED9CD] bg-white p-3 outline-none transition focus:border-[#263F3B]"
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    dueDate: e.target.value,
                  }))
                }
                required
              />

              <select
                className="border border-[#DED9CD] bg-white p-3 outline-none transition focus:border-[#263F3B]"
                value={form.branchId}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    branchId: e.target.value,
                  }))
                }
                required
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} — {branch.address}
                  </option>
                ))}
              </select>

              <select
                className="border border-[#DED9CD] bg-white p-3 outline-none transition focus:border-[#263F3B] md:col-span-2"
                value={form.budgetId}
                onChange={(e) => {
                  const budgetId = e.target.value;

                  setForm((current) => ({
                    ...current,
                    budgetId,
                    amount: "",
                  }));
                }}
              >
                <option value="">Sin presupuesto asociado</option>

                {budgets
                  .filter((budget) => budget.remainingAmount > 0)
                  .map((budget, index) => (
                    <option key={budget.id} value={budget.id}>
                      Presupuesto #{index + 1} — Saldo pendiente:{" "}
                      {formatCurrency(budget.remainingAmount)}
                    </option>
                  ))}
              </select>

              {selectedBudget && (
                <div className="rounded border border-[#DED9CD] bg-[#F7F5EF] p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                    Resumen del presupuesto
                  </p>

                  <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                    <div>
                      <p className="text-[#6B7774]">Total</p>

                      <p className="font-semibold">
                        {formatCurrency(selectedBudget.total)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[#6B7774]">
                        Abonado después de este pago
                      </p>

                      <p className="font-semibold text-green-700">
                        {formatCurrency(previewPaidAmount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[#6B7774]">
                        Saldo pendiente después de este pago
                      </p>

                      <p className="font-semibold text-amber-700">
                        {formatCurrency(previewRemainingAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-[#263F3B] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1D302D] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {submitting ? "Guardando" : "Guardar pago"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}