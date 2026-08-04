"use client";

import { useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  Loader2,
  Trash2,
} from "lucide-react";

import ImageCropModal from "@/components/admin/ImageCropModal";

type ImageUploaderProps = {
  value: string;
  onChange: (url: string) => void;
  aspect?: number;
  label?: string;
  emptyText?: string;
  previewAlt?: string;
  previewClassName?: string;
};

export default function ImageUploader({
  value,
  onChange,
  aspect = 1,
  label = "Foto",
  emptyText = "Seleccionar imagen",
  previewAlt = "Vista previa",
  previewClassName = "h-28 w-28 object-cover",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [cropSource, setCropSource] = useState<string | null>(
    null
  );

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (cropSource?.startsWith("blob:")) {
        URL.revokeObjectURL(cropSource);
      }
    };
  }, [cropSource]);

  function closeCropper() {
    if (cropSource?.startsWith("blob:")) {
      URL.revokeObjectURL(cropSource);
    }

    setCropSource(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function selectFile(file: File | undefined) {
    if (!file) {
      return;
    }

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("El archivo seleccionado no es una imagen.");
      return;
    }

    const maximumSize = 10 * 1024 * 1024;

    if (file.size > maximumSize) {
      setError("La imagen no puede superar los 10 MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCropSource(objectUrl);
  }

  async function deleteStoredImage(url: string) {
    if (
      !url ||
      !url.startsWith("https://") ||
      !url.includes(".public.blob.vercel-storage.com/")
    ) {
      return;
    }

    const response = await fetch("/api/upload/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "No se pudo eliminar la imagen anterior."
      );
    }
  }

  async function uploadCroppedFile(file: File) {
    try {
      setUploading(true);
      setError("");

      const previousImageUrl = value;

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(
          data.error || "No se pudo subir la imagen."
        );
      }

      onChange(data.url);
      closeCropper();

      if (
        previousImageUrl &&
        previousImageUrl !== data.url
      ) {
        try {
          await deleteStoredImage(previousImageUrl);
        } catch (deleteError) {
          console.error(
            "La nueva imagen se guardó, pero no se pudo eliminar la anterior:",
            deleteError
          );
        }
      }
    } catch (uploadError) {
      console.error("Error al subir imagen:", uploadError);

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo subir la imagen."
      );

      throw uploadError;
    } finally {
      setUploading(false);
    }
  }

  async function removeImage() {
    if (!value || uploading) {
      return;
    }

    try {
      setUploading(true);
      setError("");

      await deleteStoredImage(value);

      onChange("");
    } catch (removeError) {
      console.error("Error al eliminar imagen:", removeError);

      setError(
        removeError instanceof Error
          ? removeError.message
          : "No se pudo eliminar la imagen."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
          {label}
        </p>

        <div className="flex flex-wrap items-start gap-6">
          <div
            className={`flex shrink-0 items-center justify-center overflow-hidden border border-[#DED9CD] bg-[#E4E8E0] text-[#8A9A87] ${
                aspect === 1
                ? "h-28 w-28"
                : "aspect-[16/7] w-full max-w-md"
            }`}
            >
            {value ? (
              <img
                src={value}
                alt={previewAlt}
                className={previewClassName}
              />
            ) : (
              <ImagePlus className="h-8 w-8" />
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 border border-[#DED9CD] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] transition hover:bg-[#F7F5EF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}

              {uploading
                ? "Subiendo..."
                : value
                  ? "Cambiar foto"
                  : emptyText}
            </button>

            {value && (
              <button
                type="button"
                onClick={removeImage}
                disabled={uploading}
                className="flex items-center gap-2 border border-[#D8CACA] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B06B6B] transition hover:bg-[#FAF3F3] disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar foto
              </button>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(event) => {
                selectFile(event.target.files?.[0]);
              }}
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      {cropSource && (
        <ImageCropModal
          imageSource={cropSource}
          aspect={aspect}
          onCancel={closeCropper}
          onConfirm={uploadCroppedFile}
        />
      )}
    </>
  );
}