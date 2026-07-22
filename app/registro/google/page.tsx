"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
};

export default function RegistroGooglePage() {
  const router = useRouter();

  const [branches, setBranches] = useState<Branch[]>([]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    phone: "",
    branchId: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadBranches() {
      try {
        const response = await fetch("/api/branches");
        const data = await response.json();

        setBranches(Array.isArray(data) ? data : []);
      } catch {
        setError("No se pudieron cargar las sucursales.");
      }
    }

    loadBranches();
  }, []);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (!form.branchId) {
      setError("Seleccioná una sucursal.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/register/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || "No se pudo completar el registro."
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("No se pudo completar el registro.");
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-center font-serif text-4xl">
            Completar cuenta
          </h1>

          <p className="mb-8 mt-4 text-center text-sm text-gray-500">
            Completá los datos necesarios para crear tu cuenta de
            paciente.
          </p>

          <input
            className="mb-4 w-full rounded border p-3 text-sm font-semibold tracking-[0.15em]"
            placeholder="Nombre"
            value={form.firstName}
            onChange={(e) =>
              setForm({
                ...form,
                firstName: e.target.value,
              })
            }
            required
          />

          <input
            className="mb-4 w-full rounded border p-3 text-sm font-semibold tracking-[0.15em]"
            placeholder="Apellido"
            value={form.lastName}
            onChange={(e) =>
              setForm({
                ...form,
                lastName: e.target.value,
              })
            }
            required
          />

          <input
            className="mb-4 w-full rounded border p-3 text-sm font-semibold tracking-[0.15em]"
            placeholder="DNI"
            value={form.dni}
            onChange={(e) =>
              setForm({
                ...form,
                dni: e.target.value,
              })
            }
            required
          />

          <input
            className="mb-4 w-full rounded border p-3 text-sm font-semibold tracking-[0.15em]"
            placeholder="Teléfono"
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
            required
          />

          <select
            className="mb-4 w-full rounded border p-3 text-sm font-semibold tracking-[0.15em]"
            value={form.branchId}
            onChange={(e) =>
              setForm({
                ...form,
                branchId: e.target.value,
              })
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

          {error && (
            <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#A2B38B] py-4 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-[#8E9E7A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creando cuenta..." : "Finalizar registro"}
          </button>
        </form>
      </div>
    </main>
  );
}