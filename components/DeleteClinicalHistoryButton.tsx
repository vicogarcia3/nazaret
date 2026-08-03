"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  patientId: string;
};

export default function DeleteClinicalHistoryButton({
  patientId,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "¿Eliminar la historia clínica?\n\nEsta acción no se puede deshacer."
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      const res = await fetch(
        `/api/clinical-history?patientId=${patientId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error("No se pudo eliminar la historia clínica.");
        return;
      }

      toast.success("Historia clínica eliminada correctamente.");

      router.refresh();
    } catch {
      toast.error("Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleDelete}
      className="border border-red-600 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading
        ? "Eliminando..."
        : "Eliminar historia"}
    </button>
  );
}