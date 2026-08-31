"use client";

import { useEffect, useState } from "react";

import {
  ClipboardList,
  CalendarDays,
  UserRound,
  Percent,
  BadgeDollarSign,
  FileText,
  ChevronDown,
  CircleCheck,
  Clock3,
  CreditCard,
} from "lucide-react";

type BudgetItem = {
  id: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type Doctor = {
  id: string;
  name: string | null;
  user?: {
    name: string | null;
  } | null;
};

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
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string;

  status: "PENDING" | "COMPLETED";

  paidAmount: number;
  remainingAmount: number;

  doctors: Doctor[];
  items: BudgetItem[];
  payments: Payment[];
};

function money(value: number) {
  return `$${Number(value).toLocaleString("es-AR")}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR");
}

export default function PatientPresupuestosPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Guarda qué presupuestos están abiertos
  const [openBudgets, setOpenBudgets] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    async function loadBudgets() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/patient/budgets",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "No se pudieron cargar los presupuestos."
          );
        }

        setBudgets(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Error cargando presupuestos del paciente:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los presupuestos."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadBudgets();
  }, []);

  function toggleBudget(budgetId: string) {
    setOpenBudgets((current) => ({
      ...current,
      [budgetId]: !current[budgetId],
    }));
  }

  if (loading) {
    return (
      <div>
        <h1 className="font-serif text-4xl text-[#173b33]">
          Mis presupuestos
        </h1>

        <p className="mt-4 text-sm text-[#6c7b72]">
          Cargando presupuestos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="font-serif text-4xl text-[#173b33]">
          Mis presupuestos
        </h1>

        <div className="mt-8 border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-4xl text-[#173b33]">
        Mis presupuestos
      </h1>

      <p className="mt-2 text-[#6c7b72]">
        Consultá los presupuestos emitidos por tu odontólogo.
      </p>

      <div className="mt-8 space-y-5">
        {budgets.length === 0 && (
          <div className="border border-[#d8d2c4] bg-white p-8 text-[#6c7b72]">
            Todavía no tenés presupuestos cargados.
          </div>
        )}

        {budgets.map((budget) => {
          const date = new Date(
            budget.createdAt
          );

          const doctorNames =
            budget.doctors?.length > 0
              ? budget.doctors
                  .map(
                    (doctor) =>
                      doctor.name ||
                      doctor.user?.name ||
                      "Especialista"
                  )
                  .join(", ")
              : "Sin especialista asignado";

          const isOpen =
            Boolean(openBudgets[budget.id]);

          const isCompleted =
            budget.status === "COMPLETED";

          return (
            <div
              key={budget.id}
              className="overflow-hidden border border-[#d8d2c4] bg-white"
            >
              {/* CABECERA DEL PRESUPUESTO */}
              <div className="p-6">
                <div className="grid gap-3 md:grid-cols-4">
                  <InfoCard
                    icon={
                      <CalendarDays size={18} />
                    }
                    title="Fecha"
                    value={date.toLocaleDateString(
                      "es-AR"
                    )}
                  />

                  <InfoCard
                    icon={
                      <UserRound size={18} />
                    }
                    title={
                      budget.doctors?.length > 1
                        ? "Odontólogos"
                        : "Odontólogo"
                    }
                    value={doctorNames}
                  />

                  <InfoCard
                    icon={
                      <Percent size={18} />
                    }
                    title="Descuento"
                    value={`${budget.discount}%`}
                  />

                  <InfoCard
                    icon={
                      <BadgeDollarSign size={18} />
                    }
                    title="Total"
                    value={money(
                      budget.total
                    )}
                    strong
                  />
                </div>

                {/* ESTADO + PDF */}
                <div className="mt-5 flex flex-col gap-3 border-t border-[#e4dfd4] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div
                    className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${
                      isCompleted
                        ? "bg-[#E8F0E5] text-[#55734D]"
                        : "bg-[#F5EFE0] text-[#927746]"
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CircleCheck size={15} />
                        Completado
                      </>
                    ) : (
                      <>
                        <Clock3 size={15} />
                        Pendiente
                      </>
                    )}
                  </div>

                  <a
                    href={`/api/budgets/${budget.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-2 border border-[#DED9CD] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] transition hover:bg-[#F7F5EF]"
                  >
                    <FileText className="h-4 w-4" />
                    Ver PDF
                  </a>
                </div>

                {/* VER DETALLES */}
                <button
                  type="button"
                  onClick={() =>
                    toggleBudget(budget.id)
                  }
                  className="mt-5 flex w-full items-center justify-between border border-[#d8d2c4] px-4 py-3 text-left transition hover:bg-[#F9F8F4]"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Ver detalles
                  </span>

                  <ChevronDown
                    size={20}
                    className={`text-[#6C7B72] transition-transform duration-200 ${
                      isOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>
              </div>

              {/* CONTENIDO DESPLEGABLE */}
              {isOpen && (
                <div className="border-t border-[#d8d2c4] bg-[#FCFBF8]">
                  {/* TRATAMIENTOS */}
                  <div className="p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <ClipboardList
                        size={18}
                        className="text-[#A2B38B]"
                      />

                      <h2 className="font-semibold text-[#173b33]">
                        Tratamientos
                      </h2>
                    </div>

                    <div className="overflow-hidden border border-[#d8d2c4] bg-white">
                      {budget.items?.length > 0 ? (
                        <div className="divide-y divide-[#d8d2c4]">
                          {budget.items.map(
                            (item) => (
                              <div
                                key={item.id}
                                className="px-4 py-4"
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex min-w-0 items-start gap-3">
                                    <ClipboardList
                                      size={16}
                                      className="mt-0.5 shrink-0 text-[#A2B38B]"
                                    />

                                    <div className="min-w-0">
                                      <p className="break-words text-sm font-medium text-[#173b33]">
                                        {
                                          item.serviceName
                                        }
                                      </p>

                                      {item.quantity >
                                        1 && (
                                        <p className="mt-1 text-xs text-[#7A847D]">
                                          {item.quantity}{" "}
                                          unidades ×{" "}
                                          {money(
                                            item.unitPrice
                                          )}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <span className="shrink-0 text-sm font-semibold text-[#173b33]">
                                    {money(
                                      item.total
                                    )}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="px-4 py-4 text-sm text-[#6c7b72]">
                          Sin tratamientos cargados.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PAGOS */}
                  <div className="border-t border-[#e2ddd2] p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <CreditCard
                        size={18}
                        className="text-[#A2B38B]"
                      />

                      <h2 className="font-semibold text-[#173b33]">
                        Pagos realizados
                      </h2>
                    </div>

                    <div className="overflow-hidden border border-[#d8d2c4] bg-white">
                      {budget.payments?.length > 0 ? (
                        <div className="divide-y divide-[#d8d2c4]">
                          {budget.payments.map(
                            (payment) => (
                              <div
                                key={payment.id}
                                className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <p className="text-sm font-medium text-[#173b33]">
                                    {payment.paidAt
                                      ? formatDate(
                                          payment.paidAt
                                        )
                                      : formatDate(
                                          payment.createdAt
                                        )}
                                  </p>

                                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#7A847D]">
                                    {payment.concept && (
                                      <span>
                                        {
                                          payment.concept
                                        }
                                      </span>
                                    )}

                                    {payment.paymentMethod && (
                                      <span>
                                        {
                                          payment.paymentMethod
                                        }
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <span className="text-sm font-semibold text-[#173b33]">
                                  {money(
                                    payment.amount
                                  )}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="px-4 py-5 text-sm text-[#6c7b72]">
                          Todavía no se registraron pagos para este presupuesto.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RESUMEN DE PAGOS */}
                  <div className="border-t border-[#d8d2c4] p-6">
                    <div className="border border-[#d8d2c4] bg-white p-5">
                      <div className="space-y-2 text-sm text-[#173b33]">
                        <div className="flex justify-between gap-4">
                          <span>
                            Total del presupuesto
                          </span>

                          <span className="font-medium">
                            {money(
                              budget.total
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4 text-[#6c7b72]">
                          <span>
                            Pagado
                          </span>

                          <span>
                            {money(
                              budget.paidAmount
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4 border-t border-[#d8d2c4] pt-3 text-base font-semibold">
                          <span>
                            Saldo pendiente
                          </span>

                          <span
                            className={
                              budget.remainingAmount ===
                              0
                                ? "text-[#55734D]"
                                : "text-[#173b33]"
                            }
                          >
                            {money(
                              budget.remainingAmount
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RESUMEN INFERIOR */}
              <div className="border-t border-[#d8d2c4] px-6 py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-[#6c7b72]">
                    <span>
                      {budget.items?.length || 0}{" "}
                      {budget.items?.length === 1
                        ? "tratamiento"
                        : "tratamientos"}
                    </span>
                  </div>

                  <div className="flex flex-col items-start gap-1 text-sm sm:items-end">
                    <span className="text-[#6c7b72]">
                      Total
                    </span>

                    <span className="text-xl font-semibold text-[#173b33]">
                      {money(
                        budget.total
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
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
    <div className="min-w-0 border border-[#d8d2c4] p-4">
      <div className="mb-2 text-[#A2B38B]">
        {icon}
      </div>

      <p className="font-semibold text-[#173b33]">
        {title}
      </p>

      <p
        className={`mt-1 break-words text-sm ${
          strong
            ? "font-semibold text-[#173b33]"
            : "text-[#6c7b72]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}