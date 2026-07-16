"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

type Treatment = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
};

export default function TreatmentManager() {
  const [active, setActive] = useState(true);
  const [treatments, setTreatments] = useState<Treatment[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadTreatments() {
    const res = await fetch("/api/treatments");
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
      name,
      description,
      price,
      active,
    };

    if (editingId) {
      await fetch(`/api/treatments/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/treatments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");

    loadTreatments();
  }

  async function deleteTreatment(id: string) {
    if (!confirm("¿Eliminar tratamiento?")) return;

    await fetch(`/api/treatments/${id}`, {
      method: "DELETE",
    });

    loadTreatments();
  }

return (
  <div className="space-y-6">
    <div className="flex justify-end">
      <button
        onClick={saveTreatment}
        className="bg-[#1f3f36] text-white px-3 py-3 text-[10px] font-bold tracking-[0.22em] uppercase flex items-center gap-2"
      >
        <Plus size={15} />
        {editingId ? "Guardar cambios" : "Agregar tratamiento"}
      </button>
    </div>

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
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />
              <span className="text-xs tracking-[0.2em] uppercase text-[#6B7774]">
                Visible
              </span>
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
      </div>

      {editingId && (
        <button
          onClick={() => {
            setEditingId(null);
            setName("");
            setDescription("");
            setPrice("");
          }}
          className="mt-4 text-xs tracking-[0.2em] uppercase text-gray-500"
        >
          Cancelar edición
        </button>
      )}
    </div>

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
            <span className="text-[#6B7774] text-xs tracking-[0.2em] uppercase">
              Visible
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