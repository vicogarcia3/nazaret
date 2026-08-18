"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, User, Phone, MapPin, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/ConfirmProvider";

type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
};

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  dni: string | null;
  phone: string;
  email: string | null;
  branch: Branch;
  plan: {
    id: string;
    name: string;
  } | null;
};

type Plan = {
  id: string;
  name: string;
};

export default function PacientesClient({
  patients,
  branches,
  plans,
}: {
  patients: Patient[];
  branches: Branch[];
  plans: Plan[];
}) {
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    phone: "",
    email: "",
    branchId: "",
    planId: "",
  });

  const filteredPatients = useMemo(() => {
    const value = search.toLowerCase().trim();

    return patients.filter((patient) => {
      const text =
        `${patient.firstName} ${patient.lastName} ${patient.dni}`.toLowerCase();

      const matchesSearch = text.includes(value);

      const matchesBranch = branchFilter === "" || patient.branch.id === branchFilter;

      return matchesSearch && matchesBranch;
    });
  }, [patients, search, branchFilter]);

  function resetForm() {
    setEditingId(null);
    setShowForm(false);

    setForm({
      firstName: "",
      lastName: "",
      dni: "",
      phone: "",
      email: "",
      branchId: "",
      planId: "",
    });
  }

  function startEdit(patient: Patient) {
    setEditingId(patient.id);
    setShowForm(true);

    setForm({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dni: patient.dni || "",
      phone: patient.phone,
      email: patient.email || "",
      branchId: patient.branch.id,
      planId: patient.plan?.id || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const url = editingId ? `/api/patients/${editingId}` : "/api/patients";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error("No se pudo guardar el paciente.");
      return;
    }

    resetForm();
    router.refresh();
  }

  async function handleDeletePatient(id: string) {
    const confirmed = await confirmDialog({
      title: "Eliminar paciente",
      description:
        "El paciente será eliminado del sistema. Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
    });

    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(
          data.error || "No se pudo eliminar el paciente."
        );
        return;
      }

      toast.success(
        data.message || "Paciente eliminado correctamente."
      );

      router.refresh();
    } catch (error) {
      console.error("Error al eliminar el paciente:", error);

      toast.error(
        "No se pudo eliminar el paciente. Intentá nuevamente."
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <div className="space-y-10">
        <header>
          <h1 className="font-serif text-4xl font-medium leading-tight">
            Pacientes
          </h1>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#6B7774]">
            Administrá los pacientes registrados, sus datos personales, sucursal
            de atención y plan asociado.
          </p>
        </header>

        <section className="border border-[#DED9CD] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DED9CD] p-8">
            <div>
              <User className="mb-3 h-4 w-4 text-[#A2B38B]" />

              <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
                {editingId ? "Editar paciente" : "Nuevo paciente"}
              </h2>

              <p className="mt-2 text-sm text-[#6B7774]">
                {editingId
                  ? "Modificá los datos del paciente seleccionado."
                  : "Cargá un paciente nuevo al consultorio."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setShowForm(true);
                }
              }}
              className="flex items-center gap-2 bg-[#263F3B] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]"
            >
              <Plus className="h-4 w-4" />
              {showForm ? "Cerrar" : "Nuevo paciente"}
            </button>
          </div>

          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="grid gap-6 p-8 md:grid-cols-2"
            >
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Nombre
                </label>

                <input
                  className="mt-2 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Apellido
                </label>

                <input
                  className="mt-2 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  DNI
                </label>

                <input
                  className="mt-2 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                  value={form.dni}
                  onChange={(e) => setForm({ ...form, dni: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Celular
                </label>

                <input
                  className="mt-2 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Email
                </label>

                <input
                  type="email"
                  className="mt-2 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                  placeholder="paciente@correo.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value.toLowerCase(),
                    })
                  }
                />

                <p className="mt-2 text-xs leading-5 text-[#6B7774]">
                  Opcional. Si se carga un email, el paciente deberá utilizar este mismo correo cuando cree su cuenta.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Sucursal
                </label>

                <select
                  className="mt-2 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
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
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Plan
                </label>

                <select
                  className="mt-2 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                  value={form.planId}
                  onChange={(e) =>
                    setForm({ ...form, planId: e.target.value })
                  }
                >
                  <option value="">Sin plan</option>

                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 md:col-span-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border border-[#DED9CD] px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] hover:bg-[#F7F5EF]"
                  >
                    Cancelar
                  </button>
                )}

                <button className="bg-[#263F3B] px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]">
                  {editingId ? "Guardar cambios" : "Guardar paciente"}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="border border-[#DED9CD] bg-white p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                Buscar paciente
              </p>

              <input
                className="w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                placeholder="Nombre, apellido o DNI"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                Filtrar por sucursal
              </p>

              <select
                className="w-full border border-[#DED9CD] bg-white p-2 text-[#263F3B] outline-none focus:border-[#263F3B]"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
              >
                <option value="">Todas las sucursales</option>

                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} — {branch.address}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="grid gap-6">
          {filteredPatients.map((patient, index) => (
            <article
              key={patient.id}
              className="border border-[#DED9CD] bg-white p-8 transition hover:bg-[#F7F5EF]"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <span className="text-sm text-[#A2B38B]">#{index + 1}</span>

                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => startEdit(patient)}
                    className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] hover:underline"
                  >
                    Editar
                  </button>

                  <Link
                    href={`/dashboard/admin/mi-panel/pacientes/${patient.id}`}
                    className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7774] hover:underline"
                  >
                    Ver ficha
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDeletePatient(patient.id)}
                    className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D97A7A] hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
                {patient.lastName}, {patient.firstName}
              </h2>

              <div className="mt-4 grid gap-5 text-sm text-[#6B7774] md:grid-cols-2">
                <p>
                  <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    DNI
                  </span>
                  <span className="mt-1 block text-[#263F3B]">
                    {patient.dni}
                  </span>
                </p>

                <p>
                  <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Teléfono
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-[#263F3B]">
                    <Phone className="h-4 w-4 text-[#A2B38B]" />
                    {patient.phone}
                  </span>
                </p>

                <p>
                  <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Email
                  </span>

                  <span className="mt-1 block text-[#263F3B]">
                    {patient.email || "Sin email"}
                  </span>
                </p>

                <p>
                  <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Sucursal
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-[#263F3B]">
                    <MapPin className="h-4 w-4 text-[#A2B38B]" />
                    {patient.branch.name} — {patient.branch.address}
                  </span>
                </p>

                <p>
                  <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Plan
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-[#263F3B]">
                    <BadgeCheck className="h-4 w-4 text-[#A2B38B]" />
                    {patient.plan ? patient.plan.name : "Sin plan"}
                  </span>
                </p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}