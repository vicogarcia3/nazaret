"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AppointmentStatusButtons({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const router = useRouter();

  async function updateStatus(status: "COMPLETED" | "CANCELED") {
    const res = await fetch(`/api/appointments/${appointmentId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      alert("No se pudo actualizar el turno.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => updateStatus("COMPLETED")}
        className="text-green-600 hover:text-green-800"
        title="Marcar como completado"
      >
        <Check className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => updateStatus("CANCELED")}
        className="text-[#D97A7A] hover:text-red-700"
        title="Cancelar turno"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}