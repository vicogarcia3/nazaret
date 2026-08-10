"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  Trash2,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type ClinicalImageType =
  | "RADIOGRAPH"
  | "PHOTO"
  | "OTHER";

type ClinicalImage = {
  id: string;
  type: ClinicalImageType;
  title: string;
  description: string | null;
  imageUrl: string;
  takenAt: string | null;
  createdAt: string;
};

type PendingFile = {
  id: string;
  file: File;
  previewUrl: string;
};

type Props = {
  clinicalHistoryId: string;
  initialImages: ClinicalImage[];
};

const TYPE_LABELS: Record<
  ClinicalImageType,
  string
> = {
  RADIOGRAPH: "Radiografía",
  PHOTO: "Fotografía",
  OTHER: "Otro",
};

export default function ClinicalImagesManager({
  clinicalHistoryId,
  initialImages,
}: Props) {
  const router = useRouter();

  const [showForm, setShowForm] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [selectedImage, setSelectedImage] =
    useState<ClinicalImage | null>(
      null
    );

  const [type, setType] =
    useState<ClinicalImageType>(
      "RADIOGRAPH"
    );

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [takenAt, setTakenAt] =
    useState("");

  const [files, setFiles] =
    useState<PendingFile[]>([]);

  useEffect(() => {
    return () => {
      files.forEach((item) => {
        URL.revokeObjectURL(
          item.previewUrl
        );
      });
    };
  }, [files]);

  function resetForm() {
    files.forEach((item) => {
      URL.revokeObjectURL(
        item.previewUrl
      );
    });

    setType("RADIOGRAPH");
    setTitle("");
    setDescription("");
    setTakenAt("");
    setFiles([]);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    resetForm();
    setShowForm(false);
  }

  function handleFileSelection(
    selectedFiles: FileList | null
  ) {
    if (!selectedFiles) {
      return;
    }

    const newFiles =
      Array.from(selectedFiles).map(
        (file) => ({
          id: crypto.randomUUID(),
          file,
          previewUrl:
            URL.createObjectURL(file),
        })
      );

    setFiles((current) => [
      ...current,
      ...newFiles,
    ]);
  }

  function removePendingFile(
    id: string
  ) {
    setFiles((current) => {
      const item =
        current.find(
          (file) => file.id === id
        );

      if (item) {
        URL.revokeObjectURL(
          item.previewUrl
        );
      }

      return current.filter(
        (file) => file.id !== id
      );
    });
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!title.trim()) {
      toast.error(
        "Ingresá un título."
      );
      return;
    }

    if (files.length === 0) {
      toast.error(
        "Seleccioná al menos una imagen."
      );
      return;
    }

    try {
      setSaving(true);

      for (const item of files) {
        const formData =
          new FormData();

        formData.append(
          "file",
          item.file
        );

        const uploadResponse =
          await fetch(
            "/api/upload",
            {
              method: "POST",
              body: formData,
            }
          );

        const uploadData =
          await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(
            uploadData.error ||
              `No se pudo subir ${item.file.name}.`
          );
        }

        const imageTitle =
          files.length === 1
            ? title.trim()
            : `${title.trim()} - ${item.file.name}`;

        const response =
          await fetch(
            "/api/clinical-images",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                clinicalHistoryId,
                type,
                title: imageTitle,
                description:
                  description.trim(),
                takenAt,
                imageUrl:
                  uploadData.url,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              `No se pudo guardar ${item.file.name}.`
          );
        }
      }

      toast.success(
        files.length === 1
          ? "Imagen agregada a la historia clínica."
          : `${files.length} imágenes agregadas a la historia clínica.`
      );

      resetForm();
      setShowForm(false);

      router.refresh();
    } catch (error) {
      console.error(
        "Error cargando imágenes clínicas:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las imágenes."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteImage(
    image: ClinicalImage
  ) {
    const confirmed =
      window.confirm(
        `¿Querés eliminar "${image.title}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(image.id);

      const response =
        await fetch(
          `/api/clinical-images/${image.id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        toast.error(
          data.error ||
            "No se pudo eliminar la imagen."
        );
        return;
      }

      if (
        selectedImage?.id ===
        image.id
      ) {
        setSelectedImage(null);
      }

      toast.success(
        "Imagen eliminada."
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Error eliminando imagen:",
        error
      );

      toast.error(
        "No se pudo eliminar la imagen."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <section className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
              Archivo clínico
            </p>

            <h1 className="mt-2 font-serif text-3xl text-[#263F3B]">
              Imágenes y radiografías
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7774]">
              Guardá radiografías, fotografías y
              otros estudios vinculados a la
              historia clínica del paciente.
            </p>
          </div>

          {!showForm && (
            <button
              type="button"
              onClick={() =>
                setShowForm(true)
              }
              className="inline-flex items-center justify-center gap-2 bg-[#263F3B] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1D302D]"
            >
              <ImagePlus className="h-4 w-4" />
              Agregar imagen
            </button>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="border border-[#DED9CD] bg-white p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                  Nuevo archivo
                </p>

                <h2 className="mt-1 font-serif text-2xl text-[#263F3B]">
                  Agregar imagen clínica
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="text-[#6B7774] transition hover:text-[#263F3B] disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6F855F]">
                  Tipo
                </span>

                <select
                  value={type}
                  onChange={(event) =>
                    setType(
                      event.target
                        .value as ClinicalImageType
                    )
                  }
                  className="mt-2 w-full border border-[#DED9CD] bg-white px-3 py-3 text-sm text-[#263F3B] outline-none focus:border-[#A2B38B]"
                >
                  <option value="RADIOGRAPH">
                    Radiografía
                  </option>

                  <option value="PHOTO">
                    Fotografía
                  </option>

                  <option value="OTHER">
                    Otro
                  </option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6F855F]">
                  Fecha del estudio
                </span>

                <input
                  type="date"
                  value={takenAt}
                  onChange={(event) =>
                    setTakenAt(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full border border-[#DED9CD] bg-white px-3 py-3 text-sm text-[#263F3B] outline-none focus:border-[#A2B38B]"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6F855F]">
                  Título
                </span>

                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  placeholder="Ej. Radiografía panorámica"
                  className="mt-2 w-full border border-[#DED9CD] bg-white px-3 py-3 text-sm text-[#263F3B] outline-none focus:border-[#A2B38B]"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6F855F]">
                  Observaciones
                </span>

                <textarea
                  rows={3}
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Descripción u observaciones clínicas..."
                  className="mt-2 w-full resize-none border border-[#DED9CD] bg-white px-3 py-3 text-sm text-[#263F3B] outline-none focus:border-[#A2B38B]"
                />
              </label>

              <div className="md:col-span-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6F855F]">
                    Archivos
                  </span>

                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      handleFileSelection(
                        event.target.files
                      )
                    }
                    className="mt-2 block w-full border border-[#DED9CD] bg-[#F7F5EF] px-3 py-3 text-sm text-[#263F3B]"
                  />
                </label>

                <p className="mt-2 text-xs text-[#87918E]">
                  Podés seleccionar una o varias imágenes. Formatos permitidos: JPG, PNG y WebP. Tamaño máximo por archivo: 10 MB.
                </p>

                {files.length > 0 && (
                  <div className="mt-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6F855F]">
                        Archivos seleccionados
                      </p>

                      <span className="text-xs text-[#87918E]">
                        {files.length}{" "}
                        {files.length === 1
                          ? "imagen"
                          : "imágenes"}
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {files.map((item) => (
                        <div
                          key={item.id}
                          className="relative overflow-hidden border border-[#DED9CD] bg-white"
                        >
                          <div className="aspect-[4/3] overflow-hidden bg-[#F1EFE8]">
                            <img
                              src={item.previewUrl}
                              alt={item.file.name}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removePendingFile(
                                item.id
                              )
                            }
                            disabled={saving}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center bg-white/95 text-[#B45F5F] shadow transition hover:bg-white disabled:opacity-50"
                            title="Quitar imagen"
                          >
                            <X className="h-4 w-4" />
                          </button>

                          <div className="p-3">
                            <p className="truncate text-xs font-medium text-[#263F3B]">
                              {item.file.name}
                            </p>

                            <p className="mt-1 text-[10px] text-[#87918E]">
                              {(
                                item.file.size /
                                1024 /
                                1024
                              ).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="border border-[#DED9CD] bg-white px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#263F3B] transition hover:bg-[#F7F5EF] disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="bg-[#263F3B] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1D302D] disabled:opacity-50"
              >
                {saving
                  ? "Guardando..."
                  : files.length > 1
                  ? `Guardar ${files.length} imágenes`
                  : "Guardar imagen"}
              </button>
            </div>
          </form>
        )}

        {initialImages.length === 0 ? (
          <div className="border border-dashed border-[#CFC9BC] bg-white px-8 py-16 text-center">
            <ImagesEmptyIcon />

            <h2 className="mt-4 font-serif text-2xl text-[#263F3B]">
              Todavía no hay imágenes cargadas
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#6B7774]">
              Las radiografías y fotografías del
              paciente van a aparecer acá una vez
              cargadas.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {initialImages.map(
              (image) => (
                <article
                  key={image.id}
                  className="overflow-hidden border border-[#DED9CD] bg-white"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImage(
                        image
                      )
                    }
                    className="block aspect-[4/3] w-full overflow-hidden bg-[#F1EFE8]"
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.title}
                      className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
                    />
                  </button>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#A2B38B]">
                          {
                            TYPE_LABELS[
                              image.type
                            ]
                          }
                        </span>

                        <h3 className="mt-2 font-serif text-xl text-[#263F3B]">
                          {image.title}
                        </h3>
                      </div>
                    </div>

                    {image.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#6B7774]">
                        {image.description}
                      </p>
                    )}

                    <div className="mt-4 text-xs text-[#87918E]">
                      {image.takenAt ? (
                        <span>
                          Estudio:{" "}
                          {new Date(
                            image.takenAt
                          ).toLocaleDateString(
                            "es-AR"
                          )}
                        </span>
                      ) : (
                        <span>
                          Cargada:{" "}
                          {new Date(
                            image.createdAt
                          ).toLocaleDateString(
                            "es-AR"
                          )}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#EEEAE1] pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedImage(
                            image
                          )
                        }
                        className="inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#6F855F]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver imagen
                      </button>

                      <button
                        type="button"
                        disabled={
                          deletingId ===
                          image.id
                        }
                        onClick={() =>
                          deleteImage(
                            image
                          )
                        }
                        className="inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#B45F5F] disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />

                        {deletingId ===
                        image.id
                          ? "Eliminando..."
                          : "Eliminar"}
                      </button>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={() =>
            setSelectedImage(null)
          }
        >
          <div
            className="relative max-h-[95vh] w-full max-w-6xl overflow-auto bg-white p-4"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              onClick={() =>
                setSelectedImage(null)
              }
              className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center bg-white/90 text-[#263F3B] shadow"
            >
              <X className="h-5 w-5" />
            </button>

            <img
              src={
                selectedImage.imageUrl
              }
              alt={
                selectedImage.title
              }
              className="mx-auto max-h-[75vh] w-auto max-w-full object-contain"
            />

            <div className="mx-auto max-w-4xl px-2 pb-3 pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A2B38B]">
                {
                  TYPE_LABELS[
                    selectedImage.type
                  ]
                }
              </p>

              <h2 className="mt-2 font-serif text-2xl text-[#263F3B]">
                {selectedImage.title}
              </h2>

              {selectedImage.description && (
                <p className="mt-3 text-sm leading-6 text-[#6B7774]">
                  {
                    selectedImage.description
                  }
                </p>
              )}

              {selectedImage.takenAt && (
                <p className="mt-3 text-xs text-[#87918E]">
                  Fecha del estudio:{" "}
                  {new Date(
                    selectedImage.takenAt
                  ).toLocaleDateString(
                    "es-AR"
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ImagesEmptyIcon() {
  return (
    <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[#D8D3C8] text-[#A2B38B]">
      <ImagePlus className="h-5 w-5" />
    </div>
  );
}