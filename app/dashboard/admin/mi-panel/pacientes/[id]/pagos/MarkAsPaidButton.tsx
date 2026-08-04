"use client";

import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/ConfirmProvider";

export default function MarkAsPaidButton({
  paymentId,
}: {
  paymentId: string;
}) {
  const router = useRouter();
  const confirmDialog = useConfirm();

  async function handleClick() {
    const confirmed = await confirmDialog({
      title: "Registrar pago",
      description:
        "El pago quedará registrado como abonado.",
      confirmText: "Registrar",
    });

    if (!confirmed) return;

    const res = await fetch(`/api/payments/${paymentId}/pay`, {
      method: "PUT",
    });

    if (!res.ok) {
      toast.error("No se pudo actualizar el pago.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 bg-[#A2B38B] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-[#8FA178]"
    >
      <CheckCircle className="h-3.5 w-3.5" />
      Marcar pagado
    </button>
  );
}