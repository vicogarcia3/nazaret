import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type DetailItem = {
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

function getMonthRange(month: number, year: number) {
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 1, 0, 0, 0, 0);

  return { start, end };
}

function isInsidePeriod(
  dateValue: Date | string,
  start: Date,
  end: Date
) {
  const date = new Date(dateValue);

  return date >= start && date < end;
}

function sumAmounts(items: DetailItem[]) {
  return items.reduce(
    (total, item) => total + Number(item.amount),
    0
  );
}

function getPatientName(patient: {
  firstName: string;
  lastName: string;
}) {
  return `${patient.lastName}, ${patient.firstName}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const now = new Date();

    const requestedMonth = Number(searchParams.get("month"));
    const requestedYear = Number(searchParams.get("year"));
    const branchId = searchParams.get("branchId") || "";

    const selectedMonth =
      Number.isInteger(requestedMonth) &&
      requestedMonth >= 0 &&
      requestedMonth <= 11
        ? requestedMonth
        : now.getMonth();

    const selectedYear =
      Number.isInteger(requestedYear) && requestedYear > 2000
        ? requestedYear
        : now.getFullYear();

    const { start: periodStart, end: periodEnd } =
      getMonthRange(selectedMonth, selectedYear);

    /*
     * Para decidir si algo está demorado:
     * - si el mes seleccionado ya terminó, usamos el último momento del mes;
     * - si es el mes actual, usamos hoy;
     * - si es un mes futuro, usamos el inicio del mes.
     */
    const referenceDate =
      periodEnd <= now
        ? new Date(periodEnd.getTime() - 1)
        : periodStart <= now
          ? now
          : periodStart;

    const branches = await prisma.branch.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        name: true,
        address: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const payments = await prisma.payment.findMany({
      include: {
        patient: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
        budget: {
          select: {
            id: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const budgets = await prisma.budget.findMany({
      include: {
        patient: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
        payments: {
          orderBy: {
            dueDate: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const expenses = await prisma.expense.findMany({
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    /*
     * COBRADO
     *
     * Solo pagos realmente marcados como PAID.
     * Se usa paidAt; para datos antiguos sin paidAt,
     * se toma createdAt como respaldo.
     */
    const paidItems: DetailItem[] = payments
      .filter((payment) => {
        if (payment.status !== "PAID") {
          return false;
        }

        const paymentDate =
          payment.paidAt ?? payment.createdAt;

        const matchesPeriod = isInsidePeriod(
          paymentDate,
          periodStart,
          periodEnd
        );

        const matchesBranch =
          !branchId ||
          payment.patient.branchId === branchId;

        return matchesPeriod && matchesBranch;
      })
      .map((payment) => ({
        id: payment.id,
        type: "PAYMENT",
        patientId: payment.patientId,
        patientName: getPatientName(payment.patient),
        concept:
          payment.concept ||
          payment.budget?.description ||
          "Pago",
        date: (
          payment.paidAt ?? payment.createdAt
        ).toISOString(),
        amount: Number(payment.amount),
        branchId: payment.patient.branchId,
        branchName: `${payment.patient.branch.name} — ${payment.patient.branch.address}`,
        budgetId: payment.budgetId,
      }));

    /*
     * PENDIENTES Y DEMORADOS DE PRESUPUESTOS
     *
     * Se toman todos los presupuestos existentes hasta el final
     * del período, sin importar el mes en que fueron creados.
     *
     * Saldo = total del presupuesto - pagos PAID.
     */
    const pendingItems: DetailItem[] = [];
    const overdueItems: DetailItem[] = [];

    for (const budget of budgets) {
      if (budget.createdAt >= periodEnd) {
        continue;
      }

      if (
        branchId &&
        budget.patient.branchId !== branchId
      ) {
        continue;
      }

      const paidAmount = budget.payments
        .filter((payment) => payment.status === "PAID")
        .reduce(
          (total, payment) =>
            total + Number(payment.amount),
          0
        );

      const remainingAmount = Math.max(
        Number(budget.total) - paidAmount,
        0
      );

      if (remainingAmount <= 0) {
        continue;
      }

      const openScheduledPayments = budget.payments.filter(
        (payment) => payment.status === "PENDING"
      );

      const overdueScheduledAmount =
        openScheduledPayments
          .filter(
            (payment) =>
              new Date(payment.dueDate) < referenceDate
          )
          .reduce(
            (total, payment) =>
              total + Number(payment.amount),
            0
          );

      const overdueAmount = Math.min(
        overdueScheduledAmount,
        remainingAmount
      );

      const pendingAmount = Math.max(
        remainingAmount - overdueAmount,
        0
      );

      const patientName = getPatientName(
        budget.patient
      );

      const branchName = `${budget.patient.branch.name} — ${budget.patient.branch.address}`;

      const concept =
        budget.description || "Presupuesto";

      const nextPendingPayment =
        openScheduledPayments.find(
          (payment) =>
            new Date(payment.dueDate) >= referenceDate
        );

      const firstOverduePayment =
        openScheduledPayments.find(
          (payment) =>
            new Date(payment.dueDate) < referenceDate
        );

      if (pendingAmount > 0) {
        pendingItems.push({
          id: `budget-pending-${budget.id}`,
          type: "BUDGET",
          patientId: budget.patientId,
          patientName,
          concept,
          date: (
            nextPendingPayment?.dueDate ??
            budget.createdAt
          ).toISOString(),
          amount: pendingAmount,
          branchId: budget.patient.branchId,
          branchName,
          budgetId: budget.id,
        });
      }

      if (overdueAmount > 0) {
        overdueItems.push({
          id: `budget-overdue-${budget.id}`,
          type: "BUDGET",
          patientId: budget.patientId,
          patientName,
          concept,
          date: (
            firstOverduePayment?.dueDate ??
            budget.createdAt
          ).toISOString(),
          amount: overdueAmount,
          branchId: budget.patient.branchId,
          branchName,
          budgetId: budget.id,
        });
      }
    }

    /*
     * PAGOS SUELTOS
     *
     * Solo aquellos que no pertenecen a un presupuesto,
     * para evitar contar dos veces el mismo saldo.
     */
    for (const payment of payments) {
      if (
        payment.status !== "PENDING" ||
        payment.budgetId
      ) {
        continue;
      }

      if (
        branchId &&
        payment.patient.branchId !== branchId
      ) {
        continue;
      }

      if (payment.createdAt >= periodEnd) {
        continue;
      }

      const item: DetailItem = {
        id: payment.id,
        type: "PAYMENT",
        patientId: payment.patientId,
        patientName: getPatientName(payment.patient),
        concept: payment.concept || "Pago pendiente",
        date: payment.dueDate.toISOString(),
        amount: Number(payment.amount),
        branchId: payment.patient.branchId,
        branchName: `${payment.patient.branch.name} — ${payment.patient.branch.address}`,
        budgetId: null,
      };

      if (new Date(payment.dueDate) < referenceDate) {
        overdueItems.push(item);
      } else {
        pendingItems.push(item);
      }
    }

    /*
     * GASTOS DEL MES
     */
    const expenseItems: DetailItem[] = expenses
      .filter((expense) => {
        const matchesPeriod = isInsidePeriod(
          expense.date,
          periodStart,
          periodEnd
        );

        const matchesBranch =
          !branchId || expense.branchId === branchId;

        return matchesPeriod && matchesBranch;
      })
      .map((expense) => ({
        id: expense.id,
        type: "EXPENSE",
        patientId: null,
        patientName: "",
        concept: expense.concept,
        date: expense.date.toISOString(),
        amount: Number(expense.amount),
        branchId: expense.branchId,
        branchName: expense.branch
          ? `${expense.branch.name} — ${expense.branch.address}`
          : "Gasto general",
        budgetId: null,
      }));

    const totalPaid = sumAmounts(paidItems);
    const totalPending = sumAmounts(pendingItems);
    const totalOverdue = sumAmounts(overdueItems);
    const totalExpenses = sumAmounts(expenseItems);
    const netResult = totalPaid - totalExpenses;

    /*
     * RESUMEN POR SUCURSAL
     */
    const branchRows = branches.map((branch) => {
      const branchPaid = sumAmounts(
        paidItems.filter(
          (item) => item.branchId === branch.id
        )
      );

      const branchPending = sumAmounts(
        pendingItems.filter(
          (item) => item.branchId === branch.id
        )
      );

      const branchOverdue = sumAmounts(
        overdueItems.filter(
          (item) => item.branchId === branch.id
        )
      );

      const branchExpenses = sumAmounts(
        expenseItems.filter(
          (item) => item.branchId === branch.id
        )
      );

      return {
        branch,
        paid: branchPaid,
        pending: branchPending,
        overdue: branchOverdue,
        expense: branchExpenses,
        result: branchPaid - branchExpenses,
      };
    });

    /*
     * GRÁFICO MENSUAL DEL AÑO
     */
    const monthlyData = Array.from(
      { length: 12 },
      (_, monthIndex) => {
        const { start, end } = getMonthRange(
          monthIndex,
          selectedYear
        );

        const income = payments
          .filter((payment) => {
            if (payment.status !== "PAID") {
              return false;
            }

            const paymentDate =
              payment.paidAt ?? payment.createdAt;

            const matchesPeriod = isInsidePeriod(
              paymentDate,
              start,
              end
            );

            const matchesBranch =
              !branchId ||
              payment.patient.branchId === branchId;

            return matchesPeriod && matchesBranch;
          })
          .reduce(
            (total, payment) =>
              total + Number(payment.amount),
            0
          );

        const expense = expenses
          .filter((item) => {
            const matchesPeriod = isInsidePeriod(
              item.date,
              start,
              end
            );

            const matchesBranch =
              !branchId ||
              item.branchId === branchId;

            return matchesPeriod && matchesBranch;
          })
          .reduce(
            (total, item) =>
              total + Number(item.amount),
            0
          );

        return {
          monthIndex,
          income,
          expense,
          result: income - expense,
        };
      }
    );

    return NextResponse.json({
      filters: {
        month: selectedMonth,
        year: selectedYear,
        branchId,
      },

      summary: {
        totalPaid,
        totalPending,
        totalOverdue,
        totalExpenses,
        netResult,

        paidCount: paidItems.length,
        pendingCount: pendingItems.length,
        overdueCount: overdueItems.length,
        expenseCount: expenseItems.length,
      },

      details: {
        paid: paidItems,
        pending: pendingItems,
        overdue: overdueItems,
        expenses: expenseItems,
      },

      branches,
      branchRows,
      monthlyData,
    });
  } catch (error) {
    console.error("Error al obtener el balance:", error);

    return NextResponse.json(
      {
        error: "No se pudo obtener el balance.",
      },
      {
        status: 500,
      }
    );
  }
}