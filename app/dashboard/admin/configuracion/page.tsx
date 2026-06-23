"use client";

import { useEffect, useState } from "react";

export default function ConfiguracionPage() {
  const [form, setForm] = useState({
    clinicName: "",
    heroTitle: "",
    heroSubtitle: "",
    whatsapp: "",
    instagram: "",
    facebook: "",
  });

  useEffect(() => {
    fetch("/api/site-config")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setForm(data);
        }
      });
  }, []);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    await fetch("/api/site-config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    alert("Configuración guardada.");
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-8 text-3xl font-bold">
        Configuración del sitio
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <input
          className="w-full rounded border p-3"
          placeholder="Nombre del consultorio"
          value={form.clinicName}
          onChange={(e) =>
            setForm({
              ...form,
              clinicName: e.target.value,
            })
          }
        />

        <input
          className="w-full rounded border p-3"
          placeholder="Título principal"
          value={form.heroTitle}
          onChange={(e) =>
            setForm({
              ...form,
              heroTitle: e.target.value,
            })
          }
        />

        <textarea
          className="w-full rounded border p-3"
          placeholder="Subtítulo"
          value={form.heroSubtitle}
          onChange={(e) =>
            setForm({
              ...form,
              heroSubtitle: e.target.value,
            })
          }
        />

        <input
          className="w-full rounded border p-3"
          placeholder="WhatsApp"
          value={form.whatsapp || ""}
          onChange={(e) =>
            setForm({
              ...form,
              whatsapp: e.target.value,
            })
          }
        />

        <input
          className="w-full rounded border p-3"
          placeholder="Instagram"
          value={form.instagram || ""}
          onChange={(e) =>
            setForm({
              ...form,
              instagram: e.target.value,
            })
          }
        />

        <input
          className="w-full rounded border p-3"
          placeholder="Facebook"
          value={form.facebook || ""}
          onChange={(e) =>
            setForm({
              ...form,
              facebook: e.target.value,
            })
          }
        />

        <button className="rounded bg-[#A2B38B] hover:bg-[#8FA178] px-4 py-2 text-white">
          Guardar
        </button>
      </form>
    </div>
  );
}