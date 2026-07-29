"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  BarChart3,
  Clock,
  Wallet,
} from "lucide-react";

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

type BalanceResponse = {
  summary: {
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    totalExpenses: number;
    netResult: number;
  };

  pendingBreakdown: {
    budgets: number;
    standalonePayments: number;
  };

  branches: Branch[];
  branchRows: BranchRow[];
  expenses: Expense[];
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
      alert("No se pudo cargar el balance.");
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
      alert("No se pudo registrar el gasto.");
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
          />

          <Metric
            title="Pendiente"
            value={balance.summary.totalPending}
            icon={<Clock />}
            detail={`Presupuestos: ${formatCurrency(
              balance.pendingBreakdown.budgets
            )}`}
          />

          <Metric
            title="Demorado"
            value={balance.summary.totalOverdue}
            icon={<AlertCircle />}
          />

          <Metric
            title="Gastos"
            value={balance.summary.totalExpenses}
            icon={<Wallet />}
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
              {balance.expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="grid gap-2 border-b border-[#DED9CD] pb-4 text-sm md:grid-cols-4"
                >
                  <span>
                    {new Date(
                      expense.date
                    ).toLocaleDateString("es-AR")}
                  </span>

                  <span>{expense.concept}</span>

                  <span>{expense.category}</span>

                  <span className="font-semibold">
                    {formatCurrency(
                      Number(expense.amount)
                    )}
                  </span>
                </div>
              ))}

              {balance.expenses.length === 0 && (
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
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Comparación mensual del año
            </h2>

            <div className="mt-6 flex h-72 items-end gap-3 overflow-x-auto">
              {balance.monthlyData.map((item) => (
                <div
                  key={item.monthIndex}
                  className="flex min-w-[60px] flex-1 flex-col items-center gap-2"
                >
                  <div className="flex h-56 items-end gap-1">
                    <div className="group flex h-full flex-col items-center justify-end">
                      <span className="mb-2 hidden whitespace-nowrap rounded bg-[#263F3B] px-2 py-1 text-xs text-white group-hover:block">
                        Ingresos:{" "}
                        {formatCurrency(item.income)}
                      </span>

                      <div
                        className="w-5 bg-[#263F3B] transition-all duration-200"
                        style={{
                          height: `${
                            (item.income /
                              maxChartValue) *
                            100
                          }%`,
                        }}
                      />
                    </div>

                    <div className="group flex h-full flex-col items-center justify-end">
                      <span className="mb-2 hidden whitespace-nowrap rounded bg-[#6B7774] px-2 py-1 text-xs text-white group-hover:block">
                        Gastos:{" "}
                        {formatCurrency(item.expense)}
                      </span>

                      <div
                        className="w-5 bg-[#A2B38B] transition-all duration-200"
                        style={{
                          height: `${
                            (item.expense /
                              maxChartValue) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <span className="text-xs font-semibold uppercase text-[#6B7774]">
                    {months[item.monthIndex]}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
  detail,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  detail?: string;
}) {
  return (
    <article className="border border-[#DED9CD] bg-white p-6">
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
    </article>
  );
}