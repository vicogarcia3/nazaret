"use client";

import { useRouter } from "next/navigation";

export default function BudgetStatusButtons({
  budgetId,
}: {
  budgetId: string;
}) {
  const router = useRouter();

  async function updateStatus(status: "ACCEPTED" | "REJECTED") {
    const res = await fetch(`/api/budgets/${budgetId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      alert("No se pudo actualizar el presupuesto.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-8 flex justify-end gap-3">
      <button
        type="button"
        onClick={() => updateStatus("ACCEPTED")}
        className="bg-[#263F3B] px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]"
      >
        Aceptado
      </button>

      <button
        type="button"
        onClick={() => updateStatus("REJECTED")}
        className="border border-[#D97A7A] px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#D97A7A] hover:bg-[#F8ECEC]"
      >
        Rechazado
      </button>
    </div>
  );
}