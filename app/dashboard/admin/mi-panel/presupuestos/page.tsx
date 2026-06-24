"use client";

import { useEffect, useState } from "react";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  plan: {
    name: string;
    discount: number;
    active: boolean;
  } | null;
};

type Doctor = {
  id: string;
  user: {
    name: string;
  };
};

type BudgetItem = {
  id: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type Budget = {
  id: string;
  description: string | null;
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string;
  patient: Patient;
  doctor: Doctor;
  items: BudgetItem[];
};

export default function PresupuestosPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    items: [
      {
        serviceName: "",
        unitPrice: "",
      },
    ],
  });

  async function loadData() {
    const [patientsRes, doctorsRes, budgetsRes] = await Promise.all([
      fetch("/api/patients"),
      fetch("/api/doctors"),
      fetch("/api/budgets"),
    ]);

    setPatients(await patientsRes.json());
    setDoctors(await doctorsRes.json());
    setBudgets(await budgetsRes.json());
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateItem(
    index: number,
    field: "serviceName" | "unitPrice",
    value: string
  ) {
    const newItems = [...form.items];

    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    setForm({
      ...form,
      items: newItems,
    });
  }

  function addItem() {
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          serviceName: "",
          unitPrice: "",
        },
      ],
    });
  }

  function removeItem(index: number) {
    setForm({
      ...form,
      items: form.items.filter((_, itemIndex) => itemIndex !== index),
    });
  }

  const selectedPatient = patients.find(
    (patient) => patient.id === form.patientId
  );

  const discount =
    selectedPatient?.plan?.active ? selectedPatient.plan.discount : 0;

  const subtotal = form.items.reduce((acc, item) => {
    return acc + Number(item.unitPrice || 0);
  }, 0);

  const total = subtotal - subtotal * (discount / 100);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patientId: form.patientId,
        doctorId: form.doctorId,
        items: form.items,
      }),
    });

    if (!res.ok) {
      alert("No se pudo crear el presupuesto.");
      return;
    }

    setForm({
      patientId: "",
      doctorId: "",
      items: [
        {
          serviceName: "",
          unitPrice: "",
        },
      ],
    });

    loadData();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Presupuestos</h1>
        <p className="mt-2 text-gray-500">
          Creá presupuestos y aplicá descuentos automáticos por plan.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl bg-white p-6 shadow"
      >
        <select
          className="w-full rounded border p-3"
          value={form.patientId}
          onChange={(e) =>
            setForm({ ...form, patientId: e.target.value })
          }
          required
        >
          <option value="">Seleccionar paciente</option>

          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.lastName}, {patient.firstName} - DNI {patient.dni}
            </option>
          ))}
        </select>

        <select
          className="w-full rounded border p-3"
          value={form.doctorId}
          onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
          required
        >
          <option value="">Seleccionar odontólogo</option>

          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.user.name}
            </option>
          ))}
        </select>

        <div className="space-y-3">
          <p className="font-medium">Tratamientos</p>

          {form.items.map((item, index) => (
            <div
              key={index}
              className="grid gap-3 md:grid-cols-[1fr_220px_auto]"
            >
              <textarea
                className="w-full rounded border p-3"
                placeholder="Descripción del tratamiento"
                value={item.serviceName}
                onChange={(e) =>
                  updateItem(index, "serviceName", e.target.value)
                }
                required
              />

              <div className="flex items-center rounded border px-3">
                <span className="mr-2 text-gray-500">$</span>

                <input
                  type="number"
                  className="w-full p-3 outline-none"
                  placeholder="Precio"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(index, "unitPrice", e.target.value)
                  }
                  required
                />
              </div>

              {form.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="rounded bg-[#D97A7A] px-4 py-2 text-white hover:bg-[#C96767]"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
          >
            + Agregar tratamiento
          </button>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <p>
            Plan del paciente:{" "}
            <strong>
              {selectedPatient?.plan ? selectedPatient.plan.name : "Sin plan"}
            </strong>
          </p>

          <p>Subtotal: ${subtotal.toLocaleString("es-AR")}</p>
          <p>Descuento aplicado: {discount}%</p>

          <p className="mt-2 text-xl font-bold">
            Total final: ${total.toLocaleString("es-AR")}
          </p>
        </div>

        <button className="rounded bg-[#A2B38B] px-5 py-3 text-white hover:bg-[#8FA178]">
          Crear presupuesto
        </button>
      </form>

      <div className="grid gap-4">
        {budgets.map((budget) => (
          <div
            key={budget.id}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <h2 className="text-2xl font-bold">
              {budget.patient.lastName}, {budget.patient.firstName}
            </h2>

            <p className="mt-2 text-gray-500">
              Odontólogo: {budget.doctor.user.name}
            </p>

            <div className="mt-4 space-y-2">
              {budget.items?.length > 0 ? (
                budget.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between rounded bg-gray-50 p-3"
                  >
                    <span>{item.serviceName}</span>
                    <span>${item.total.toLocaleString("es-AR")}</span>
                  </div>
                ))
              ) : (
                <p>{budget.description || "Sin descripción"}</p>
              )}
            </div>

            <p className="mt-4">
              Subtotal: ${budget.subtotal.toLocaleString("es-AR")}
            </p>

            <p>Descuento aplicado: {budget.discount}%</p>

            <p className="text-xl font-bold">
              Total: ${budget.total.toLocaleString("es-AR")}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={`/dashboard/admin/mi-panel/presupuestos/${budget.id}`}
                className="rounded bg-[#A2B38B] px-4 py-2 text-white hover:bg-[#8FA178]"
              >
                Ver presupuesto
              </a>

              <a
                href={`/dashboard/admin/mi-panel/presupuestos/${budget.id}`}
                target="_blank"
                className="rounded bg-slate-600 px-4 py-2 text-white hover:bg-slate-700"
              >
                Descargar PDF
              </a>

              <a
                href={`https://wa.me/${budget.patient.phone?.replace(
                  /\D/g,
                  ""
                )}?text=${encodeURIComponent(
                  `Hola ${budget.patient.firstName}, te enviamos tu presupuesto odontológico por un total de $${budget.total.toLocaleString(
                    "es-AR"
                  )}.`
                )}`}
                target="_blank"
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                WhatsApp
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}