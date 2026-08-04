"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
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
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">

        <div className="mb-5 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
        </div>

        <h2 className="text-center text-xl font-semibold text-[#263F3B]">
          {title}
        </h2>

        <p className="mt-3 text-center text-sm leading-6 text-[#6B7774]">
          {description}
        </p>

        <div className="mt-8 flex justify-end gap-3">

          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-lg border border-[#DED9CD] px-5 py-2.5 text-sm transition hover:bg-[#F8F7F3]"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-red-500 px-5 py-2.5 text-sm text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              confirmText
            )}
          </button>

        </div>
      </div>
    </div>
  );
}