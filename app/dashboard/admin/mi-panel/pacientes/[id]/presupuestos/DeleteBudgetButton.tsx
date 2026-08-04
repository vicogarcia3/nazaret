"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ui/ConfirmProvider";

type Props = {
  budgetId: string;
};

export default function DeleteBudgetButton({ budgetId }: Props) {
  const router = useRouter();
  const confirmDialog = useConfirm();

  async function handleDelete() {
    const confirmed = await confirmDialog({
      title: "Eliminar presupuesto",
      description:
        "El presupuesto será eliminado definitivamente. Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
    });

    if (!confirmed) return;

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