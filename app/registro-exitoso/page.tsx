"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function RegistroExitosoContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleResend() {
    if (!email) {
      setError("No pudimos identificar el correo registrado.");
      return;
    }

    setIsResending(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/auth/resend-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No pudimos reenviar el correo de verificación."
        );
      }

      setMessage(
        data.message ||
          "Te enviamos un nuevo correo de verificación."
      );
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "No pudimos reenviar el correo."
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F5F0] px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-[#E7E3DB] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8EFE1] text-3xl text-[#667457]">
          ✓
        </div>

        <h1 className="font-serif text-3xl text-[#59634D]">
          ¡Cuenta creada con éxito!
        </h1>

        <p className="mt-4 text-sm leading-6 text-neutral-600">
          Te enviamos un correo a:
        </p>

        {email && (
          <p className="mt-2 break-words text-base font-semibold text-[#59634D]">
            {email}
          </p>
        )}

        <div className="mt-6 rounded-xl bg-[#F7F5F0] p-4 text-left">
          <p className="text-sm leading-6 text-neutral-600">
            Abrí el correo y hacé clic en el enlace para verificar
            tu cuenta.
          </p>

          <p className="mt-3 text-sm font-medium leading-6 text-[#59634D]">
            Hasta que no verifiques tu correo, no vas a poder
            iniciar sesión.
          </p>

          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Si no lo encontrás, revisá la carpeta Spam o Correo no
            deseado.
          </p>
        </div>

        {message && (
          <div className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Link
          href="/login"
          className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-[#A2B38B] px-4 py-3 font-medium text-white transition hover:opacity-90"
        >
          Ir al inicio de sesión
        </Link>

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || !email}
          className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-[#A2B38B] px-4 py-3 font-medium text-[#667457] transition hover:bg-[#F3F5F0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isResending
            ? "Enviando..."
            : "Reenviar correo de verificación"}
        </button>
      </section>
    </main>
  );
}

export default function RegistroExitosoPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F7F5F0]">
          <p className="text-neutral-600">Cargando...</p>
        </main>
      }
    >
      <RegistroExitosoContent />
    </Suspense>
  );
}