"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  MapPin,
  Phone,
  Pencil,
  Trash2,
  Save,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/ConfirmProvider";

type Branch = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string | null;
  mapUrl: string | null;
};

export default function SucursalesPage() {
  const confirmDialog = useConfirm();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [editingId, setEditingId] = useState<string | null>(
    null
  );

  const [form, setForm] = useState({
    name: "",
    city: "",
    address: "",
    phone: "",
    mapUrl: "",
  });

  async function loadBranches() {
    const res = await fetch("/api/branches");
    const data = await res.json();

    setBranches(data);
  }

  useEffect(() => {
    loadBranches();
  }, []);

  function resetForm() {
    setEditingId(null);

    setForm({
      name: "",
      city: "",
      address: "",
      phone: "",
      mapUrl: "",
    });
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const url = editingId
      ? `/api/branches/${editingId}`
      : "/api/branches";

    const method = editingId
      ? "PUT"
      : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        mapUrl: form.mapUrl.trim() || null,
      }),
    });

    if (!res.ok) {
      const error = await res.json();

      toast.error(
        error.error ||
          "No se pudo guardar la sucursal."
      );

      return;
    }

    toast.success(
      editingId
        ? "Sucursal actualizada correctamente."
        : "Sucursal creada correctamente."
    );

    resetForm();
    await loadBranches();
  }

  async function handleDelete(id: string) {
    const confirmed = await confirmDialog({
      title: "Eliminar sucursal",
      description:
        "La sucursal será eliminada definitivamente. Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
    });

    if (!confirmed) {
      return;
    }

    const res = await fetch(
      `/api/branches/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!res.ok) {
      const error = await res.json();

      toast.error(
        error.error ||
          "No se pudo eliminar la sucursal."
      );

      return;
    }

    toast.success(
      "Sucursal eliminada correctamente."
    );

    await loadBranches();
  }

  function startEdit(branch: Branch) {
    setEditingId(branch.id);

    setForm({
      name: branch.name,
      city: branch.city,
      address: branch.address,
      phone: branch.phone || "",
      mapUrl: branch.mapUrl || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <div className="space-y-10">
        <header>
          <h1 className="font-serif text-4xl font-medium leading-tight">
            Sucursales
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7774]">
            Administrá las sedes del consultorio que
            aparecen en la página pública y en la reserva
            de turnos.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="border border-[#DED9CD] bg-white p-8"
        >
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <MapPin className="mb-4 h-5 w-6 text-[#A2B38B]" />

              <h2 className="font-[var(--font-cormorant)] text-3xl font-medium">
                {editingId
                  ? "Editar sucursal"
                  : "Nueva sucursal"}
              </h2>

              <p className="mt-2 text-sm text-[#6B7774]">
                Cargá nombre, ciudad, dirección, teléfono
                y ubicación en Google Maps.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="border border-[#DED9CD] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] hover:bg-[#F7F5EF]"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                Nombre
              </label>

              <input
                className="mt-3 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                Ciudad / Localidad
              </label>

              <input
                className="mt-3 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                value={form.city}
                onChange={(e) =>
                  setForm({
                    ...form,
                    city: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Dirección
            </label>

            <input
              className="mt-3 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
              value={form.address}
              onChange={(e) =>
                setForm({
                  ...form,
                  address: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="mt-6">
            <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Teléfono
            </label>

            <input
              className="mt-3 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
            />
          </div>

          <div className="mt-6">
            <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Ubicación en Google Maps
            </label>

            <input
              type="url"
              className="mt-3 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
              placeholder="https://maps.google.com/..."
              value={form.mapUrl}
              onChange={(e) =>
                setForm({
                  ...form,
                  mapUrl: e.target.value,
                })
              }
            />

            <p className="mt-2 text-xs leading-5 text-[#6B7774]">
              Pegá el enlace de Google Maps de esta
              sucursal. Se utilizará para mostrar el botón
              “Ver ubicación” en la página pública.
            </p>
          </div>

          <div className="mt-8 flex justify-end">
            <button className="flex items-center gap-2 bg-[#263F3B] px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]">
              {editingId ? (
                <>
                  <Save className="h-4 w-4" />
                  Guardar cambios
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Crear sucursal
                </>
              )}
            </button>
          </div>
        </form>

        <section className="grid gap-6 md:grid-cols-2">
          {branches.map((branch, index) => (
            <article
              key={branch.id}
              className="border border-[#DED9CD] bg-white p-8"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <span className="text-sm text-[#A2B38B]">
                  #{index + 1}
                </span>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      startEdit(branch)
                    }
                    className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] hover:underline"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(branch.id)
                    }
                    className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D97A7A] hover:underline"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              </div>

              <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
                {branch.name}
              </h2>

              <div className="mt-6 space-y-4 text-sm text-[#6B7774]">
                <p>
                  <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Localidad
                  </span>

                  <span className="mt-1 block text-[#263F3B]">
                    {branch.city}
                  </span>
                </p>

                <p>
                  <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Dirección
                  </span>

                  <span className="mt-1 block text-[#263F3B]">
                    {branch.address}
                  </span>
                </p>

                <p>
                  <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Teléfono
                  </span>

                  <span className="mt-1 flex items-center gap-2 text-[#263F3B]">
                    <Phone className="h-4 w-4 text-[#A2B38B]" />
                    {branch.phone ||
                      "Sin teléfono cargado"}
                  </span>
                </p>

                <div>
                  <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Ubicación
                  </span>

                  {branch.mapUrl ? (
                    <a
                      href={branch.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#6F855F] transition hover:underline"
                    >
                      <MapPin className="h-4 w-4" />
                      Ver ubicación
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="mt-1 block text-[#6B7774]">
                      Sin ubicación cargada
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}