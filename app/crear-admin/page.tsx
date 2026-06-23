"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CrearAdminPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin-exists")
      .then((res) => res.json())
      .then((data) => {
        if (data.exists) {
          router.push("/login");
        }
      });
  }, [router]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");

    const res = await fetch("/api/create-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
      >
        <h1 className="mb-6 text-3xl font-bold text-center">
          Crear administrador
        </h1>

        <input
          className="mb-4 w-full rounded border p-3"
          placeholder="Nombre"
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value,
            })
          }
        />

        <input
          type="email"
          className="mb-4 w-full rounded border p-3"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value,
            })
          }
        />

        <input
          type="password"
          className="mb-6 w-full rounded border p-3"
          placeholder="Contraseña"
          value={form.password}
          onChange={(e) =>
            setForm({
              ...form,
              password: e.target.value,
            })
          }
        />

        {error && (
          <p className="mb-4 text-red-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded bg-teal-600 p-3 text-white"
        >
          Crear administrador
        </button>
      </form>
    </main>
  );
}