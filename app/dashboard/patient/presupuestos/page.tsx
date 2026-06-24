"use client";

import { useEffect, useState } from "react";

type BudgetItem = {
  id: string;
  serviceName: string;
  total: number;
};

type Budget = {
  id: string;
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string;
  doctor: {
    user: {
      name: string;
    };
  };
  items: BudgetItem[];
};

export default function PatientPresupuestosPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    fetch("/api/patient/budgets")
      .then((res) => res.json())
      .then((data) => {
        setBudgets(Array.isArray(data) ? data : []);
      });
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Mis presupuestos</h1>

      <div className="grid gap-4">
        {budgets.map((budget) => (
          <div key={budget.id} className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              {new Date(budget.createdAt).toLocaleDateString("es-AR")}
            </p>

            <h2 className="mt-1 text-xl font-bold">
              Odontólogo: {budget.doctor.user.name}
            </h2>

            <div className="mt-4 space-y-2">
              {budget.items.map((item) => (
                <div key={item.id} className="flex justify-between rounded bg-gray-50 p-3">
                  <span>{item.serviceName}</span>
                  <span>${item.total.toLocaleString("es-AR")}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 text-right">
              <p>Subtotal: ${budget.subtotal.toLocaleString("es-AR")}</p>
              <p>Descuento: {budget.discount}%</p>
              <p className="text-xl font-bold">
                Total: ${budget.total.toLocaleString("es-AR")}
              </p>
            </div>
          </div>
        ))}

        {budgets.length === 0 && (
          <p className="text-gray-500">Todavía no tenés presupuestos cargados.</p>
        )}
      </div>
    </div>
  );
}