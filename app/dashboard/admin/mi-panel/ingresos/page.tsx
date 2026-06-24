"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  const [filter, setFilter] =
    useState<"ALL" | "PENDING" | "PAID" | "LATE">("ALL");

  const [siteName, setSiteName] = useState("Consultorios Nazaret");

  const [form, setForm] = useState({
    patientId: "",
    amount: "",
    concept: "",
    dueDate: "",
    status: "PENDING",
  });

  async function loadData() {
    const [paymentsRes, patientsRes, siteRes] = await Promise.all([
      fetch("/api/payments"),
      fetch("/api/patients"),
      fetch("/api/site-config"),
    ]);

    const paymentsData = await paymentsRes.json();
    const patientsData = await patientsRes.json();
    const siteData = await siteRes.json();

    setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    setPatients(Array.isArray(patientsData) ? patientsData : []);
    setSiteName(siteData?.name || "Consultorios Nazaret");
  }

  useEffect(() => {
    loadData();
  }, []);

  function isLate(payment: Payment) {
    return payment.status === "PENDING" && new Date(payment.dueDate) < new Date();
  }

  const now = new Date();

  const paidPayments = payments.filter((p) => p.status === "PAID");
  const pendingPayments = payments.filter((p) => p.status === "PENDING");
  const latePayments = payments.filter(isLate);

  const totalPaid = paidPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalPending = pendingPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalLate = latePayments.reduce((acc, p) => acc + p.amount, 0);

  const monthlyIncome = paidPayments
    .filter((p) => {
      if (!p.paidAt) return false;

      const date = new Date(p.paidAt);

      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    })
    .reduce((acc, p) => acc + p.amount, 0);

  const monthlyChartData = Array.from({ length: 12 }, (_, index) => {
    const monthPayments = paidPayments.filter((payment) => {
      if (!payment.paidAt) return false;

      const date = new Date(payment.paidAt);

      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === index
      );
    });

    const total = monthPayments.reduce(
      (acc, payment) => acc + payment.amount,
      0
    );

    return {
      month: new Date(now.getFullYear(), index, 1).toLocaleDateString("es-AR", {
        month: "short",
      }),
      total,
    };
  });

  const visiblePayments = payments.filter((payment) => {
    if (filter === "ALL") return true;
    if (filter === "LATE") return isLate(payment);
    return payment.status === filter;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      alert("No se pudo registrar el pago.");
      return;
    }

    setForm({
      patientId: "",
      amount: "",
      concept: "",
      dueDate: "",
      status: "PENDING",
    });

    loadData();
  }

  async function markAsPaid(payment: Payment) {
    const res = await fetch(`/api/payments/${payment.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "PAID",
      }),
    });

    if (!res.ok) {
      alert("No se pudo marcar como pagado.");
      return;
    }

    loadData();
  }

  function getWhatsappLink(payment: Payment) {
    const phone = payment.patient.phone.replace(/\D/g, "");

    const month = new Date(payment.dueDate).toLocaleDateString("es-AR", {
        month: "long",
    });

    const message = `Hola ${payment.patient.firstName}, te recordamos que tenés un pago pendiente en ${siteName} por $${payment.amount.toLocaleString(
      "es-AR"
    )} correspondiente al mes de ${month}. El mismo deberá abonarse entre el 1 y el 10 de cada mes. Muchas gracias.
    
    ${siteName}`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Ingresos</h1>
        <p className="mt-2 text-gray-500">
          Control de pagos realizados, pendientes y demorados.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-gray-500">Ingresos del mes</p>
          <p className="mt-2 text-3xl font-bold">
            ${monthlyIncome.toLocaleString("es-AR")}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-gray-500">Total pagado</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            ${totalPaid.toLocaleString("es-AR")}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-gray-500">Pagos pendientes</p>
          <p className="mt-2 text-3xl font-bold text-yellow-600">
            ${totalPending.toLocaleString("es-AR")}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-gray-500">Pagos demorados</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            ${totalLate.toLocaleString("es-AR")}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl bg-white p-6 shadow"
      >
        <h2 className="text-2xl font-bold">Registrar pago</h2>

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
          Guardar pago
        </button>
      </form>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setFilter("ALL")}
          className="rounded bg-gray-200 px-4 py-2"
        >
          Todos
        </button>

        <button
          onClick={() => setFilter("PAID")}
          className="rounded bg-green-100 px-4 py-2"
        >
          Pagados
        </button>

        <button
          onClick={() => setFilter("PENDING")}
          className="rounded bg-yellow-100 px-4 py-2"
        >
          Pendientes
        </button>

        <button
          onClick={() => setFilter("LATE")}
          className="rounded bg-red-100 px-4 py-2"
        >
          Demorados
        </button>
      </div>

      <div className="grid gap-4">
        {visiblePayments.map((payment) => (
          <div
            key={payment.id}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold">
              {payment.patient.lastName}, {payment.patient.firstName}
            </h2>

            <p className="mt-1 text-gray-500">
              {payment.patient.branch.name} — {payment.patient.branch.address}
            </p>

            <p className="mt-2">
              Concepto: {payment.concept || "Sin concepto"}
            </p>

            <p>Monto: ${payment.amount.toLocaleString("es-AR")}</p>

            <p>
              Vencimiento:{" "}
              {new Date(payment.dueDate).toLocaleDateString("es-AR")}
            </p>

            <p className="mt-2">
              Estado:{" "}
              {payment.status === "PAID" ? (
                <span className="font-medium text-green-600">Pagado</span>
              ) : isLate(payment) ? (
                <span className="font-medium text-red-600">Demorado</span>
              ) : (
                <span className="font-medium text-yellow-600">Pendiente</span>
              )}
            </p>

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

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold">Ingresos por mes</h2>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChartData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) =>
                  `$${Number(value).toLocaleString("es-AR")}`
                }
              />
              <Bar dataKey="total" fill="#A2B38B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

        {visiblePayments.length === 0 && (
          <p className="text-gray-500">No hay pagos para mostrar.</p>
        )}
      </div>
    </div>
  );
}