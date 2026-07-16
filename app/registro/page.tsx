"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
};

export default function RegistroPage() {
  const router = useRouter();

  const [branches, setBranches] = useState<Branch[]>([]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    dni: "",
    branchId: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/branches")
      .then((res) => res.json())
      .then((data) => {
        setBranches(data);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (!form.branchId) {
      setError("Seleccioná una sucursal.");
      return;
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "No se pudo crear la cuenta.");
      return;
    }

    router.push("/login");
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
      
      <form
        onSubmit={handleSubmit}
        className="border border-gray-400 bg-white px-10 py-12"
      >
        <h1 className="mb-6 text-center text-4xl font-serif">
          Crear cuenta
        </h1>

        <input
          className="text-sm font-semibold tracking-[0.15em] mb-4 w-full rounded border p-3"
          placeholder="Nombre"
          value={form.firstName}
          onChange={(e) =>
            setForm({ ...form, firstName: e.target.value })
          }
          required
        />

        <input
          className="text-sm font-semibold tracking-[0.15em] mb-4 w-full rounded border p-3"
          placeholder="Apellido"
          value={form.lastName}
          onChange={(e) =>
            setForm({ ...form, lastName: e.target.value })
          }
          required
        />

        <input
          className="text-sm font-semibold tracking-[0.15em] mb-4 w-full rounded border p-3"
          placeholder="DNI"
          value={form.dni}
          onChange={(e) =>
            setForm({ ...form, dni: e.target.value })
          }
          required
        />

        <input
          className="text-sm font-semibold tracking-[0.15em] mb-4 w-full rounded border p-3"
          placeholder="Teléfono"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
          required
        />

        <select
          className="text-sm font-semibold tracking-[0.15em] mb-4 w-full rounded border p-3"
          value={form.branchId}
          onChange={(e) =>
            setForm({ ...form, branchId: e.target.value })
          }
          required
        >
          <option value="">Seleccionar sucursal</option>

          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} — {branch.address}, {branch.city}
            </option>
          ))}
        </select>

        <input
          type="email"
          className="text-sm font-semibold tracking-[0.15em] mb-4 w-full rounded border p-3"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          required
        />

        <input
          type="password"
          className="text-sm font-semibold tracking-[0.15em] mb-4 w-full rounded border p-3"
          placeholder="Contraseña"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
          required
        />

        {error && (
          <p className="mb-4 text-red-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-[#A2B38B] py-4 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-[#8E9E7A]"
        >
          Crear cuenta
        </button>
      </form>
      </div>
    </main>
  );
}