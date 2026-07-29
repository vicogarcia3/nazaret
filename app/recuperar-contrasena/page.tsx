"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [developmentUrl, setDevelopmentUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");
    setDevelopmentUrl("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "No se pudo procesar la solicitud. Intentá nuevamente."
        );
        return;
      }

      setMessage(
        data.message ||
          "Si existe una cuenta asociada a ese correo, recibirás las instrucciones."
      );

      /*
       * Solo se devuelve durante el desarrollo cuando Resend todavía
       * no está configurado.
       */
      if (data.developmentUrl) {
        setDevelopmentUrl(data.developmentUrl);
      }
    } catch (error) {
      console.error(error);

      setError(
        "No se pudo conectar con el servidor. Intentá nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F5EF] px-5 py-10 text-[#4D545D]">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/login"
          className="mb-7 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#64715D] transition hover:text-[#263F3B]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio de sesión
        </Link>

        <section className="rounded-sm border border-[#E2E3DE] bg-white px-7 py-10 shadow-[0_8px_30px_rgba(38,63,59,0.08)] sm:px-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EFF3EB] text-[#879B75]">
            <Mail className="h-6 w-6" />
          </div>

          <h1 className="mt-5 text-center text-3xl font-medium tracking-tight text-[#30343A]">
            Recuperar contraseña
          </h1>

          <p className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-[#6C737C]">
            Ingresá el correo de tu cuenta y te enviaremos un enlace
            para crear una contraseña nueva.
          </p>

          {!message ? (
            <form onSubmit={handleSubmit} className="mt-8">
              <label
                htmlFor="email"
                className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#879B75]"
              >
                Correo electrónico
              </label>

              <div className="relative mt-2">
                <Mail
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#737C86]"
                />

                <input
                  id="email"
                  type="email"
                  placeholder="tu-correo@ejemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                  className="h-12 w-full rounded-md border border-[#D5D9DE] bg-white py-3 pl-12 pr-4 text-[15px] font-medium text-[#555D67] outline-none transition placeholder:text-[#9AA1A9] focus:border-[#8E9E7A] focus:ring-2 focus:ring-[#A2B38B]/20 disabled:bg-[#F5F5F3]"
                />
              </div>

              {error && (
                <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-[#879B75] py-3 text-base font-semibold text-white transition hover:bg-[#748765] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}

                {loading
                  ? "Enviando instrucciones..."
                  : "Enviar instrucciones"}
              </button>
            </form>
          ) : (
            <div className="mt-8">
              <div className="rounded-md border border-[#DDE7D6] bg-[#F3F7F0] px-5 py-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#718B60]" />

                  <p className="text-sm leading-6 text-[#53634D]">
                    {message}
                  </p>
                </div>
              </div>

              {developmentUrl && (
                <div className="mt-5 border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                    Solo para desarrollo
                  </p>

                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    Como todavía no configuraste el correo, podés
                    continuar usando este enlace:
                  </p>

                  <Link
                    href={developmentUrl}
                    className="mt-3 inline-block break-all text-sm font-semibold text-[#5F7652] underline"
                  >
                    Abrir enlace de recuperación
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setDevelopmentUrl("");
                  setEmail("");
                }}
                className="mt-5 w-full border border-[#D5D9DE] bg-white px-4 py-3 text-sm font-semibold text-[#5F676F] transition hover:bg-[#F8F9F6]"
              >
                Probar con otro correo
              </button>
            </div>
          )}

          <div className="mt-7 border-t border-[#E4E6E2] pt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-semibold text-[#7C936A] transition hover:text-[#5F7652] hover:underline"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}