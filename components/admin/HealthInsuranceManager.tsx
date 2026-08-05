"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import ImageUploader from "@/components/admin/ImageUploader";
import { useConfirm } from "@/components/ui/ConfirmProvider";

type HealthInsurance = {
  id: string;
  name: string;
  logo: string | null;
  visible: boolean;
};

export default function HealthInsuranceManager() {
  const confirmDialog = useConfirm();

  const [healthInsurances, setHealthInsurances] = useState<
    HealthInsurance[]
  >([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(
    null
  );

  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [visible, setVisible] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<
    string | null
  >(null);

  function resetForm() {
    setEditingId(null);
    setName("");
    setLogo("");
    setVisible(true);
  }

  function closeForm() {
    resetForm();
    setShowForm(false);
  }

  async function loadHealthInsurances() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/health-insurances?includeHidden=true",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudieron cargar las obras sociales."
        );
      }

      const sortedItems = Array.isArray(data)
        ? [...data].sort(
            (
              first: HealthInsurance,
              second: HealthInsurance
            ) =>
              first.name.localeCompare(second.name, "es", {
                sensitivity: "base",
              })
          )
        : [];

      setHealthInsurances(sortedItems);
    } catch (error) {
      console.error(
        "Error cargando obras sociales:",
        error
      );

      setHealthInsurances([]);

      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las obras sociales."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHealthInsurances();
  }, []);

  async function saveHealthInsurance() {
    const normalizedName = name.trim();

    if (!normalizedName) {
      toast.error(
        "Ingresá el nombre de la obra social."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        editingId
          ? `/api/health-insurances/${editingId}`
          : "/api/health-insurances",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: normalizedName,
            logo: logo.trim() || null,
            visible,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo guardar la obra social."
        );
      }

      toast.success(
        editingId
          ? "Obra social actualizada correctamente."
          : "Obra social creada correctamente."
      );

      closeForm();
      await loadHealthInsurances();
    } catch (error) {
      console.error(
        "Error guardando obra social:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la obra social."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item: HealthInsurance) {
    setEditingId(item.id);
    setName(item.name);
    setLogo(item.logo || "");
    setVisible(item.visible);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteHealthInsurance(
    item: HealthInsurance
  ) {
    const confirmed = await confirmDialog({
      title: "Eliminar obra social",
      description: `La obra social ${item.name} será eliminada definitivamente.`,
      confirmText: "Eliminar",
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(item.id);

      const response = await fetch(
        `/api/health-insurances/${item.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo eliminar la obra social."
        );
      }

      setHealthInsurances((currentItems) =>
        currentItems.filter(
          (currentItem) =>
            currentItem.id !== item.id
        )
      );

      if (editingId === item.id) {
        closeForm();
      }

      toast.success(
        data.message ||
          "Obra social eliminada correctamente."
      );
    } catch (error) {
      console.error(
        "Error eliminando obra social:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la obra social."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F5EF] px-4 py-6 text-[#263F3B] sm:px-6 md:px-10 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#8FA07F]">
              Configuración
            </p>

            <h1 className="mt-2 font-serif text-4xl font-medium md:text-5xl">
              Obras Sociales
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B7774]">
              Administrá las obras sociales con las que
              trabaja el consultorio y elegí cuáles se
              muestran en el sitio público.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (showForm) {
                closeForm();
                return;
              }

              resetForm();
              setShowForm(true);
            }}
            className="inline-flex min-h-10 items-center justify-center gap-2 bg-[#263F3B] px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#1D302D]"
          >
            <Plus className="h-4 w-4" />

            {showForm
              ? "Cerrar"
              : "Nueva obra social"}
          </button>
        </header>

        {showForm && (
          <section className="border border-[#DED9CD] bg-white p-7">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-[#A2B38B]">
                {editingId
                  ? "Editando obra social"
                  : "Nueva obra social"}
              </p>

              <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#6B7774]">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(event) =>
                    setVisible(event.target.checked)
                  }
                  className="h-4 w-4 accent-[#6F855F]"
                />

                Visible
              </label>
            </div>

            <div className="grid gap-7 md:grid-cols-[minmax(260px,1fr)_minmax(280px,1fr)]">
              <div>
                <label
                  htmlFor="health-insurance-name"
                  className="block text-[11px] font-bold uppercase tracking-[0.3em] text-[#A2B38B]"
                >
                  Nombre
                </label>

                <input
                  id="health-insurance-name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Ejemplo: OSDE"
                  className="mt-3 w-full border border-[#DED9CD] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#6F855F]"
                />
              </div>

              <ImageUploader
                value={logo}
                onChange={setLogo}
                aspect={1}
                label="Logo"
                emptyText="Subir logo"
                previewAlt={
                  name || "Logo de obra social"
                }
                previewClassName="h-full w-full object-contain p-4"
              />
            </div>

            <div className="mt-7 flex justify-end gap-3 border-t border-[#DED9CD] pt-6">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="border border-[#DED9CD] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5F6F6B] transition hover:bg-[#F7F5EF] disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={saveHealthInsurance}
                disabled={saving || !name.trim()}
                className="inline-flex items-center justify-center gap-2 bg-[#263F3B] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#1D302D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />

                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Guardar cambios"
                    : "Guardar obra social"}
              </button>
            </div>
          </section>
        )}

        {loading ? (
          <section className="border border-[#DED9CD] bg-white p-10 text-center text-sm text-[#6B7774]">
            Cargando obras sociales...
          </section>
        ) : healthInsurances.length === 0 ? (
          <section className="border border-dashed border-[#DED9CD] bg-white px-6 py-14 text-center">
            <h2 className="font-serif text-3xl">
              Todavía no hay obras sociales
            </h2>

            <p className="mt-2 text-sm text-[#6B7774]">
              Creá la primera obra social para mostrarla
              luego en el sitio público.
            </p>
          </section>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {healthInsurances.map(
              (item, index) => (
                <article
                  key={item.id}
                  className="border border-[#DED9CD] bg-white p-6"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-[#A2B38B]">
                      #{index + 1}
                    </span>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                          item.visible
                            ? "text-[#6F855F]"
                            : "text-gray-400"
                        }`}
                      >
                        {item.visible
                          ? "Visible"
                          : "Oculto"}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          void deleteHealthInsurance(
                            item
                          )
                        }
                        disabled={
                          deletingId === item.id
                        }
                        title="Eliminar obra social"
                        aria-label={`Eliminar ${item.name}`}
                        className="transition hover:opacity-70 disabled:opacity-50"
                      >
                        <Trash2 className="h-[15px] w-[15px] text-red-400" />
                      </button>
                    </div>
                  </div>

                  <div className="flex min-h-40 items-center justify-center border border-[#E7E2D8] bg-[#FCFBF8] p-5">
                    {item.logo ? (
                      <img
                        src={item.logo}
                        alt={item.name}
                        className="max-h-24 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-sm text-[#9A9F9D]">
                        Sin logo
                      </span>
                    )}
                  </div>

                  <h2 className="mt-5 text-center font-serif text-2xl font-medium">
                    {item.name}
                  </h2>

                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        startEdit(item)
                      }
                      className="inline-flex items-center gap-2 border border-[#DED9CD] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition hover:bg-[#F7F5EF]"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </button>
                  </div>
                </article>
              )
            )}
          </section>
        )}
      </div>
    </main>
  );
}