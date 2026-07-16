"use client";

type Props = {
  paymentId: string;
  whatsappUrl: string;
  sent: boolean;
};

export default function WhatsAppReminderButton({
  paymentId,
  whatsappUrl,
  sent,
}: Props) {
  if (sent) {
    return (
      <span className="bg-[#25D366] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
        Enviado
      </span>
    );
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      onClick={async () => {
        await fetch(`/api/payments/${paymentId}/reminder`, {
          method: "PUT",
        });
      }}
      className="bg-[#25D366] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-[#1EBE5D]"
    >
      Enviar WhatsApp
    </a>
  );
}