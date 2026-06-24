"use client";

import { useEffect, useState } from "react";

type Payment = {
  id: string;
  amount: number;
  concept: string | null;
  status: "PENDING" | "PAID";
  dueDate: string;
  paidAt: string | null;
};

export default function PatientPagosPage() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    fetch("/api/patient/payments")
      .then((res) => res.json())
      .then((data) => {
        setPayments(Array.isArray(data) ? data : []);
      });
  }, []);

  const pending = payments.filter((payment) => payment.status === "PENDING");
  const paid = payments.filter((payment) => payment.status === "PAID");

  const pendingTotal = pending.reduce((acc, payment) => acc + payment.amount, 0);
  const paidTotal = paid.reduce((acc, payment) => acc + payment.amount, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Mis pagos</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-gray-500">Pendiente de pago</p>
          <p className="mt-2 text-3xl font-bold">
            ${pendingTotal.toLocaleString("es-AR")}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-gray-500">Pagado</p>
          <p className="mt-2 text-3xl font-bold">
            ${paidTotal.toLocaleString("es-AR")}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {payments.map((payment) => (
          <div key={payment.id} className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              {payment.concept || "Pago del consultorio"}
            </h2>

            <p className="mt-2">
              Monto: ${payment.amount.toLocaleString("es-AR")}
            </p>

            <p>
              Vencimiento:{" "}
              {new Date(payment.dueDate).toLocaleDateString("es-AR")}
            </p>

            <p className="mt-2">
              Estado:{" "}
              <span
                className={
                  payment.status === "PAID"
                    ? "font-medium text-green-600"
                    : "font-medium text-yellow-600"
                }
              >
                {payment.status === "PAID" ? "Pagado" : "Pendiente"}
              </span>
            </p>

            {payment.paidAt && (
              <p className="text-sm text-gray-500">
                Pagado el: {new Date(payment.paidAt).toLocaleDateString("es-AR")}
              </p>
            )}
          </div>
        ))}

        {payments.length === 0 && (
          <p className="text-gray-500">Todavía no tenés pagos registrados.</p>
        )}
      </div>
    </div>
  );
}