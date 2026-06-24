"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded bg-[#A2B38B] px-5 py-3 text-white print:hidden"
    >
      Descargar / Guardar PDF
    </button>
  );
}