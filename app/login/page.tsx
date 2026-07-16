"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminExists, setAdminExists] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch("/api/admin-exists")
      .then((res) => res.json())
      .then((data) => setAdminExists(data.exists));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
    });
  }

  return (
    <main className="min-h-screen bg-[#F7F5EF] px-6 py-12">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="mb-6 inline-block text-xs uppercase tracking-widest text-[var(--brand-primary)]/60 hover:text-[var(--brand-secondary)]"
        >
          ← VOLVER AL INICIO
        </Link>

        <div className="border border-gray-400 bg-white px-10 py-12">
          <h1 className="mb-2 font-serif text-4xl">
            Iniciar sesión
          </h1>

          <p className="mt-4 text-gray-500">
            Accedé al panel del consultorio o a tu portal de paciente.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-3 w-full border-b border-gray-300 bg-transparent py-2 outline-none transition focus:border-[#A2B38B]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                Contraseña
              </label>

              <div className="relative mt-3">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-b border-gray-300 bg-transparent py-2 pr-10 outline-none transition focus:border-[#A2B38B]"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-[#263F3B]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#A2B38B] py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-[#8E9E7A]"
            >
              Entrar
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500">
              ¿Sos paciente y todavía no tenés cuenta?
            </p>

            <Link
              href="/registro"
              className="mt-2 inline-block text-gray-800 transition hover:underline"
            >
              Crear una cuenta
            </Link>
          </div>

          {!adminExists && (
            <div className="mt-8 text-center">
              <Link href="/crear-admin" className="text-red-600 hover:underline">
                Crear administrador
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}