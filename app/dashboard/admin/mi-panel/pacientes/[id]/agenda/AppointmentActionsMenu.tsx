"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Check, X, Trash2 } from "lucide-react";

type Props = {
  appointmentId: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELED";
};

export default function AppointmentActionsMenu({
  appointmentId,
  status,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function updateStatus(newStatus: "COMPLETED" | "CANCELED") {
    await fetch(`/api/appointments/${appointmentId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    setOpen(false);
    router.refresh();
  }

  async function deleteAppointment() {
    if (!confirm("¿Seguro que querés eliminar este turno?")) return;

    await fetch(`/api/appointments/${appointmentId}`, {
      method: "DELETE",
    });

    setOpen(false);
    router.refresh();
  }

  const canChangeStatus = status === "PENDING" || status === "CONFIRMED";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-[#6B7774] hover:text-[#263F3B]"
        title="Acciones"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-36 border border-[#DED9CD] bg-white shadow-sm">
          {canChangeStatus && (
            <>
              <button
                type="button"
                onClick={() => updateStatus("COMPLETED")}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[#F7F5EF]"
              >
                <Check className="h-3.5 w-3.5 text-green-600" />
                Completar
              </button>

              <button
                type="button"
                onClick={() => updateStatus("CANCELED")}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[#F7F5EF]"
              >
                <X className="h-3.5 w-3.5 text-[#D97A7A]" />
                Cancelar
              </button>
            </>
          )}

          <button
            type="button"
            onClick={deleteAppointment}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#D97A7A] hover:bg-[#F8ECEC]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}