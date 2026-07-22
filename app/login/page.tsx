"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminExists, setAdminExists] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin-exists")
      .then((res) => res.json())
      .then((data) => setAdminExists(data.exists))
      .catch(() => setAdminExists(true));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("El correo o la contraseña son incorrectos.");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F5EF] px-5 py-10 text-[#4D545D]">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/"
          className="mb-7 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#64715D] transition hover:text-[#263F3B]"
        >
          <span aria-hidden="true">←</span>
          Volver al inicio
        </Link>

        <section className="rounded-sm border border-[#E2E3DE] bg-white px-7 py-10 shadow-[0_8px_30px_rgba(38,63,59,0.08)] sm:px-10">
          <h1 className="text-center text-3xl font-medium tracking-tight text-[#30343A]">
            Iniciar sesión
          </h1>

          <button
            type="button"
            onClick={() =>
              signIn("google", {
                callbackUrl: "/dashboard",
              })
            }
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-md border border-[#D5D9DE] bg-white px-4 py-3.5 text-sm font-semibold text-[#49515D] transition hover:border-[#A2B38B] hover:bg-[#F8F9F6]"
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#E1E3E5]" />

            <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#9299A2]">
              o
            </span>

            <div className="h-px flex-1 bg-[#E1E3E5]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#737C86]"
              />

              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 w-full rounded-md border border-[#D5D9DE] bg-white py-3 pl-12 pr-4 text-[15px] font-medium text-[#555D67] outline-none transition placeholder:text-[#7F8791] focus:border-[#8E9E7A] focus:ring-2 focus:ring-[#A2B38B]/20"
              />
            </div>

            <div className="relative">
              <Lock
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#737C86]"
              />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 w-full rounded-md border border-[#D5D9DE] bg-white py-3 pl-12 pr-12 text-[15px] font-medium text-[#555D67] outline-none transition placeholder:text-[#7F8791] focus:border-[#8E9E7A] focus:ring-2 focus:ring-[#A2B38B]/20"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737C86] transition hover:text-[#263F3B]"
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>

            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-md bg-[#879B75] py-3 text-base font-semibold text-white transition hover:bg-[#748765] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#6C737C]">
              ¿Sos paciente y todavía no tenés cuenta?
            </p>

            <Link
              href="/registro"
              className="mt-2 inline-block text-[15px] font-semibold text-[#7C936A] transition hover:text-[#5F7652] hover:underline"
            >
              Crear una cuenta
            </Link>
          </div>

          {!adminExists && (
            <div className="mt-7 border-t border-[#E4E6E2] pt-6 text-center">
              <Link
                href="/crear-admin"
                className="text-sm font-semibold text-red-600 hover:underline"
              >
                Crear administrador
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.24c0-.74-.07-1.45-.19-2.13H12v4.03h5.24a4.48 4.48 0 0 1-1.94 2.94v2.62h3.14c1.84-1.69 2.91-4.19 2.91-7.46Z"
      />
      <path
        fill="#34A853"
        d="M12 21.75c2.62 0 4.82-.87 6.43-2.35l-3.14-2.62c-.87.58-1.98.93-3.29.93-2.53 0-4.67-1.71-5.44-4.01H3.32v2.7A9.72 9.72 0 0 0 12 21.75Z"
      />
      <path
        fill="#FBBC05"
        d="M6.56 13.7A5.84 5.84 0 0 1 6.25 12c0-.59.1-1.16.31-1.7V7.6H3.32A9.74 9.74 0 0 0 2.25 12c0 1.58.38 3.08 1.07 4.4l3.24-2.7Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.29c1.43 0 2.71.49 3.72 1.45l2.79-2.79A9.34 9.34 0 0 0 12 2.25 9.72 9.72 0 0 0 3.32 7.6l3.24 2.7C7.33 8 9.47 6.29 12 6.29Z"
      />
    </svg>
  );
}