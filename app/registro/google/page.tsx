"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Loader2,
  Phone,
  User,
} from "lucide-react";

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
  const [loadingBranches, setLoadingBranches] = useState(true);

  useEffect(() => {
    async function loadBranches() {
      try {
        const response = await fetch("/api/branches");
        const data = await response.json();

        if (!response.ok) {
          throw new Error();
        }

        setBranches(Array.isArray(data) ? data : []);
      } catch {
        setError("No se pudieron cargar las sucursales.");
      } finally {
        setLoadingBranches(false);
      }
    }

    loadBranches();
  }, []);

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

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
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          dni: form.dni.trim(),
          phone: form.phone.trim(),
          branchId: form.branchId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || "No se pudo completar el registro."
        );
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("No se pudo completar el registro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F5EF] px-5 py-8 text-[#4D545D] sm:py-12">
      <div className="mx-auto w-full max-w-lg">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#64715D] transition hover:text-[#263F3B]"
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>

        <section className="overflow-hidden rounded-xl border border-[#E0E3DD] bg-white shadow-[0_18px_50px_rgba(38,63,59,0.08)]">
          <div className="border-b border-[#E9EBE6] px-7 py-8 text-center sm:px-10">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF1E9] text-[#7B8F69]">
              <User size={23} strokeWidth={1.8} />
            </div>

            <h1 className="font-[var(--font-playfair)] text-3xl font-medium text-[#30343A] sm:text-4xl">
              Completá tu cuenta
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#747B84]">
              Ingresá tus datos personales para terminar de crear tu
              perfil de paciente.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 px-7 py-8 sm:px-10"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Nombre"
                icon={<User size={18} />}
              >
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) =>
                    updateField("firstName", e.target.value)
                  }
                  placeholder="Ingresá tu nombre"
                  autoComplete="given-name"
                  required
                  className={inputClassName}
                />
              </Field>

              <Field
                label="Apellido"
                icon={<User size={18} />}
              >
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) =>
                    updateField("lastName", e.target.value)
                  }
                  placeholder="Ingresá tu apellido"
                  autoComplete="family-name"
                  required
                  className={inputClassName}
                />
              </Field>
            </div>

            <Field
              label="DNI"
              icon={<CreditCard size={18} />}
            >
              <input
                type="text"
                inputMode="numeric"
                value={form.dni}
                onChange={(e) =>
                  updateField(
                    "dni",
                    e.target.value.replace(/\D/g, "")
                  )
                }
                placeholder="Ejemplo: 40123456"
                autoComplete="off"
                required
                className={inputClassName}
              />
            </Field>

            <Field
              label="Teléfono"
              icon={<Phone size={18} />}
            >
              <input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  updateField("phone", e.target.value)
                }
                placeholder="Ejemplo: 351 123 4567"
                autoComplete="tel"
                required
                className={inputClassName}
              />
            </Field>

            <Field
              label="Sucursal"
              icon={<Building2 size={18} />}
            >
              <select
                value={form.branchId}
                onChange={(e) =>
                  updateField("branchId", e.target.value)
                }
                disabled={loadingBranches}
                required
                className={`${inputClassName} cursor-pointer appearance-none`}
              >
                <option value="">
                  {loadingBranches
                    ? "Cargando sucursales..."
                    : "Seleccioná una sucursal"}
                </option>

                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} — {branch.city}
                  </option>
                ))}
              </select>
            </Field>

            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || loadingBranches}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#879B75] px-5 text-sm font-semibold text-white transition hover:bg-[#748765] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              )}

              {loading
                ? "Creando cuenta..."
                : "Finalizar registro"}
            </button>

            <p className="text-center text-xs leading-5 text-[#8A9098]">
              Estos datos se utilizarán únicamente para gestionar tu
              atención en Consultorios Nazaret.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#555D67]">
        <span className="text-[#849672]">{icon}</span>
        {label}
      </label>

      {children}
    </div>
  );
}

const inputClassName =
  "h-12 w-full rounded-md border border-[#D5D9DE] bg-white px-4 text-[15px] font-medium text-[#555D67] outline-none transition placeholder:text-[#A0A5AC] focus:border-[#8E9E7A] focus:ring-2 focus:ring-[#A2B38B]/20 disabled:cursor-not-allowed disabled:bg-[#F4F5F2]";