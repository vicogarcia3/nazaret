"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  budgetId: string;
};

export default function RejectBudgetButton({ budgetId }: Props) {
  const router = useRouter();

  async function reject() {
    await fetch(`/api/budgets/${budgetId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "REJECTED",
      }),
    });

    router.refresh();
  }

  return (
    <button
      onClick={reject}
      title="Rechazar presupuesto"
      className="text-[#D97A7A] hover:text-red-700"
    >
      <X className="h-4 w-4" />
    </button>
  );
}