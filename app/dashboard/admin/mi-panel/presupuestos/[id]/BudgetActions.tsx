"use client";

type Props = {
  whatsappUrl: string;
};

export default function BudgetActions({ whatsappUrl }: Props) {
  return (
    <div className="no-print flex gap-3">
      <button
        onClick={() => window.print()}
        className="rounded bg-[#A2B38B] px-5 py-3 text-white hover:bg-[#8FA178]"
      >
        Descargar PDF
      </button>

      <a
        href={whatsappUrl}
        target="_blank"
        className="rounded bg-green-600 px-5 py-3 text-white hover:bg-green-700"
      >
        Enviar por WhatsApp
      </a>
    </div>
  );
}