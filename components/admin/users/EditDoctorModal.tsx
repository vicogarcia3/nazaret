"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import type {
  Branch,
  DoctorFormValues,
  UserItem,
} from "@/components/admin/users/types";

type EditDoctorModalProps = {
  open: boolean;
  user: UserItem | null;
  branches: Branch[];
  onClose: () => void;
  onSaved: () => void;
};

const EMPTY_FORM: DoctorFormValues = {
  name: "",
  email: "",
  specialty: "",
  professionalLicense: "",
  description: "",
  photo: "",
  active: true,
  branchIds: [],
};

function generatePassword(name?: string) {
  const random = Math.floor(1000 + Math.random() * 9000);

  const firstName =
    name
      ?.trim()
      .split(" ")[0]
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z]/g, "")
      .toLowerCase() || "usuario";

  return `${firstName}${random}`;
}

export default function EditDoctorModal({
  open,
  user,
  branches,
  onClose,
  onSaved,
}: EditDoctorModalProps) {
  const [form, setForm] = useState<DoctorFormValues>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !user?.doctor) {
      return;
    }

    setForm({
      name: user.name || "",
      email: user.email,
      specialty: user.doctor.specialty || "",
      professionalLicense: user.doctor.professionalLicense || "",
      description: user.doctor.description || "",
      photo: user.doctor.photo || "",
      active: user.doctor.active,
      branchIds: user.doctor.branches.map((branch) => branch.branchId),
    });

    setError("");
  }, [open, user]);

  if (!open || !user?.doctor) {
    return null;
  }

  function closeModal() {
    if (saving || uploadingPhoto) {
      return;
    }

    onClose();
  }

  function toggleBranch(branchId: string) {
    setForm((current) => ({
      ...current,
      branchIds: current.branchIds.includes(branchId)
        ? current.branchIds.filter((id) => id !== branchId)
        : [...current.branchIds, branchId],
    }));
  }

  async function handlePhotoUpload(file: File) {
    try {
      setUploadingPhoto(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "No se pudo subir la imagen.");
      }

      setForm((current) => ({
        ...current,
        photo: data.url,
      }));

      toast.success("Imagen cargada correctamente.");
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo subir la imagen.";

      setError(message);
      toast.error(message);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    if (!user?.doctor) {
      return;
    }
    setError("");

    if (!form.name.trim()) {
      setError("Ingresá el nombre completo.");
      return;
    }

    if (!form.email.trim()) {
      setError("Ingresá el correo electrónico.");
      return;
    }

    if (form.branchIds.length === 0) {
      setError("Seleccioná al menos una sucursal.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/doctors/${user.doctor.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          specialty: form.specialty.trim() || null,
          professionalLicense: form.professionalLicense.trim() || null,
          description: form.description.trim() || null,
          photo: form.photo || null,
          active: form.active,
          branchIds: form.branchIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudieron guardar los cambios."
        );
      }

      toast.success("Especialista actualizado correctamente.");

      onSaved();
      onClose();
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudieron guardar los cambios.";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
    >
      <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto border border-[#DED9CD] bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-6 border-b border-[#DED9CD] bg-white px-7 py-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#A2B38B]">
              Perfil profesional
            </p>

            <h2 className="mt-2 font-serif text-3xl text-[#12302A]">
              Editar especialista
            </h2>

            <p className="mt-2 text-sm text-[#6B7774]">
              Modificá sus datos profesionales, sucursales y acceso.
            </p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={saving || uploadingPhoto}
            className="text-[#6B7774] transition hover:text-[#263F3B] disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-8 p-7">
          {error && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section>
            <SectionTitle
              title="Datos personales"
              description="Información utilizada para identificar al especialista."
            />

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <TextField
                label="Nombre completo"
                value={form.name}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    name: value,
                  }))
                }
              />

              <TextField
                label="Correo electrónico"
                type="email"
                value={form.email}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    email: value,
                  }))
                }
              />
            </div>
          </section>

          <section className="border-t border-[#DED9CD] pt-8">
            <SectionTitle
              title="Perfil profesional"
              description="Información visible dentro del sistema."
            />

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <TextField
                label="Especialidad"
                value={form.specialty}
                placeholder="Ejemplo: Odontología general"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    specialty: value,
                  }))
                }
              />

              <TextField
                label="Matrícula profesional"
                value={form.professionalLicense}
                placeholder="Ejemplo: 12345"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    professionalLicense: value,
                  }))
                }
              />

              <label className="flex items-center justify-between border border-[#DED9CD] px-4 py-3 md:col-span-2">
                <span>
                  <span className="block text-sm font-medium text-[#12302A]">
                    Especialista activo
                  </span>
                  <span className="mt-1 block text-xs text-[#6B7774]">
                    Podrá ingresar y utilizar su portal.
                  </span>
                </span>

                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      active: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[#263F3B]"
                />
              </label>
            </div>

            <div className="mt-5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                Descripción
              </label>

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={4}
                className="mt-2 w-full resize-none border border-[#DED9CD] bg-white p-3 outline-none transition focus:border-[#263F3B]"
                placeholder="Experiencia, formación o presentación profesional..."
              />
            </div>

            <div className="mt-5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                Foto
              </label>

              <div className="mt-2 flex flex-col gap-4 border border-[#DED9CD] p-4 sm:flex-row sm:items-center">
                {form.photo ? (
                  <img
                    src={form.photo}
                    alt="Vista previa"
                    className="h-20 w-20 rounded-full border border-[#DED9CD] object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F1F4EC] text-[#A2B38B]">
                    <UserRound className="h-7 w-7" />
                  </div>
                )}

                <div>
                  <label className="inline-flex cursor-pointer items-center gap-2 bg-[#263F3B] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#1D302D]">
                    {uploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}

                    {uploadingPhoto ? "Subiendo" : "Subir imagen"}

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingPhoto}
                      onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (file) {
                          handlePhotoUpload(file);
                        }

                        event.target.value = "";
                      }}
                    />
                  </label>

                  {form.photo && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          photo: "",
                        }))
                      }
                      className="ml-3 text-sm text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-[#DED9CD] pt-8">
            <SectionTitle
              title="Sucursales"
              description="Seleccioná las sedes donde atenderá."
            />

            <div className="mt-5 grid gap-3">
              {branches.map((branch) => {
                const selected = form.branchIds.includes(branch.id);

                return (
                  <label
                    key={branch.id}
                    className={`flex cursor-pointer items-start justify-between gap-4 border p-4 transition ${
                      selected
                        ? "border-[#A2B38B] bg-[#F4F6F0]"
                        : "border-[#DED9CD] bg-white hover:border-[#A2B38B]"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-[#12302A]">
                        {branch.name}
                      </p>

                      <p className="mt-1 text-sm text-[#6B7774]">
                        {branch.address}, {branch.city}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleBranch(branch.id)}
                      className="mt-1 h-4 w-4 accent-[#263F3B]"
                    />
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        <footer className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-[#DED9CD] bg-white p-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeModal}
            disabled={saving || uploadingPhoto}
            className="border border-[#DED9CD] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] transition hover:bg-[#F7F5EF] disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploadingPhoto}
            className="flex items-center justify-center gap-2 bg-[#263F3B] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1D302D] disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar cambios
          </button>
        </footer>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none transition focus:border-[#263F3B]"
      />
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="font-serif text-2xl text-[#12302A]">
        {title}
      </h3>

      <p className="mt-1 text-sm text-[#6B7774]">
        {description}
      </p>
    </div>
  );
}
