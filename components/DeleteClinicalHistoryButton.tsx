"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "./ui/ConfirmProvider";
import { Trash2, Loader2 } from "lucide-react";

type Props = {
  patientId: string;
};

export default function DeleteClinicalHistoryButton({
  patientId,
}: Props) {
  const router = useRouter();
  const confirmDialog = useConfirm();

  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = await confirmDialog({
      title: "Eliminar historia clínica",
      description:
        "La historia clínica será eliminada definitivamente. Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
    });

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
      onClick={handleDelete}
      disabled={loading}
      title="Eliminar historia clínica"
      className="inline-flex items-center gap-2 text-xs font-medium text-[#B42318] transition hover:text-[#912018] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}

      <span className="underline underline-offset-2">
        {loading
          ? "Eliminando..."
          : "Eliminar historia clínica"}
      </span>
    </button>
  );
}