"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  BarChart3,
  Clock,
  Trash2,
  Wallet,
} from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";

type Branch = {
  id: string;
  name: string;
  address: string;
};

type Expense = {
  id: string;
  concept: string;
  category: string;
  amount: number;
  date: string;
  branchId?: string | null;
  branch?: Branch | null;
};

type BranchRow = {
  branch: Branch;
  paid: number;
  pending: number;
  overdue: number;
  expense: number;
  result: number;
};

type MonthlyData = {
  monthIndex: number;
  income: number;
  expense: number;
  result: number;
};

type BalanceDetail = {
  id: string;
  type: "PAYMENT" | "BUDGET" | "EXPENSE";
  patientId: string | null;
  patientName: string;
  concept: string;
  date: string;
  amount: number;
  branchId: string | null;
  branchName: string;
  budgetId: string | null;
};

type BalanceResponse = {
  summary: {
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    totalExpenses: number;
    netResult: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
    expenseCount: number;
  };

  details: {
    paid: BalanceDetail[];
    pending: BalanceDetail[];
    overdue: BalanceDetail[];
    expenses: BalanceDetail[];
  };

  branches: Branch[];
  branchRows: BranchRow[];
  monthlyData: MonthlyData[];
};

const months = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function BalancePage() {
  const confirmDialog = useConfirm();
  const currentDate = new Date();

  const [balance, setBalance] =
    useState<BalanceResponse | null>(null);

  const [selectedBranchId, setSelectedBranchId] =
    useState("");

  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth()
  );

  const [selectedYear, setSelectedYear] = useState(
    currentDate.getFullYear()
  );

  const [openExpense, setOpenExpense] =
    useState(false);

  const [loading, setLoading] = useState(true);

  const [openHistory, setOpenHistory] = useState<
    "paid" | "pending" | "overdue" | "expenses" | null
  >(null);

  const [expenseForm, setExpenseForm] = useState({
    concept: "",
    category: "",
    amount: "",
    date: "",
    branchId: "",
  });

  const loadBalance = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        month: String(selectedMonth),
        year: String(selectedYear),
      });

      if (selectedBranchId) {
        params.set("branchId", selectedBranchId);
      }

      const response = await fetch(
        `/api/balance?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "No se pudo cargar el balance."
        );
      }

      const data =
        (await response.json()) as BalanceResponse;

      setBalance(data);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cargar el balance.");
    } finally {
      setLoading(false);
    }
  }, [
    selectedBranchId,
    selectedMonth,
    selectedYear,
  ]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const maxChartValue = useMemo(() => {
    if (!balance) {
      return 1;
    }

    return Math.max(
      ...balance.monthlyData.map((item) =>
        Math.max(item.income, item.expense)
      ),
      1
    );
  }, [balance]);

  async function handleExpenseSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        concept: expenseForm.concept,
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        date: expenseForm.date,
        branchId: expenseForm.branchId || null,
      }),
    });

    if (!response.ok) {
      toast.error("No se pudo registrar el gasto.");
      return;
    }

    setExpenseForm({
      concept: "",
      category: "",
      amount: "",
      date: "",
      branchId: "",
    });

    setOpenExpense(false);

    await loadBalance();
  }

  async function handleDeleteExpense(expense: BalanceDetail) {
    const confirmed = await confirmDialog({
      title: "Eliminar gasto",
      description: `¿Querés eliminar el gasto "${expense.concept}" por ${formatCurrency(
        expense.amount
      )}?`,
      confirmText: "Eliminar",
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/expenses/${expense.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(
          data.error || "No se pudo eliminar el gasto."
        );
        return;
      }

      toast.success("Gasto eliminado correctamente.");

      await loadBalance();
    } catch (error) {
      console.error("Error al eliminar gasto:", error);

      toast.error(
        "No se pudo eliminar el gasto. Intentá nuevamente."
      );
    }
  }

  if (loading && !balance) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] p-8 text-[#263F3B]">
        <p className="text-sm text-[#6B7774]">
          Cargando balance...
        </p>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] p-8 text-[#263F3B]">
        <p className="text-sm text-red-600">
          No se pudo mostrar el balance.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <div className="space-y-8">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="font-[var(--font-cormorant)] text-4xl font-medium">
              Balance
            </h1>

            <p className="mt-3 text-sm text-[#6B7774]">
              Resumen financiero de ingresos, saldos
              pendientes, pagos demorados y gastos.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <select
              className="border border-[#DED9CD] bg-white p-3 text-sm"
              value={selectedMonth}
              onChange={(event) =>
                setSelectedMonth(
                  Number(event.target.value)
                )
              }
            >
              {months.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>

            <select
              className="border border-[#DED9CD] bg-white p-3 text-sm"
              value={selectedYear}
              onChange={(event) =>
                setSelectedYear(
                  Number(event.target.value)
                )
              }
            >
              {Array.from(
                { length: 5 },
                (_, index) =>
                  currentDate.getFullYear() - 2 + index
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <select
              className="border border-[#DED9CD] bg-white p-3 text-sm"
              value={selectedBranchId}
              onChange={(event) =>
                setSelectedBranchId(event.target.value)
              }
            >
              <option value="">
                Todas las sucursales
              </option>

              {balance.branches.map((branch) => (
                <option
                  key={branch.id}
                  value={branch.id}
                >
                  {branch.name} — {branch.address}
                </option>
              ))}
            </select>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-5">
          <Metric
            title="Cobrado"
            value={balance.summary.totalPaid}
            icon={<BarChart3 />}
            detail={`${balance.summary.paidCount} ${
              balance.summary.paidCount === 1 ? "pago" : "pagos"
            }`}
            onClick={() => setOpenHistory("paid")}
          />

          <Metric
            title="Pendiente"
            value={balance.summary.totalPending}
            icon={<Clock />}
            detail={`${balance.summary.pendingCount} ${
              balance.summary.pendingCount === 1
                ? "saldo pendiente"
                : "saldos pendientes"
            }`}
            onClick={() => setOpenHistory("pending")}
          />

          <Metric
            title="Demorado"
            value={balance.summary.totalOverdue}
            icon={<AlertCircle />}
            detail={`${balance.summary.overdueCount} ${
              balance.summary.overdueCount === 1
                ? "saldo demorado"
                : "saldos demorados"
            }`}
            onClick={() => setOpenHistory("overdue")}
          />

          <Metric
            title="Gastos"
            value={balance.summary.totalExpenses}
            icon={<Wallet />}
            detail={`${balance.summary.expenseCount} ${
              balance.summary.expenseCount === 1 ? "gasto" : "gastos"
            }`}
            onClick={() => setOpenHistory("expenses")}
          />

          <Metric
            title="Neto"
            value={balance.summary.netResult}
            icon={<BarChart3 />}
          />
        </section>

        <section>
          <article className="border border-[#DED9CD] bg-white p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Resumen por sucursal
            </h2>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="text-left text-[10px] uppercase tracking-[0.18em] text-[#6B7774]">
                  <tr>
                    <th className="pb-3">
                      Sucursal
                    </th>
                    <th className="pb-3">
                      Ingresos
                    </th>
                    <th className="pb-3">
                      Pendientes
                    </th>
                    <th className="pb-3">
                      Demorados
                    </th>
                    <th className="pb-3">
                      Gastos
                    </th>
                    <th className="pb-3">
                      Resultado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {balance.branchRows.map((row) => (
                    <tr
                      key={row.branch.id}
                      className="border-t border-[#DED9CD]"
                    >
                      <td className="py-4 pr-3 font-medium">
                        {row.branch.name} —{" "}
                        {row.branch.address}
                      </td>

                      <td className="pr-3">
                        {formatCurrency(row.paid)}
                      </td>

                      <td className="pr-3">
                        {formatCurrency(row.pending)}
                      </td>

                      <td className="pr-3">
                        {formatCurrency(row.overdue)}
                      </td>

                      <td className="pr-3">
                        {formatCurrency(row.expense)}
                      </td>

                      <td
                        className={`font-semibold ${
                          row.result < 0
                            ? "text-red-600"
                            : "text-green-700"
                        }`}
                      >
                        {formatCurrency(row.result)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="border border-[#DED9CD] bg-white p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Gastos registrados
            </h2>

            <div className="mt-6 space-y-4">
              {balance.details.expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="grid items-center gap-3 border-b border-[#DED9CD] pb-4 text-sm md:grid-cols-[90px_1fr_1.4fr_auto_auto]"
                >
                  <span>
                    {new Date(expense.date).toLocaleDateString(
                      "es-AR"
                    )}
                  </span>

                  <span>{expense.concept}</span>

                  <span className="text-[#6B7774]">
                    {expense.branchName}
                  </span>

                  <span className="font-semibold">
                    {formatCurrency(expense.amount)}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(expense)}
                    title="Eliminar gasto"
                    aria-label={`Eliminar gasto ${expense.concept}`}
                    className="flex h-8 w-8 items-center justify-center text-red-400 transition hover:opacity-70"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {balance.details.expenses.length === 0 && (
                <p className="text-sm text-[#6B7774]">
                  No hay gastos registrados para este
                  filtro.
                </p>
              )}
            </div>
          </article>

          <article className="border border-[#DED9CD] bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                Registrar gasto
              </h2>

              <button
                type="button"
                onClick={() =>
                  setOpenExpense((current) => !current)
                }
                className="bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white"
              >
                {openExpense
                  ? "Cerrar"
                  : "+ Registrar"}
              </button>
            </div>

            {openExpense && (
              <form
                onSubmit={handleExpenseSubmit}
                className="mt-6 grid gap-3 md:grid-cols-2"
              >
                <select
                  className="border border-[#DED9CD] bg-white p-3"
                  value={expenseForm.category}
                  onChange={(event) =>
                    setExpenseForm({
                      ...expenseForm,
                      category: event.target.value,
                    })
                  }
                  required
                >
                  <option value="">
                    Categoría
                  </option>
                  <option value="Insumos">
                    Insumos
                  </option>
                  <option value="Alquiler">
                    Alquiler
                  </option>
                  <option value="Patógenos">
                    Patógenos
                  </option>
                  <option value="Servicios">
                    Servicios
                  </option>
                  <option value="Sueldos">
                    Sueldos
                  </option>
                  <option value="Equipamiento">
                    Equipamiento
                  </option>
                  <option value="Impuestos">
                    Impuestos
                  </option>
                  <option value="Mantenimiento">
                    Mantenimiento
                  </option>
                  <option value="Otros">
                    Otros
                  </option>
                </select>

                <input
                  className="border border-[#DED9CD] bg-white p-3"
                  placeholder="Detalle"
                  value={expenseForm.concept}
                  onChange={(event) =>
                    setExpenseForm({
                      ...expenseForm,
                      concept: event.target.value,
                    })
                  }
                  required
                />

                <select
                  className="border border-[#DED9CD] bg-white p-3"
                  value={expenseForm.branchId}
                  onChange={(event) =>
                    setExpenseForm({
                      ...expenseForm,
                      branchId: event.target.value,
                    })
                  }
                >
                  <option value="">
                    Todas/General
                  </option>

                  {balance.branches.map((branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name} — {branch.address}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  className="border border-[#DED9CD] bg-white p-3"
                  value={expenseForm.date}
                  onChange={(event) =>
                    setExpenseForm({
                      ...expenseForm,
                      date: event.target.value,
                    })
                  }
                  required
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="border border-[#DED9CD] bg-white p-3"
                  placeholder="Monto"
                  value={expenseForm.amount}
                  onChange={(event) =>
                    setExpenseForm({
                      ...expenseForm,
                      amount: event.target.value,
                    })
                  }
                  required
                />

                <div className="flex justify-end md:col-span-2">
                  <button className="bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                    Guardar gasto
                  </button>
                </div>
              </form>
            )}
          </article>
        </section>

        <section>
          <article className="border border-[#DED9CD] bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Comparación mensual
                </h2>

                <p className="mt-2 text-sm text-[#6B7774]">
                  Ingresos y gastos correspondientes al año{" "}
                  {selectedYear}.
                </p>
              </div>

              <div className="flex items-center gap-5 text-xs text-[#6B7774]">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 bg-[#263F3B]" />
                  Ingresos
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 bg-[#A2B38B]" />
                  Gastos
                </div>
              </div>
            </div>

            <div className="mt-8 overflow-x-auto">
              <div className="flex h-72 min-w-[850px] items-end gap-4 border-b border-[#DED9CD] px-2">
                {balance.monthlyData.map((item) => {
                  const incomeHeight =
                    item.income > 0
                      ? Math.max(
                          (item.income / maxChartValue) * 100,
                          3
                        )
                      : 0;

                  const expenseHeight =
                    item.expense > 0
                      ? Math.max(
                          (item.expense / maxChartValue) * 100,
                          3
                        )
                      : 0;

                  return (
                    <div
                      key={item.monthIndex}
                      className="flex min-w-[54px] flex-1 flex-col items-center"
                    >
                      <div className="flex h-56 items-end gap-1.5">
                        <div className="group relative flex h-full items-end">
                          <div
                            className="w-5 bg-[#263F3B] transition-all duration-300"
                            style={{
                              height: `${incomeHeight}%`,
                            }}
                          />

                          {item.income > 0 && (
                            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap bg-[#263F3B] px-2 py-1 text-[10px] text-white group-hover:block">
                              {formatCurrency(item.income)}
                            </span>
                          )}
                        </div>

                        <div className="group relative flex h-full items-end">
                          <div
                            className="w-5 bg-[#A2B38B] transition-all duration-300"
                            style={{
                              height: `${expenseHeight}%`,
                            }}
                          />

                          {item.expense > 0 && (
                            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap bg-[#6B7774] px-2 py-1 text-[10px] text-white group-hover:block">
                              {formatCurrency(item.expense)}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B7774]">
                        {months[item.monthIndex]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {balance.monthlyData.every(
              (item) => item.income === 0 && item.expense === 0
            ) && (
              <p className="mt-6 text-center text-sm text-[#6B7774]">
                Todavía no hay ingresos ni gastos registrados en{" "}
                {selectedYear}.
              </p>
            )}
          </article>
        </section>

        {openHistory && (
          <BalanceHistoryModal
            type={openHistory}
            items={balance.details[openHistory]}
            onClose={() => setOpenHistory(null)}
          />
        )}
      </div>
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
  detail,
  onClick,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  detail?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="mb-4 h-5 w-5 text-[#A2B38B]">
        {icon}
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
        {title}
      </p>

      <p className="mt-2 text-[16px] font-semibold">
        {formatCurrency(value)}
      </p>

      {detail && (
        <p className="mt-2 text-[11px] text-[#6B7774]">
          {detail}
        </p>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full border border-[#DED9CD] bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-lg"
      >
        {content}
      </button>
    );
  }

  return (
    <article className="border border-[#DED9CD] bg-white p-6">
      {content}
    </article>
  );
}

function BalanceHistoryModal({
  type,
  items,
  onClose,
}: {
  type: "paid" | "pending" | "overdue" | "expenses";
  items: BalanceDetail[];
  onClose: () => void;
}) {
  const titles = {
    paid: "Cobrado",
    pending: "Pendiente",
    overdue: "Demorado",
    expenses: "Gastos",
  };

  const subtitles = {
    paid: "Pagos registrados en el período seleccionado.",
    pending: "Saldos que todavía se encuentran pendientes.",
    overdue: "Saldos cuyo vencimiento ya pasó.",
    expenses: "Gastos registrados en el período seleccionado.",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <button
        type="button"
        aria-label="Cerrar historial"
        onClick={onClose}
        className="absolute inset-0"
      />

      <section className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden bg-[#F7F5EF] shadow-2xl">
        <header className="flex items-start justify-between gap-5 border-b border-[#DED9CD] bg-white px-6 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Historial
            </p>

            <h2 className="mt-1 font-[var(--font-cormorant)] text-3xl font-medium">
              {titles[type]}
            </h2>

            <p className="mt-2 text-sm text-[#6B7774]">
              {subtitles[type]}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="border border-[#DED9CD] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] transition hover:bg-[#F7F5EF]"
          >
            Cerrar
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {items.map((item) => (
            <article
              key={item.id}
              className="border border-[#DED9CD] bg-white p-5"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  {item.patientName ? (
                    <h3 className="font-[var(--font-cormorant)] text-2xl font-medium">
                      {item.patientName}
                    </h3>
                  ) : (
                    <h3 className="font-[var(--font-cormorant)] text-2xl font-medium">
                      {item.concept}
                    </h3>
                  )}

                  {item.patientName && (
                    <p className="mt-1 text-sm text-[#6B7774]">
                      {item.concept}
                    </p>
                  )}
                </div>

                <p
                  className={`text-xl font-semibold ${
                    type === "overdue"
                      ? "text-red-600"
                      : type === "expenses"
                        ? "text-[#A45858]"
                        : "text-[#263F3B]"
                  }`}
                >
                  {formatCurrency(item.amount)}
                </p>
              </div>

              <div className="mt-5 grid gap-4 border-t border-[#EEEAE1] pt-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                    Fecha
                  </p>

                  <p className="mt-1">
                    {new Date(item.date).toLocaleDateString(
                      "es-AR",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                    Sucursal
                  </p>

                  <p className="mt-1">
                    {item.branchName || "General"}
                  </p>
                </div>
              </div>

              {item.patientId && (
                <div className="mt-5 flex justify-end">
                  <a
                    href={`/dashboard/admin/mi-panel/pacientes/${item.patientId}`}
                    className="border border-[#263F3B] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#263F3B] transition hover:bg-[#263F3B] hover:text-white"
                  >
                    Ver paciente
                  </a>
                </div>
              )}
            </article>
          ))}

          {items.length === 0 && (
            <div className="border border-dashed border-[#DED9CD] bg-white px-6 py-14 text-center">
              <p className="text-sm text-[#6B7774]">
                No hay movimientos para el período y la sucursal seleccionados.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}