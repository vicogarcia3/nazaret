"use client";

import { useEffect, useState } from "react";

type Service = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  active: boolean;
};

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    image: "",
    active: true,
  });

  async function loadServices() {
    const res = await fetch("/api/services");
    const data = await res.json();
    setServices(data);
  }

  useEffect(() => {
    loadServices();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await fetch("/api/services", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    setForm({
      title: "",
      description: "",
      image: "",
      active: true,
    });

    loadServices();
  }

  function startEdit(service: Service) {
    setEditingId(service.id);

    setForm({
      title: service.title,
      description: service.description,
      image: service.image || "",
      active: service.active,
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();

    if (!editingId) return;

    const res = await fetch(`/api/services/${editingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      alert("No se pudo guardar el servicio");
      return;
    }

    setEditingId(null);
    setForm({
      title: "",
      description: "",
      image: "",
      active: true,
    });

    loadServices();
  }

  async function handleDelete(id: string) {
    const confirmDelete = confirm("¿Seguro que querés eliminar este servicio?");

    if (!confirmDelete) return;

    await fetch(`/api/services/${id}`, {
      method: "DELETE",
    });

    loadServices();
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      image: "",
      active: true,
    });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Servicios</h1>

      <form
        onSubmit={editingId ? handleUpdate : handleSubmit}
        className="rounded-xl bg-white p-6 shadow space-y-4"
      >
        <input
          className="w-full rounded border p-3"
          placeholder="Nombre del servicio"
          value={form.title}
          onChange={(e) =>
            setForm({
              ...form,
              title: e.target.value,
            })
          }
          required
        />

        <textarea
          className="w-full rounded border p-3"
          placeholder="Descripción"
          value={form.description}
          onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value,
            })
          }
          required
        />

        <input
          className="w-full rounded border p-3"
          placeholder="URL de imagen opcional"
          value={form.image}
          onChange={(e) =>
            setForm({
              ...form,
              image: e.target.value,
            })
          }
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) =>
              setForm({
                ...form,
                active: e.target.checked,
              })
            }
          />
          Servicio activo
        </label>

        <div className="flex gap-3">
          <button className="rounded bg-[#A2B38B] px-5 py-3 text-white hover:bg-[#8FA178]">
            {editingId ? "Guardar cambios" : "Crear servicio"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded bg-gray-300 px-5 py-3 text-black"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{service.title}</h2>
                <p className="mt-2 text-gray-600">{service.description}</p>

                {service.image && (
                  <p className="mt-2 text-sm text-gray-400">
                    Imagen: {service.image}
                  </p>
                )}

                <p className="mt-2 text-sm">
                  Estado:{" "}
                  <span
                    className={
                      service.active ? "text-green-600" : "text-red-600"
                    }
                  >
                    {service.active ? "Activo" : "Inactivo"}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => startEdit(service)}
                className="rounded bg-[#A2B38B] px-4 py-2 text-white hover:bg-[#8FA178]"
              >
                Editar
              </button>

              <button
                onClick={() => handleDelete(service.id)}
                className="rounded bg-[#D97A7A] px-4 py-2 text-white hover:bg-[#C96767]"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}