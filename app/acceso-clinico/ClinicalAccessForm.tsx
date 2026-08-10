"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function ClinicalAccessForm() {
  const router = useRouter();

  const [step, setStep] = useState<"EMAIL" | "CODE">("EMAIL");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.error("Ingresá tu correo electrónico.");
      return;
    }

    try {
      setSendingCode(true);

      const response = await fetch(
        "/api/clinical-access/request-code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.error || "No se pudo enviar el código."
        );
        return;
      }

      setEmail(normalizedEmail);
      setStep("CODE");

      toast.success(
        "Si tu correo está habilitado, vas a recibir un código de acceso."
      );
    } catch (error) {
      console.error("Error solicitando código:", error);

      toast.error(
        "No se pudo enviar el código. Intentá nuevamente."
      );
    } finally {
      setSendingCode(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();

    const normalizedCode = code.trim();

    if (!/^\d{6}$/.test(normalizedCode)) {
      toast.error("Ingresá el código de 6 dígitos.");
      return;
    }

    try {
      setVerifyingCode(true);

      const response = await fetch(
        "/api/clinical-access/verify-code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            code: normalizedCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.error || "El código no es válido."
        );
        return;
      }

      toast.success("Identidad verificada.");

      router.push("/historias-clinicas");
      router.refresh();
    } catch (error) {
      console.error("Error verificando código:", error);

      toast.error(
        "No se pudo verificar el código."
      );
    } finally {
      setVerifyingCode(false);
    }
  }

  async function resendCode() {
    try {
      setSendingCode(true);

      const response = await fetch(
        "/api/clinical-access/request-code",
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
        toast.error(
          data.error || "No se pudo reenviar el código."
        );
        return;
      }

      setCode("");

      toast.success("Solicitamos un nuevo código.");
    } catch (error) {
      console.error("Error reenviando código:", error);

      toast.error(
        "No se pudo reenviar el código."
      );
    } finally {
      setSendingCode(false);
    }
  }

  return (
    <section className="border border-[#DED9CD] bg-white p-8 shadow-sm">
      {step === "EMAIL" ? (
        <form onSubmit={requestCode}>
          <div className="mb-6">
            <Mail className="mb-4 h-5 w-5 text-[#A2B38B]" />

            <h2 className="font-serif text-2xl font-medium">
              Verificá tu correo
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#6B7774]">
              Usá el mismo correo que fue registrado para vos por el
              consultorio.
            </p>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A2B38B]">
              Correo electrónico
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="especialista@email.com"
              autoComplete="email"
              required
              className="mt-3 w-full border border-[#DED9CD] bg-white p-3 outline-none transition focus:border-[#263F3B]"
            />
          </div>

          <button
            type="submit"
            disabled={sendingCode}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-[#263F3B] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1D302D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sendingCode && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {sendingCode
              ? "Enviando..."
              : "Enviar código"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode}>
          <div className="mb-6">
            <ShieldCheck className="mb-4 h-5 w-5 text-[#A2B38B]" />

            <h2 className="font-serif text-2xl font-medium">
              Ingresá el código
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#6B7774]">
              Enviamos un código de 6 dígitos a:
            </p>

            <p className="mt-1 font-medium text-[#263F3B]">
              {email}
            </p>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A2B38B]">
              Código de acceso
            </label>

            <input
              value={code}
              onChange={(event) => {
                const value = event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6);

                setCode(value);
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              className="mt-3 w-full border border-[#DED9CD] bg-white p-4 text-center text-2xl font-semibold tracking-[0.5em] outline-none transition focus:border-[#263F3B]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={verifyingCode || code.length !== 6}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-[#263F3B] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1D302D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {verifyingCode && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {verifyingCode
              ? "Verificando..."
              : "Acceder"}
          </button>

          <div className="mt-6 flex flex-col items-center gap-3 border-t border-[#DED9CD] pt-5">
            <button
              type="button"
              disabled={sendingCode}
              onClick={resendCode}
              className="text-xs font-medium text-[#6F855F] hover:underline disabled:opacity-50"
            >
              {sendingCode
                ? "Enviando nuevo código..."
                : "Reenviar código"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("EMAIL");
                setCode("");
              }}
              className="text-xs text-[#6B7774] hover:underline"
            >
              Usar otro correo
            </button>
          </div>
        </form>
      )}
    </section>
  );
}