"use client";

import { useEffect, useState } from "react";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  branch: {
    name: string;
    address: string;
    city: string;
  };
};

type Payment = {
  id: string;
  amount: number;
  concept: string | null;
  status: "PENDING" | "PAID";
  dueDate: string;
  paidAt: string | null;
  patient: Patient;
};

export default function IngresosPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "PAID" | "LATE">("ALL");

  const [form, setForm] = useState({
    patientId: "",
    amount: "",
    concept: "",
    dueDate: "",
    status: "PENDING",
  });

  async function loadPayments() {
    const res = await fetch("/api/payments");
    const data = await res.json();
    setPayments(data);
  }

  async function loadPatients() {
    const res = await fetch("/api/patients");
    const data = await res.json();
    setPatients(data);
  }

  useEffect(() => {
    loadPayments();
    loadPatients();
  }, []);

  function isLate(payment: Payment) {
    return payment.status === "PENDING" && new Date(payment.dueDate) < new Date();
  }

  function getVisiblePayments() {
    if (filter === "ALL") return payments;
    if (filter === "LATE") return payments.filter(isLate);
    return payments.filter((payment) => payment.status === filter);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await fetch("/api/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    setForm({
      patientId: "",
      amount: "",
      concept: "",
      dueDate: "",
      status: "PENDING",
    });

    loadPayments();
  }

  async function markAsPaid(payment: Payment) {
    await fetch(`/api/payments/${payment.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: payment.amount,
        concept: payment.concept,
        dueDate: payment.dueDate,
        status: "PAID",
      }),
    });

    loadPayments();
  }

  function getWhatsappLink(payment: Payment) {
    const phone = payment.patient.phone.replace(/\D/g, "");

    const month = new Date(payment.dueDate).toLocaleDateString("es-AR", {
      month: "long",
    });

    const message = `Hola ${payment.patient.firstName}, te recordamos que tenés un pago pendiente en Consultorios Nazaret por $${payment.amount}. Por favor, regularizalo cuando puedas. Muchas gracias.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  const visiblePayments = getVisiblePayments();

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Ingresos</h1>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-white p-6 shadow space-y-4"
      >
        <select
          className="w-full rounded border p-3"
          value={form.patientId}
          onChange={(e) => setForm({ ...form, patientId: e.target.value })}
          required
        >
          <option value="">Seleccionar paciente</option>

          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.lastName}, {patient.firstName} — {patient.branch.name} -{" "}
              {patient.branch.address}
            </option>
          ))}
        </select>

        <input
          type="number"
          className="w-full rounded border p-3"
          placeholder="Monto"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />

        <input
          className="w-full rounded border p-3"
          placeholder="Concepto"
          value={form.concept}
          onChange={(e) => setForm({ ...form, concept: e.target.value })}
        />

        <input
          type="date"
          className="w-full rounded border p-3"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          required
        />

        <select
          className="w-full rounded border p-3"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="PENDING">Pendiente</option>
          <option value="PAID">Pagado</option>
        </select>

        <button className="rounded bg-[#A2B38B] px-5 py-3 text-white hover:bg-[#8FA178]">
          Registrar ingreso
        </button>
      </form>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => setFilter("ALL")} className="rounded bg-gray-200 px-4 py-2">
          Todos
        </button>
        <button onClick={() => setFilter("PENDING")} className="rounded bg-yellow-100 px-4 py-2">
          Pendientes
        </button>
        <button onClick={() => setFilter("PAID")} className="rounded bg-green-100 px-4 py-2">
          Pagados
        </button>
        <button onClick={() => setFilter("LATE")} className="rounded bg-red-100 px-4 py-2">
          Demorados
        </button>
      </div>

      <div className="grid gap-4">
        {visiblePayments.map((payment) => (
          <div
            key={payment.id}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {payment.patient.lastName}, {payment.patient.firstName}
                </h2>

                <p className="text-gray-500">
                  {payment.patient.branch.name} — {payment.patient.branch.address}
                </p>

                <p className="mt-2">
                  Concepto: {payment.concept || "Sin concepto"}
                </p>

                <p>Monto: ${payment.amount}</p>

                <p>
                  Vencimiento:{" "}
                  {new Date(payment.dueDate).toLocaleDateString("es-AR")}
                </p>

                <p className="mt-2">
                  Estado:{" "}
                  {payment.status === "PAID" ? (
                    <span className="text-green-600">Pagado</span>
                  ) : isLate(payment) ? (
                    <span className="text-red-600">Demorado</span>
                  ) : (
                    <span className="text-yellow-600">Pendiente</span>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {payment.status === "PENDING" && (
                <button
                  onClick={() => markAsPaid(payment)}
                  className="rounded bg-[#A2B38B] px-4 py-2 text-white hover:bg-[#8FA178]"
                >
                  Marcar como pagado
                </button>
              )}

              {isLate(payment) && (
                <a
                  href={getWhatsappLink(payment)}
                  target="_blank"
                  className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  Enviar WhatsApp
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}