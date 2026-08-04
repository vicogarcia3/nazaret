"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";
import { useConfirm } from "../ui/ConfirmProvider";

type Treatment = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  active: boolean;
};

export default function TreatmentManager() {
  const [active, setActive] = useState(true);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const confirmDialog = useConfirm();
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadTreatments() {
    const res = await fetch("/api/treatments?includeInactive=true", {
      cache: "no-store",
    });
    const data = await res.json();

    const sorted = data.sort((a: Treatment, b: Treatment) => {
        const priceA = a.price ?? 999999999;
        const priceB = b.price ?? 999999999;

        return priceA - priceB;
    });

    setTreatments(sorted);
  }

  useEffect(() => {
    loadTreatments();
  }, []);

  async function saveTreatment() {
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      price: price ? Number(price) : null,
      active,
    };

    const response = await fetch(
      editingId
        ? `/api/treatments/${editingId}`
        : "/api/treatments",
      {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Error guardando tratamiento:", data);
      return;
    }

    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setActive(true);
    setShowForm(false);

    await loadTreatments();
  }

  async function deleteTreatment(id: string) {
    const confirmed = await confirmDialog({
      title: "Eliminar tratamiento",
      description:
        "El tratamiento será eliminado definitivamente.",
      confirmText: "Eliminar",
    });

    if (!confirmed) return;

    await fetch(`/api/treatments/${id}`, {
      method: "DELETE",
    });

    loadTreatments();
  }

return (
  <div className="space-y-6">
    <div className="flex justify-end">
      <div className="flex justify-end gap-3">
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setName("");
              setDescription("");
              setPrice("");
              setActive(true);
              setShowForm(false);
            }}
            className="border border-[#DED9CD] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6B7774] hover:bg-[#F7F6F2]"
          >
            Cancelar
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingId(null);
              setName("");
              setDescription("");
              setPrice("");
              setActive(true);
              return;
            }

            setEditingId(null);
            setName("");
            setDescription("");
            setPrice("");
            setActive(true);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-[#263F3B] px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]"
        >
          <Plus size={15} />

          {showForm ? "Cerrar" : "Agregar tratamiento"}
        </button>

      </div>
    </div>
    
    {showForm && (
    <div className="border border-[#d8d2c4] bg-white p-8">
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-[#A2B38B] text-[11px] font-bold tracking-[0.35em] uppercase mb-3">
            Título
          </label>

          <input
            placeholder="Ej: Blanqueamiento"
            className="w-full border border-[#d8d2c4] bg-white px-3 py-2 outline-none text-[#1f3f36]"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[#9caf88] text-[11px] font-bold tracking-[0.35em] uppercase mb-3">
            Precio
          </label>

          <input
            placeholder="Ej: 25000"
            type="number"
            className="w-full border border-[#d8d2c4] bg-white px-3 py-2 outline-none text-[#1f3f36]"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div>
          <div className="flex justify-end items-center h-full">
            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#6B7774]">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 accent-[#6F855F]"
              />
              Visible
            </label>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-[#9caf88] text-[11px] font-bold tracking-[0.35em] uppercase mb-3">
          Descripción
        </label>

        <textarea
          placeholder="Descripción opcional del tratamiento"
          className="w-full min-h-[90px] border border-[#d8d2c4] bg-white px-3 py-2 outline-none text-[#1f3f36]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setName("");
              setDescription("");
              setPrice("");
              setActive(true);
              setShowForm(false);
            }}
            className="border border-[#DED9CD] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6B7774] hover:bg-[#F7F6F2]"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={saveTreatment}
            className="flex items-center gap-2 bg-[#263F3B] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1D302D]"
          >
            <Save size={15} />

            {editingId
              ? "Guardar cambios"
              : "Guardar tratamiento"}
          </button>
        </div>
      </div>
    </div>
    )}

    {treatments.map((t, index) => (
      <div
        key={t.id}
        className="border border-[#d8d2c4] bg-white p-8"
      >
        <div className="flex justify-between items-start mb-4">
          <span className="text-[#A2B38B] text-sm">
            #{index + 1}
          </span>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                t.active
                  ? "text-[#6F855F]"
                  : "text-gray-400"
              }`}
            >
              {t.active ? "Visible" : "Oculto"}
            </span>

            <button onClick={() => deleteTreatment(t.id)}>
              <Trash2 size={15} className="text-red-400" />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[#A2B38B] text-[11px] font-bold tracking-[0.35em] uppercase mb-2">
              Título
            </label>

            <input
              readOnly
              value={t.name}
              className="w-full border border-[#d8d2c4] bg-white px-3 py-2 outline-none text-[#1f3f36]"
            />
          </div>

          <div>
            <label className="block text-[#A2B38B] text-[11px] font-bold tracking-[0.35em] uppercase mb-2">
              Precio
            </label>

            <input
              readOnly
              value={
                t.price
                  ? `$${t.price.toLocaleString("es-AR")}`
                  : "Sin precio"
              }
              className="w-full border border-[#d8d2c4] bg-white px-3 py-2 outline-none text-[#1f3f36]"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-[#A2B38B] text-[11px] font-bold tracking-[0.35em] uppercase mb-3">
            Descripción
          </label>

          <textarea
            readOnly
            value={t.description || ""}
            className="w-full min-h-[80px] border border-[#d8d2c4] bg-white px-3 py-2 outline-none text-[#1f3f36]"
          />
        </div>

        <div className="flex justify-end mt-5">
          <button
            onClick={() => {
              setEditingId(t.id);
              setName(t.name);
              setDescription(t.description || "");
              setPrice(String(t.price || ""));
              setActive(t.active);
              setShowForm(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="bg-[#1f3f36] text-white px-3 py-3 text-[10px] font-bold tracking-[0.22em] uppercase flex items-center gap-2"
          >
            <Pencil size={15} />
            Editar tratamiento
          </button>
        </div>
      </div>
    ))}
  </div>
);
}