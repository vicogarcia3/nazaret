"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";

export default function RestablecerContrasenaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (!token) {
      setError("El enlace no es válido.");
      return;
    }

    if (password.length < 8) {
      setError(
        "La contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ||
            "No se pudo restablecer la contraseña."
        );
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch {
      setError(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F5EF] px-5 py-10">
      <div className="mx-auto max-w-lg">

        <div className="border border-[#DED9CD] bg-white p-8">

          <h1 className="font-serif text-3xl text-[#12302A]">
            Restablecer contraseña
          </h1>

          <p className="mt-3 text-sm text-[#6B7774]">
            Elegí una nueva contraseña para ingresar a tu cuenta.
          </p>

          {success ? (
            <div className="mt-8 rounded border border-green-200 bg-green-50 p-5">

              <div className="flex items-center gap-3">

                <CheckCircle2 className="h-6 w-6 text-green-600" />

                <div>

                  <p className="font-medium text-green-700">
                    Contraseña actualizada correctamente.
                  </p>

                  <p className="mt-1 text-sm text-green-600">
                    Serás redirigido al inicio de sesión...
                  </p>

                </div>

              </div>

            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              <div>

                <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Nueva contraseña
                </label>

                <div className="relative mt-2">

                  <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6B7774]" />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    className="w-full border border-[#DED9CD] py-3 pl-12 pr-12 outline-none"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>

                </div>

              </div>

              <div>

                <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Confirmar contraseña
                </label>

                <div className="relative mt-2">

                  <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6B7774]" />

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    className="w-full border border-[#DED9CD] py-3 pl-12 pr-12 outline-none"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>

                </div>

              </div>

              {error && (
                <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#263F3B] py-3 font-semibold text-white transition hover:bg-[#1D302D]"
              >
                {loading
                  ? "Guardando..."
                  : "Guardar nueva contraseña"}
              </button>

            </form>
          )}

          <div className="mt-8 border-t border-[#DED9CD] pt-6 text-center">

            <Link
              href="/login"
              className="text-sm font-semibold text-[#7C936A] hover:underline"
            >
              Volver al inicio de sesión
            </Link>

          </div>

        </div>
      </div>
    </main>
  );
}