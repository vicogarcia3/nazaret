"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  paymentId: string;
};

export default function DeletePaymentButton({ paymentId }: Props) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("¿Seguro que querés eliminar este pago?")) return;

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
      className="text-[#D97A7A] transition hover:text-red-700"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}