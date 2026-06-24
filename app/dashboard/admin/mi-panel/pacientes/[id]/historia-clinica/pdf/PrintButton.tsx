"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded bg-[#A2B38B] px-5 py-3 text-white hover:bg-[#8FA178]"
    >
      Descargar / guardar PDF
    </button>
  );
}