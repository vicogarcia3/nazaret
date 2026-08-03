"use client";

import { useEffect, useState } from "react";
import { Image, Save } from "lucide-react";

export default function ConfiguracionPage() {
  const [form, setForm] = useState({
    clinicName: "",
    heroTitle: "",
    heroSubtitle: "",
    heroImage: "",
    whatsapp: "",
    instagram: "",
    facebook: "",
  });

  useEffect(() => {
    fetch("/api/site-config")
      .then((res) => res.json())
      .then((data) => {
        if (data) setForm(data);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await fetch("/api/site-config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    toast.success("Configuración guardada.");
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-medium leading-tight">
          Identidad del consultorio
        </h1>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-[#6B7774]">
          Configurá el nombre, lema, descripción e imagen principal que verán
          tus pacientes en el sitio público.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <section className="border border-[#DED9CD] bg-white">
          <div className="border-b border-[#DED9CD] p-8">
            <h2 className="font-[var(--font-cormorant)] text-xl font-medium">
              Datos principales
            </h2>

            <p className="mt-2 text-sm text-[#6B7774]">
              Información general visible en la página de inicio.
            </p>
          </div>

          <div className="space-y-8 p-8">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                Nombre del consultorio
              </label>

              <input
                className="mt-3 w-full border-b border-[#DED9CD] bg-transparent py-3 outline-none transition focus:border-[#263F3B]"
                value={form.clinicName}
                onChange={(e) =>
                  setForm({ ...form, clinicName: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                Lema principal
              </label>

              <input
                className="mt-3 w-full border-b border-[#DED9CD] bg-transparent py-3 outline-none transition focus:border-[#263F3B]"
                value={form.heroTitle}
                onChange={(e) =>
                  setForm({ ...form, heroTitle: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                Descripción
              </label>

              <textarea
                rows={8}
                className="mt-3 min-h-[220px] w-full resize-y border-b border-[#DED9CD] bg-transparent py-3 leading-8 outline-none transition focus:border-[#263F3B]"
                value={form.heroSubtitle}
                onChange={(e) =>
                  setForm({
                    ...form,
                    heroSubtitle: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </section>

        <section className="border border-[#DED9CD] bg-white">
          <div className="border-b border-[#DED9CD] p-8">
            <Image className="mb-5 h-5 w-5 text-[#A2B38B]" />

            <h2 className="font-[var(--font-cormorant)] text-xl font-medium">
              Imagen de portada
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#6B7774]">
              Esta imagen aparece en la página principal del consultorio.
            </p>
          </div>

          <div className="space-y-5 p-8">
            <input
              type="file"
              accept="image/*"
              className="w-full border border-[#DED9CD] bg-[#F7F5EF] p-3 text-sm"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const formData = new FormData();
                formData.append("file", file);

                const res = await fetch("/api/upload", {
                  method: "POST",
                  body: formData,
                });

                const data = await res.json();

                setForm({
                  ...form,
                  heroImage: data.url,
                });
              }}
            />

            {form.heroImage ? (
              <img
                src={form.heroImage}
                alt="Imagen principal"
                className="aspect-[4/5] w-full border border-[#DED9CD] object-cover"
              />
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center border border-dashed border-[#DED9CD] bg-[#F7F5EF] text-sm text-[#6B7774]">
                Imagen principal pendiente
              </div>
            )}
          </div>
        </section>

        <div className="lg:col-span-2">
          <button className="flex items-center gap-2 bg-[#263F3B] px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1d302d]">
            <Save className="h-4 w-4" />
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}