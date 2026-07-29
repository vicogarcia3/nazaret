"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";

type VerificationState =
  | "loading"
  | "success"
  | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const requestStarted = useRef(false);

  const [state, setState] =
    useState<VerificationState>("loading");

  const [message, setMessage] = useState(
    "Estamos verificando tu correo..."
  );

  useEffect(() => {
    if (requestStarted.current) {
      return;
    }

    requestStarted.current = true;

    async function verifyEmail() {
      if (!token) {
        setState("error");
        setMessage("El enlace de verificación no es válido.");
        return;
      }

      try {
        const response = await fetch(
          "/api/auth/verify-email",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "No se pudo verificar el correo."
          );
        }

        setState("success");
        setMessage(
          data.message ||
            "Tu correo fue verificado correctamente."
        );
      } catch (error) {
        setState("error");

        setMessage(
          error instanceof Error
            ? error.message
            : "No se pudo verificar el correo."
        );
      }
    }

    void verifyEmail();
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F5F0] px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-[#E7E3DB] bg-white p-8 text-center shadow-sm">
        {state === "loading" && (
          <>
            <div className="mx-auto mb-6 h-11 w-11 animate-spin rounded-full border-4 border-[#DED9CD] border-t-[#A2B38B]" />

            <h1 className="font-serif text-3xl text-[#59634D]">
              Verificando correo
            </h1>
          </>
        )}

        {state === "success" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8EFE1] text-3xl text-[#667457]">
              ✓
            </div>

            <h1 className="font-serif text-3xl text-[#59634D]">
              ¡Correo verificado!
            </h1>
          </>
        )}

        {state === "error" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl text-red-600">
              !
            </div>

            <h1 className="font-serif text-3xl text-red-700">
              No pudimos verificarlo
            </h1>
          </>
        )}

        <p className="mt-4 text-sm leading-6 text-neutral-600">
          {message}
        </p>

        {state === "success" && (
          <Link
            href="/login"
            className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-[#A2B38B] px-4 py-3 font-medium text-white transition hover:opacity-90"
          >
            Iniciar sesión
          </Link>
        )}

        {state === "error" && (
          <Link
            href="/login"
            className="mt-7 inline-flex w-full items-center justify-center rounded-lg border border-[#A2B38B] px-4 py-3 font-medium text-[#667457] transition hover:bg-[#F3F5F0]"
          >
            Volver al inicio de sesión
          </Link>
        )}
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F7F5F0]">
          <p className="text-neutral-600">
            Verificando...
          </p>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}