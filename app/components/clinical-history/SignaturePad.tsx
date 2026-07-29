"use client";

import { useEffect, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Eraser } from "lucide-react";

type SignaturePadProps = {
  title: string;
  value?: string;
  onChange: (value: string) => void;
};

export default function SignaturePad({
  title,
  value = "",
  onChange,
}: SignaturePadProps) {
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const locallyGeneratedValueRef = useRef("");

  useEffect(() => {
    const signaturePad = signatureRef.current;

    if (!signaturePad) {
      return;
    }

    if (!value) {
      signaturePad.clear();
      locallyGeneratedValueRef.current = "";
      return;
    }

    if (value === locallyGeneratedValueRef.current) {
      return;
    }

    try {
      signaturePad.clear();

      signaturePad.fromDataURL(value, {
        ratio: 1,
        width: 700,
        height: 180,
      });
    } catch (error) {
      console.error("No se pudo cargar la firma guardada:", error);
      signaturePad.clear();
    }
  }, [value]);

  useEffect(() => {
    const canvas = signatureRef.current?.getCanvas();
    const container = containerRef.current;

    if (!canvas || !container) return;

    canvas.width = container.clientWidth;
    canvas.height = 180;
  }, []);

  function saveSignature() {
    const signaturePad = signatureRef.current;

    if (!signaturePad || signaturePad.isEmpty()) {
      locallyGeneratedValueRef.current = "";
      onChange("");
      return;
    }

    const image = signaturePad
      .getCanvas()
      .toDataURL("image/png");

    locallyGeneratedValueRef.current = image;
    onChange(image);
  }

  function clearSignature() {
    const signaturePad = signatureRef.current;

    signaturePad?.clear();
    locallyGeneratedValueRef.current = "";
    onChange("");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
          {title}
        </h3>

        <button
          type="button"
          onClick={clearSignature}
          className="inline-flex items-center gap-2 border border-[#DED9CD] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6B7774] transition hover:border-[#263F3B] hover:text-[#263F3B]"
        >
          <Eraser className="h-3.5 w-3.5" />
          Limpiar
        </button>
      </div>

      <div
        ref={containerRef}
        className="overflow-hidden border border-[#DED9CD] bg-white"
      >
        <SignatureCanvas
          ref={signatureRef}
          penColor="#263F3B"
          minWidth={1}
          maxWidth={2.5}
          velocityFilterWeight={0.7}
          clearOnResize={false}
          onEnd={saveSignature}
          canvasProps={{
            className:
              "block w-full h-[180px] cursor-crosshair bg-white",
          }}
        />
      </div>

      <p className="text-xs text-[#6B7774]">
        Firmar con el mouse, el dedo o un lápiz digital.
      </p>
    </div>
  );
}