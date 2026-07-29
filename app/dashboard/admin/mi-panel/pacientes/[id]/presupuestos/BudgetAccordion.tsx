"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  FileText,
  Landmark,
  Wallet,
} from "lucide-react";
import ViewBudgetPdfButton from "./ViewBudgetPdfButton";
import DeleteBudgetButton from "./DeleteBudgetButton";

type BudgetStatus = "CREATED" | "IN_PROGRESS" | "COMPLETED";

type Payment = {
  id: string;
  amount: number;
  concept: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
};

type Budget = {
  id: string;
  createdAt: string;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  status: BudgetStatus;
  doctorName: string;
  payments: Payment[];
};

type Props = {
  budgets: Budget[];
  branchName: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function getStatusLabel(status: BudgetStatus) {
  if (status === "IN_PROGRESS") return "En proceso";
  if (status === "COMPLETED") return "Completado";

  return "Creado";
}

function getStatusClasses(status: BudgetStatus) {
  if (status === "COMPLETED") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "IN_PROGRESS") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-[#DED9CD] bg-[#F7F5EF] text-[#6B7774]";
}

function StatusIcon({ status }: { status: BudgetStatus }) {
  if (status === "COMPLETED") {
    return <CheckCircle2 className="h-4 w-4" />;
  }

  if (status === "IN_PROGRESS") {
    return <Clock3 className="h-4 w-4" />;
  }

  return <FileText className="h-4 w-4" />;
}

export default function BudgetAccordion({
  budgets,
  branchName,
}: Props) {
  const [openBudgetId, setOpenBudgetId] = useState<string | null>(
    null
  );

  function toggleBudget(budgetId: string) {
    setOpenBudgetId((current) =>
      current === budgetId ? null : budgetId
    );
  }

  if (budgets.length === 0) {
    return (
      <article className="border border-[#DED9CD] bg-white p-8">
        <p className="text-sm text-[#6B7774]">
          Este paciente todavía no tiene presupuestos registrados.
        </p>
      </article>
    );
  }

  return (
    <section className="grid gap-4">
      {budgets.map((budget, index) => {
        const isOpen = openBudgetId === budget.id;

        const progressPercentage =
          budget.total > 0
            ? Math.min(
                Math.round(
                  (budget.paidAmount / budget.total) * 100
                ),
                100
              )
            : 0;

        return (
          <article
            key={budget.id}
            className="overflow-hidden border border-[#DED9CD] bg-white"
          >
            <div className="p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[#A2B38B]">
                      #{budgets.length - index}
                    </span>

                    <FileText className="h-4 w-4 text-[#A2B38B]" />

                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6B7774]">
                      {new Date(
                        budget.createdAt
                      ).toLocaleDateString("es-AR")}
                    </span>
                  </div>

                  <h2 className="mt-3 font-[var(--font-cormorant)] text-2xl font-medium">
                    Presupuesto
                  </h2>

                  <p className="mt-1 text-sm text-[#6B7774]">
                    Profesional: {budget.doctorName}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                    <p>
                      <span className="text-[#6B7774]">
                        Total:
                      </span>{" "}
                      <span className="font-semibold text-[#263F3B]">
                        {formatCurrency(budget.total)}
                      </span>
                    </p>

                    <p>
                      <span className="text-[#6B7774]">
                        Abonado:
                      </span>{" "}
                      <span className="font-semibold text-green-700">
                        {formatCurrency(budget.paidAmount)}
                      </span>
                    </p>

                    <p>
                      <span className="text-[#6B7774]">
                        Pendiente:
                      </span>{" "}
                      <span
                        className={`font-semibold ${
                          budget.remainingAmount > 0
                            ? "text-amber-700"
                            : "text-green-700"
                        }`}
                      >
                        {formatCurrency(budget.remainingAmount)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
                  <span
                    className={`inline-flex items-center gap-2 border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${getStatusClasses(
                      budget.status
                    )}`}
                  >
                    <StatusIcon status={budget.status} />
                    {getStatusLabel(budget.status)}
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleBudget(budget.id)}
                    aria-expanded={isOpen}
                    aria-controls={`budget-details-${budget.id}`}
                    className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#A2B38B] transition hover:text-[#263F3B]"
                  >
                    {isOpen
                      ? "Ocultar detalles"
                      : "Ver detalles"}

                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div
              id={`budget-details-${budget.id}`}
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                isOpen
                  ? "grid-rows-[1fr]"
                  : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-[#DED9CD]">
                  <div className="grid gap-5 border-b border-[#DED9CD] p-6 md:grid-cols-3">
                    <div className="border border-[#DED9CD] bg-[#FFFCF7] p-5">
                      <div className="flex items-center gap-2 text-[#A2B38B]">
                        <CircleDollarSign className="h-4 w-4" />

                        <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                          Total
                        </span>
                      </div>

                      <p className="mt-3 text-xl font-semibold">
                        {formatCurrency(budget.total)}
                      </p>

                      <p className="mt-1 text-xs text-[#6B7774]">
                        Importe total del presupuesto
                      </p>
                    </div>

                    <div className="border border-[#DED9CD] bg-[#FFFCF7] p-5">
                      <div className="flex items-center gap-2 text-[#A2B38B]">
                        <Wallet className="h-4 w-4" />

                        <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                          Abonado
                        </span>
                      </div>

                      <p className="mt-3 text-xl font-semibold text-green-700">
                        {formatCurrency(budget.paidAmount)}
                      </p>

                      <p className="mt-1 text-xs text-[#6B7774]">
                        Total pagado por el paciente
                      </p>
                    </div>

                    <div className="border border-[#DED9CD] bg-[#FFFCF7] p-5">
                      <div className="flex items-center gap-2 text-[#A2B38B]">
                        <Landmark className="h-4 w-4" />

                        <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                          Saldo pendiente
                        </span>
                      </div>

                      <p
                        className={`mt-3 text-xl font-semibold ${
                          budget.remainingAmount > 0
                            ? "text-amber-700"
                            : "text-green-700"
                        }`}
                      >
                        {formatCurrency(
                          budget.remainingAmount
                        )}
                      </p>

                      <p className="mt-1 text-xs text-[#6B7774]">
                        Importe restante por cobrar
                      </p>
                    </div>
                  </div>

                  <div className="border-b border-[#DED9CD] px-6 py-5">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.15em]">
                      <span className="text-[#6B7774]">
                        Progreso de pago
                      </span>

                      <span className="text-[#263F3B]">
                        {progressPercentage}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden bg-[#EDEAE3]">
                      <div
                        className="h-full bg-[#A2B38B] transition-all duration-300"
                        style={{
                          width: `${progressPercentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="border-b border-[#DED9CD] p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-[var(--font-cormorant)] text-xl font-medium">
                          Historial de pagos
                        </h3>

                        <p className="mt-1 text-xs text-[#6B7774]">
                          Cada pago registrado se contabiliza como
                          ingreso en Balance.
                        </p>
                      </div>

                      <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.15em] text-[#A2B38B]">
                        {budget.payments.length}{" "}
                        {budget.payments.length === 1
                          ? "pago"
                          : "pagos"}
                      </span>
                    </div>

                    {budget.payments.length > 0 ? (
                      <div className="mt-5 overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left text-sm">
                          <thead>
                            <tr className="border-b border-[#DED9CD] text-xs font-semibold uppercase tracking-[0.16em] text-[#A2B38B]">
                              <th className="pb-3 pr-4">
                                Fecha
                              </th>
                              <th className="pb-3 pr-4">
                                Medio de pago
                              </th>
                              <th className="pb-3 pr-4">
                                Concepto
                              </th>
                              <th className="pb-3 text-right">
                                Importe
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {budget.payments.map((payment) => (
                              <tr
                                key={payment.id}
                                className="border-b border-[#EDEAE3] last:border-b-0"
                              >
                                <td className="py-4 pr-4">
                                  {new Date(
                                    payment.paidAt ||
                                      payment.createdAt
                                  ).toLocaleDateString("es-AR")}
                                </td>

                                <td className="py-4 pr-4 text-[#6B7774]">
                                  {payment.paymentMethod ||
                                    "Sin especificar"}
                                </td>

                                <td className="py-4 pr-4 text-[#6B7774]">
                                  {payment.concept ||
                                    "Pago de presupuesto"}
                                </td>

                                <td className="py-4 text-right font-semibold">
                                  {formatCurrency(
                                    payment.amount
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="mt-5 border border-dashed border-[#DED9CD] bg-[#FFFCF7] p-5">
                        <p className="text-sm text-[#6B7774]">
                          Todavía no se registraron pagos para
                          este presupuesto.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-[#6B7774]">
                      Sucursal:{" "}
                      <span className="font-medium text-[#263F3B]">
                        {branchName}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-4">
                      <ViewBudgetPdfButton
                        budgetId={budget.id}
                      />

                      <DeleteBudgetButton
                        budgetId={budget.id}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}