"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Clock, WalletCards } from "lucide-react";
import { toast } from "sonner";

type Payment = {
  id: string;
  amount: number;
  concept: string | null;
  status: "PENDING" | "PAID";
  dueDate: string;
  paidAt: string | null;
};

type Filter = "ALL" | "PENDING" | "PAID";

function money(value: number) {
  return `$${Number(value).toLocaleString("es-AR")}`;
}

export default function PatientPagosPage() {
  async function handlePay(paymentId: string) {
    const res = await fetch(`/api/patient/payments/${paymentId}/checkout`, {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok || !data.initPoint) {
      toast.error("No se pudo iniciar el pago.");
      return;
    }

    window.location.href = data.initPoint;
  }
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    fetch("/api/patient/payments")
      .then((res) => res.json())
      .then((data) => setPayments(Array.isArray(data) ? data : []));
  }, []);

  const pending = payments.filter((p) => p.status === "PENDING");
  const paid = payments.filter((p) => p.status === "PAID");

  const filteredPayments = payments.filter((payment) => {
    if (filter === "ALL") return true;
    return payment.status === filter;
  });

  const pendingTotal = pending.reduce((acc, p) => acc + Number(p.amount), 0);
  const paidTotal = paid.reduce((acc, p) => acc + Number(p.amount), 0);

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-4xl text-[#173b33]">Mis pagos</h1>
          <p className="mt-2 text-[#6c7b72]">
            Consultá tus pagos pendientes y realizados.
          </p>
        </div>

        <div className="flex w-fit border border-[#D8D2C4] bg-white">
            {[
              { key: "ALL", label: "Todos" },
              { key: "PENDING", label: "Pendientes" },
              { key: "PAID", label: "Pagados" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key as Filter)}
                className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                  filter === item.key
                    ? "bg-[#6F855F] text-white"
                    : "text-[#263F3B] hover:bg-[#F0EDE6]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <SummaryCard title="Pendiente de pago" value={money(pendingTotal)} icon={<Clock size={20} />} />
        <SummaryCard title="Pagado" value={money(paidTotal)} icon={<CheckCircle2 size={20} />} />
      </div>

      <div className="mt-8 space-y-4">
        {filteredPayments.length === 0 && (
          <div className="border border-[#d8d2c4] bg-white p-8 text-[#6c7b72]">
            No hay pagos para este filtro.
          </div>
        )}

        {filteredPayments.map((payment) => {
          const dueDate = new Date(payment.dueDate);
          const paidAt = payment.paidAt ? new Date(payment.paidAt) : null;

          return (
            <div key={payment.id} className="border border-[#d8d2c4] bg-white p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    {payment.status === "PAID" ? "Pagado" : "Pendiente"}
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold text-[#173b33]">
                    {payment.concept || "Pago del consultorio"}
                  </h2>
                </div>

                <p className="text-sm text-[#6c7b72]">
                  Vence el{" "}
                  {dueDate.toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <InfoCard icon={<WalletCards size={18} />} title="Monto" value={money(payment.amount)} strong />
                <InfoCard icon={<CalendarDays size={18} />} title="Vencimiento" value={dueDate.toLocaleDateString("es-AR")} />
                <InfoCard icon={payment.status === "PAID" ? <CheckCircle2 size={18} /> : <Clock size={18} />} title="Estado" value={payment.status === "PAID" ? "Pagado" : "Pendiente"} strong />
                <InfoCard icon={<CalendarDays size={18} />} title="Fecha de pago" value={paidAt ? paidAt.toLocaleDateString("es-AR") : "-"} />
              </div>

              {payment.status === "PENDING" && (
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handlePay(payment.id)}
                    className="bg-[#7A8968] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#53614B]"
                  >
                    Pagar online
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="border border-[#d8d2c4] bg-white p-6">
      <div className="mb-3 text-[#A2B38B]">{icon}</div>
      <p className="text-sm text-[#6c7b72]">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-[#173b33]">{value}</p>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  value,
  strong = false,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="border border-[#d8d2c4] p-4">
      <div className="mb-2 text-[#A2B38B]">{icon}</div>
      <p className="font-semibold text-[#173b33]">{title}</p>
      <p className={`text-sm ${strong ? "font-semibold text-[#173b33]" : "text-[#6c7b72]"}`}>
        {value}
      </p>
    </div>
  );
}