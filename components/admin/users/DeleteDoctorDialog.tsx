"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";

type DeleteDoctorDialogProps = {
  doctor:
    | {
        id: string;
        name: string;
      }
    | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function DeleteDoctorDialog({
  doctor,
  loading,
  onConfirm,
  onCancel,
}: DeleteDoctorDialogProps) {
  return (
    <ConfirmDialog
      open={Boolean(doctor)}
      title="Eliminar especialista"
      description={
        doctor
          ? `¿Seguro que querés eliminar a ${doctor.name}? Se eliminarán su perfil profesional y su acceso al sistema. Esta acción no se puede deshacer.`
          : ""
      }
      confirmText="Eliminar especialista"
      cancelText="Cancelar"
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
