"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  budgetId: string;
};

export default function AcceptBudgetButton({ budgetId }: Props) {
  const router = useRouter();

  async function accept() {
    await fetch(`/api/budgets/${budgetId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "ACCEPTED",
      }),
    });

    router.refresh();
  }

  return (
    <button
      onClick={accept}
      title="Aceptar presupuesto"
      className="text-green-600 hover:text-green-800"
    >
      <Check className="h-4 w-4" />
    </button>
  );
}