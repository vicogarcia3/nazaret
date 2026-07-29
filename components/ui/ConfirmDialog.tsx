"use client";

import { AlertTriangle, X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  loading = false,
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmButtonClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-amber-600 hover:bg-amber-700";

  const iconClass =
    variant === "danger"
      ? "bg-red-50 text-red-600"
      : "bg-amber-50 text-amber-600";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md border border-[#DED9CD] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-[#DED9CD] px-6 py-5">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconClass}`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                Confirmación
              </p>

              <h2
                id="confirm-dialog-title"
                className="font-serif text-2xl text-[#263F3B]"
              >
                {title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Cerrar"
            className="text-[#6B7774] transition hover:text-[#263F3B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <p className="text-sm leading-6 text-[#5F676F]">
            {description}
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#DED9CD] bg-[#FAF9F5] px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="border border-[#CBD0C7] bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#42524F] transition hover:bg-[#F1F2ED] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmButtonClass}`}
          >
            {loading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}