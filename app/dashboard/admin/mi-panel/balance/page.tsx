"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Clock, AlertCircle, Wallet, Plus } from "lucide-react";

type Branch = {
  id: string;
  name: string;
  address: string;
};

type Payment = {
  id: string;
  amount: number;
  status: "PAID" | "PENDING" | "OVERDUE";
  dueDate: string;
  paidAt?: string | null;
  patient?: {
    branch?: Branch;
  };
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

const months = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export default function BalancePage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [openExpense, setOpenExpense] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    concept: "",
    category: "",
    amount: "",
    date: "",
    branchId: "",
  });

  async function loadData() {
    const [paymentsRes, expensesRes, branchesRes] = await Promise.all([
      fetch("/api/payments"),
      fetch("/api/expenses"),
      fetch("/api/branches"),
    ]);

    setPayments(await paymentsRes.json());
    setExpenses(await expensesRes.json());
    setBranches(await branchesRes.json());
  }

  useEffect(() => {
    loadData();
  }, []);

  function getBranchIdFromPayment(payment: Payment) {
    return payment.patient?.branch?.id || "";
  }

  const filteredPayments = payments.filter((payment) => {
    const date = payment.paidAt || payment.dueDate;
    const paymentDate = new Date(date);

    const matchesMonth = paymentDate.getMonth() === selectedMonth;
    const matchesBranch =
      !selectedBranchId || getBranchIdFromPayment(payment) === selectedBranchId;

    return matchesMonth && matchesBranch;
  });

  const filteredExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);

    const matchesMonth = expenseDate.getMonth() === selectedMonth;
    const matchesBranch =
      !selectedBranchId || expense.branchId === selectedBranchId;

    return matchesMonth && matchesBranch;
  });

  const totalPaid = filteredPayments
    .filter((p) => p.status === "PAID")
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const totalPending = filteredPayments
    .filter((p) => p.status === "PENDING")
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const totalOverdue = filteredPayments
    .filter((p) => p.status === "OVERDUE")
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const totalExpenses = filteredExpenses.reduce(
    (acc, expense) => acc + Number(expense.amount),
    0
  );

  const netResult = totalPaid - totalExpenses;

  const monthlyData = useMemo(() => {
    return months.map((month, index) => {
      const monthPayments = payments.filter((payment) => {
        const date = payment.paidAt || payment.dueDate;
        const paymentDate = new Date(date);

        const matchesMonth = paymentDate.getMonth() === index;
        const matchesBranch =
          !selectedBranchId ||
          getBranchIdFromPayment(payment) === selectedBranchId;

        return matchesMonth && matchesBranch && payment.status === "PAID";
      });

      const monthExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);

        const matchesMonth = expenseDate.getMonth() === index;
        const matchesBranch =
          !selectedBranchId || expense.branchId === selectedBranchId;

        return matchesMonth && matchesBranch;
      });

      const income = monthPayments.reduce(
        (acc, p) => acc + Number(p.amount),
        0
      );

      const expense = monthExpenses.reduce(
        (acc, e) => acc + Number(e.amount),
        0
      );

      return {
        month,
        income,
        expense,
        result: income - expense,
      };
    });
  }, [payments, expenses, selectedBranchId]);

  const maxChartValue = Math.max(
    ...monthlyData.map((item) => item.income),
    1
  );

  async function handleExpenseSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(expenseForm),
    });

    if (!res.ok) {
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
    loadData();
  }

  const branchRows = branches.map((branch) => {
    const branchPayments = payments.filter((payment) => {
      const date = payment.paidAt || payment.dueDate;
      const paymentDate = new Date(date);

      return (
        paymentDate.getMonth() === selectedMonth &&
        getBranchIdFromPayment(payment) === branch.id
      );
    });

    const branchExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);

      return (
        expenseDate.getMonth() === selectedMonth &&
        expense.branchId === branch.id
      );
    });

    const paid = branchPayments
      .filter((p) => p.status === "PAID")
      .reduce((acc, p) => acc + Number(p.amount), 0);

    const pending = branchPayments
      .filter((p) => p.status === "PENDING")
      .reduce((acc, p) => acc + Number(p.amount), 0);

    const overdue = branchPayments
      .filter((p) => p.status === "OVERDUE")
      .reduce((acc, p) => acc + Number(p.amount), 0);

    const expense = branchExpenses.reduce(
      (acc, e) => acc + Number(e.amount),
      0
    );

    return {
      branch,
      paid,
      pending,
      overdue,
      expense,
      result: paid - expense,
    };
  });

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <div className="space-y-8">
        <header className="flex items-start justify-between gap-6">
          <div>
            <h1 className="font-serif text-4xl font-medium">
              Balance
            </h1>
            <p className="mt-3 text-sm text-[#6B7774]">
              Resumen financiero de ingresos, pagos pendientes, demorados y gastos.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <select
              className="border border-[#DED9CD] bg-white p-3 text-sm"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {months.map((month, index) => (
                <option key={month} value={index}>
                  {month} {new Date().getFullYear()}
                </option>
              ))}
            </select>

            <select
              className="border border-[#DED9CD] bg-white p-1 text-sm"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
            >
              <option value="">Todas las sucursales</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} — {branch.address}
                </option>
              ))}
            </select>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-5">
          <Metric title="Cobrado" value={totalPaid} icon={<BarChart3 />} />
          <Metric title="Pendiente" value={totalPending} icon={<Clock />} />
          <Metric title="Demorado" value={totalOverdue} icon={<AlertCircle />} />
          <Metric title="Gastos" value={totalExpenses} icon={<Wallet />} />
          <Metric title="Neto" value={netResult} icon={<BarChart3 />} />
        </section>

        <section className="grid gap-6">
          <article className="border border-[#DED9CD] bg-white p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Resumen por sucursal
            </h2>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="text-left text-[10px] uppercase tracking-[0.18em] text-[#6B7774]">
                  <tr>
                    <th className="pb-3">Sucursal</th>
                    <th className="pb-3">Ingresos</th>
                    <th className="pb-3">Pendientes</th>
                    <th className="pb-3">Demorados</th>
                    <th className="pb-3">Gastos</th>
                    <th className="pb-3">Resultado</th>
                  </tr>
                </thead>

                <tbody>
                  {branchRows.map((row) => (
                    <tr key={row.branch.id} className="border-t border-[#DED9CD]">
                      <td className="py-4 pr-3 font-medium">
                        {row.branch.name} — {row.branch.address}
                      </td>
                      <td className="pr-3">${row.paid.toLocaleString("es-AR")}</td>
                      <td className="pr-3">${row.pending.toLocaleString("es-AR")}</td>
                      <td className="pr-3">${row.overdue.toLocaleString("es-AR")}</td>
                      <td className="pr-3">${row.expense.toLocaleString("es-AR")}</td>
                      <td className="font-semibold text-green-700">
                        ${row.result.toLocaleString("es-AR")}
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
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="grid gap-2 border-b border-[#DED9CD] pb-4 text-sm md:grid-cols-4"
                >
                  <span>{new Date(expense.date).toLocaleDateString("es-AR")}</span>
                  <span>{expense.concept}</span>
                  <span>{expense.category}</span>
                  <span className="font-semibold">
                    ${Number(expense.amount).toLocaleString("es-AR")}
                  </span>
                </div>
              ))}

              {filteredExpenses.length === 0 && (
                <p className="text-sm text-[#6B7774]">
                  No hay gastos registrados para este filtro.
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
                onClick={() => setOpenExpense(!openExpense)}
                className="bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white"
              >
                {openExpense ? "Cerrar" : "+ Registrar"}
              </button>
            </div>

            {openExpense && (
              <form onSubmit={handleExpenseSubmit} className="mt-6 grid gap-3 md:grid-cols-2">
                <select
                  className="border border-[#DED9CD] bg-white p-3"
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, category: e.target.value })
                  }
                  required
                >
                  <option value="">Categoría</option>
                  <option value="Insumos">Insumos</option>
                  <option value="Alquiler">Alquiler</option>
                  <option value="Patógenos">Patógenos</option>
                  <option value="Servicios">Servicios</option>
                  <option value="Sueldos">Sueldos</option>
                  <option value="Equipamiento">Equipamiento</option>
                  <option value="Impuestos">Impuestos</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Otros">Otros</option>
                </select>

                <input
                  className="border border-[#DED9CD] bg-white p-3"
                  placeholder="Detalle"
                  value={expenseForm.concept}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, concept: e.target.value })
                  }
                  required
                />

                <select
                  className="border border-[#DED9CD] bg-white p-3"
                  value={expenseForm.branchId}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, branchId: e.target.value })
                  }
                >
                  <option value="">Todas/General</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} — {branch.address}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  className="border border-[#DED9CD] bg-white p-3"
                  value={expenseForm.date}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, date: e.target.value })
                  }
                  required
                />

                <input
                  type="number"
                  className="border border-[#DED9CD] bg-white p-3"
                  placeholder="Monto"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
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

        <section className="grid gap-6">
          <article className="border border-[#DED9CD] bg-white p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Comparación mensual del año
            </h2>

            <div className="mt-6 flex h-72 items-end gap-3 overflow-x-auto">
              {monthlyData.map((item) => (
                <div
                  key={item.month}
                  className="flex min-w-[60px] flex-1 flex-col items-center gap-2"
                >
                  <div className="flex h-56 items-end">
                    <div className="group flex h-full flex-col items-center justify-end">
                      <span className="mb-2 hidden rounded bg-[#263F3B] px-2 py-1 text-xs text-white group-hover:block">
                        ${item.income.toLocaleString("es-AR")}
                      </span>

                    <div
                      className="w-6 rounded-t bg-[#263F3B] transition-all duration-200 hover:bg-[#1d302d]"
                      style={{
                        height: `${(item.income / maxChartValue) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <span className="text-xs font-semibold uppercase text-[#6B7774]">
                  {item.month}
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
}: { 
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <article className="border border-[#DED9CD] bg-white p-6"> 
      <div className="mb-4 h-5 w-5 text-[#A2B38B]">
        {icon}
      </div>
      <p 
        className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
          {title} 
      </p> 
      <p className="mt-2 text-[16px] font-semibold"> 
        ${value.toLocaleString("es-AR")} 
      </p>
    </article>
  );
}