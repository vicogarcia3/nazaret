"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  budgetId: string;
};

export default function DeleteBudgetButton({ budgetId }: Props) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("¿Eliminar este presupuesto?")) return;

    await fetch(`/api/budgets/${budgetId}`, {
      method: "DELETE",
    });

    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      title="Eliminar presupuesto"
      className="text-[#D97A7A] hover:text-red-700"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}