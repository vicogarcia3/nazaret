"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [adminExists, setAdminExists] = useState(true);

  useEffect(() => {
    fetch("/api/admin-exists")
      .then((res) => res.json())
      .then((data) => {
        setAdminExists(data.exists);
      });
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
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
      >
        <h1 className="mb-6 text-3xl font-bold text-center">
          Iniciar Sesión
        </h1>

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded border p-3"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded border p-3"
        />

        <button
          type="submit"
          className="w-full rounded bg-teal-600 p-3 text-white hover:bg-teal-700"
        >
          Ingresar
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-500">
            ¿Sos paciente y todavía no tenés cuenta?
          </p>

          <Link href="/registro" className="text-teal-600 hover:underline">
            Crear cuenta
          </Link>
        </div>

        {!adminExists && (
          <div className="mt-6 text-center">
            <Link href="/crear-admin" className="text-red-600 hover:underline">
              Crear administrador
            </Link>
          </div>
        )}
      </form>
    </main>
  );
}