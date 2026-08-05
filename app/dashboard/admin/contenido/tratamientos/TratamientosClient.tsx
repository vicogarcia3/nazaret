"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";

type Treatment = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
};

export default function TratamientosClient() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const confirmDialog = useConfirm();

  async function loadTreatments() {
    const res = await fetch("/api/treatments");
    const data = await res.json();
    setTreatments(data);
  }

  useEffect(() => {
    loadTreatments();
  }, []);

  function resetForm() {
    setName("");
    setDescription("");
    setPrice("");
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) return;

    setLoading(true);

    const payload = {
      name,
      description,
      price,
    };

    if (editingId) {
      await fetch(`/api/treatments/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/treatments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    }

    await loadTreatments();
    resetForm();
    setLoading(false);
  }

  function handleEdit(treatment: Treatment) {
    setEditingId(treatment.id);
    setName(treatment.name);
    setDescription(treatment.description || "");
    setPrice(treatment.price ? String(treatment.price) : "");
  }

  async function handleDelete(id: string) {
    const confirmDelete = await confirmDialog({
      title: "Eliminar tratamiento",
      description:
        "Este tratamiento será eliminado definitivamente.",
      confirmText: "Eliminar",
    });
    if (!confirmDelete) return;

    await fetch(`/api/treatments/${id}`, {
      method: "DELETE",
    });

    await loadTreatments();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-[#3f4a3c]">
          Tratamientos
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Cargá los tratamientos que luego verán los pacientes al reservar un turno.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border bg-white p-6 shadow-sm space-y-4"
      >
        <h2 className="text-lg font-semibold text-[#3f4a3c]">
          {editingId ? "Editar tratamiento" : "Nuevo tratamiento"}
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-gray-600">
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Blanqueamiento"
              className="mt-1 w-full rounded-xl border px-4 py-2 outline-none focus:ring-2 focus:ring-[#A2B38B]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">
              Precio
            </label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              placeholder="Ej: 25000"
              className="mt-1 w-full rounded-xl border px-4 py-2 outline-none focus:ring-2 focus:ring-[#A2B38B]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">
              Descripción
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              className="mt-1 w-full rounded-xl border px-4 py-2 outline-none focus:ring-2 focus:ring-[#A2B38B]"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#A2B38B] px-5 py-2 text-white font-medium hover:opacity-90 disabled:opacity-60"
          >
            <Plus size={18} />
            {editingId ? "Guardar cambios" : "Agregar tratamiento"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border px-5 py-2 text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f5f7f1] text-[#3f4a3c]">
            <tr>
              <th className="px-5 py-4 text-left">Tratamiento</th>
              <th className="px-5 py-4 text-left">Descripción</th>
              <th className="px-5 py-4 text-left">Precio</th>
              <th className="px-5 py-4 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {treatments.map((treatment) => (
              <tr key={treatment.id} className="border-t">
                <td className="px-5 py-4 font-medium text-gray-800">
                  {treatment.name}
                </td>

                <td className="px-5 py-4 text-gray-500">
                  {treatment.description || "-"}
                </td>

                <td className="px-5 py-4 text-gray-700">
                  {treatment.price
                    ? `$${treatment.price.toLocaleString("es-AR")}`
                    : "Sin precio"}
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(treatment)}
                      className="rounded-lg border p-2 text-gray-600 hover:bg-gray-50"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(treatment.id)}
                      className="rounded-lg border p-2 text-red-400 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {treatments.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-8 text-center text-gray-400"
                >
                  Todavía no hay tratamientos cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}