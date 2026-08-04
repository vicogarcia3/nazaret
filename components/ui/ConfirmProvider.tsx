"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

import ConfirmDialog from "@/components/ui/ConfirmDialog";

type ConfirmOptions = {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmFunction = (
  options: ConfirmOptions
) => Promise<boolean>;

type ConfirmState = ConfirmOptions & {
  open: boolean;
};

const initialState: ConfirmState = {
  open: false,
  title: "",
  description: "",
  confirmText: "Confirmar",
  cancelText: "Cancelar",
};

const ConfirmContext =
  createContext<ConfirmFunction | null>(null);

export function ConfirmProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [dialog, setDialog] =
    useState<ConfirmState>(initialState);

  const resolverRef =
    useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFunction>(
    (options) => {
      return new Promise<boolean>((resolve) => {
        resolverRef.current?.(false);
        resolverRef.current = resolve;

        setDialog({
          open: true,
          title: options.title,
          description: options.description,
          confirmText:
            options.confirmText || "Confirmar",
          cancelText:
            options.cancelText || "Cancelar",
        });
      });
    },
    []
  );

  const closeDialog = useCallback(
    (confirmed: boolean) => {
      resolverRef.current?.(confirmed);
      resolverRef.current = null;

      setDialog(initialState);
    },
    []
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <ConfirmDialog
        open={dialog.open}
        title={dialog.title}
        description={dialog.description}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        onConfirm={() => closeDialog(true)}
        onCancel={() => closeDialog(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error(
      "useConfirm debe utilizarse dentro de ConfirmProvider."
    );
  }

  return context;
}