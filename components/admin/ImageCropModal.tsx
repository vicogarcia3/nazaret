"use client";

import { useCallback, useState } from "react";
import Cropper, {
  type Area,
  type Point,
} from "react-easy-crop";
import { Check, Loader2, X } from "lucide-react";

import { createCroppedImage } from "@/lib/cropImage";

type ImageCropModalProps = {
  imageSource: string;
  aspect?: number;
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void> | void;
};

export default function ImageCropModal({
  imageSource,
  aspect = 1,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);
  const [cropAreaPixels, setCropAreaPixels] =
    useState<Area | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCropAreaPixels(croppedAreaPixels);
    },
    []
  );

  async function confirmCrop() {
    if (!cropAreaPixels || saving) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const croppedFile = await createCroppedImage(
        imageSource,
        cropAreaPixels,
        `imagen-${Date.now()}.jpg`
      );

      await onConfirm(croppedFile);
    } catch (cropError) {
      console.error("Error al recortar la imagen:", cropError);

      setError(
        cropError instanceof Error
          ? cropError.message
          : "No se pudo recortar la imagen."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Ajustar imagen"
    >
      <div className="w-full max-w-3xl overflow-hidden bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#DED9CD] px-6 py-4">
          <div>
            <h2 className="font-serif text-2xl text-[#263F3B]">
              Ajustar imagen
            </h2>

            <p className="mt-1 text-sm text-[#6B7774]">
              Mové la imagen y usá el zoom hasta que quede como
              querés.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            aria-label="Cerrar recortador"
            className="flex h-10 w-10 items-center justify-center border border-[#DED9CD] text-[#263F3B] transition hover:bg-[#F7F5EF] disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative h-[420px] bg-[#171A19]">
          <Cropper
            image={imageSource}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            showGrid
            objectFit="contain"
          />
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label
                htmlFor="image-crop-zoom"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]"
              >
                Zoom
              </label>

              <span className="text-xs text-[#6B7774]">
                {zoom.toFixed(1)}x
              </span>
            </div>

            <input
              id="image-crop-zoom"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) =>
                setZoom(Number(event.target.value))
              }
              className="w-full accent-[#263F3B]"
            />
          </div>

          {error && (
            <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-[#DED9CD] pt-5">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="border border-[#DED9CD] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] transition hover:bg-[#F7F5EF] disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={confirmCrop}
              disabled={!cropAreaPixels || saving}
              className="flex items-center gap-2 bg-[#263F3B] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1D302D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}

              {saving ? "Procesando..." : "Usar imagen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}