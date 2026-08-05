"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/ConfirmProvider";

type Props = {
  paymentId: string;
};

export default function DeletePaymentButton({ paymentId }: Props) {
  const router = useRouter();
  const confirmDialog = useConfirm();


  async function handleDelete() {
    const confirmed = await confirmDialog({
      title: "Eliminar pago",
      description:
        "El pago será eliminado definitivamente. Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
    });

    if (!confirmed) return;

    const res = await fetch(`/api/payments/${paymentId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error("No se pudo eliminar el pago.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      title="Eliminar pago"
      className="text-red-400 transition hover:text-red-700"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}