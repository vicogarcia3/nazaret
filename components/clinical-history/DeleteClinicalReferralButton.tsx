"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  referralId: string;
};

export default function DeleteClinicalReferralButton({
  referralId,
}: Props) {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);

  async function deleteReferral() {
    const confirmed = window.confirm(
      "¿Querés eliminar esta derivación? También se eliminará la intervención registrada por el especialista."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/clinical-referrals/${referralId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo eliminar la derivación."
        );
      }

      toast.success("Derivación eliminada.");

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la derivación."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
        type="button"
        onClick={deleteReferral}
        disabled={deleting}
        title="Eliminar derivación"
        className="flex h-8 w-8 items-center justify-center rounded-full text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
    >
        {deleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
        <Trash2 className="h-4 w-4" />
        )}
    </button>
  );
}