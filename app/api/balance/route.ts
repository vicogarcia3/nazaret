import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isSameMonthAndYear(
  date: Date,
  month: number,
  year: number
) {
  return date.getMonth() === month && date.getFullYear() === year;
}

function isPaymentOverdue(payment: {
  status: string;
  dueDate: Date;
}) {
  if (payment.status !== "PENDING") {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(payment.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const currentDate = new Date();

    const monthParam = Number(searchParams.get("month"));
    const yearParam = Number(searchParams.get("year"));
    const branchId = searchParams.get("branchId") || "";

    const selectedMonth = Number.isInteger(monthParam)
      ? monthParam
      : currentDate.getMonth();

    const selectedYear = Number.isInteger(yearParam)
      ? yearParam
      : currentDate.getFullYear();

    const [branches, payments, budgets, expenses] =
      await Promise.all([
        prisma.branch.findMany({
          orderBy: {
            name: "asc",
          },
        }),

        prisma.payment.findMany({
          include: {
            patient: {
              include: {
                branch: true,
              },
            },
            budget: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        }),

        prisma.budget.findMany({
          include: {
            patient: {
              include: {
                branch: true,
              },
            },
            payments: {
              where: {
                status: "PAID",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),

        prisma.expense.findMany({
          include: {
            branch: true,
          },
          orderBy: {
            date: "desc",
          },
        }),
      ]);

    const paidPaymentsForPeriod = payments.filter((payment) => {
      if (payment.status !== "PAID") {
        return false;
      }

      const paymentDate =
        payment.paidAt || payment.createdAt;

      const matchesPeriod = isSameMonthAndYear(
        new Date(paymentDate),
        selectedMonth,
        selectedYear
      );

      const matchesBranch =
        !branchId ||
        payment.patient.branchId === branchId;

      return matchesPeriod && matchesBranch;
    });

    const standalonePendingPayments = payments.filter(
      (payment) => {
        if (
          payment.status !== "PENDING" ||
          payment.budgetId
        ) {
          return false;
        }

        const matchesPeriod = isSameMonthAndYear(
          new Date(payment.dueDate),
          selectedMonth,
          selectedYear
        );

        const matchesBranch =
          !branchId ||
          payment.patient.branchId === branchId;

        return (
          matchesPeriod &&
          matchesBranch &&
          !isPaymentOverdue(payment)
        );
      }
    );

    const overdueStandalonePayments = payments.filter(
      (payment) => {
        if (payment.budgetId) {
          return false;
        }

        const matchesPeriod = isSameMonthAndYear(
          new Date(payment.dueDate),
          selectedMonth,
          selectedYear
        );

        const matchesBranch =
          !branchId ||
          payment.patient.branchId === branchId;

        return (
          matchesPeriod &&
          matchesBranch &&
          isPaymentOverdue(payment)
        );
      }
    );

    const budgetsForPeriod = budgets.filter((budget) => {
      const matchesPeriod = isSameMonthAndYear(
        new Date(budget.createdAt),
        selectedMonth,
        selectedYear
      );

      const matchesBranch =
        !branchId ||
        budget.patient.branchId === branchId;

      return matchesPeriod && matchesBranch;
    });

    const normalizedBudgets = budgetsForPeriod.map(
      (budget) => {
        const total = Number(budget.total);

        const paidAmount = budget.payments.reduce(
          (accumulator, payment) =>
            accumulator + Number(payment.amount),
          0
        );

        const remainingAmount = Math.max(
          total - paidAmount,
          0
        );

        return {
          id: budget.id,
          branchId: budget.patient.branchId,
          total,
          paidAmount,
          remainingAmount,
          createdAt: budget.createdAt,
        };
      }
    );

    /*
     * GASTOS DEL PERÍODO
     */
    const expensesForPeriod = expenses.filter((expense) => {
      const matchesPeriod = isSameMonthAndYear(
        new Date(expense.date),
        selectedMonth,
        selectedYear
      );

      const matchesBranch =
        !branchId ||
        expense.branchId === branchId;

      return matchesPeriod && matchesBranch;
    });

    const totalPaid = paidPaymentsForPeriod.reduce(
      (accumulator, payment) =>
        accumulator + Number(payment.amount),
      0
    );

    const totalBudgetPending = normalizedBudgets.reduce(
      (accumulator, budget) =>
        accumulator + budget.remainingAmount,
      0
    );

    const totalStandalonePending =
      standalonePendingPayments.reduce(
        (accumulator, payment) =>
          accumulator + Number(payment.amount),
        0
      );

    const totalPending =
      totalBudgetPending + totalStandalonePending;

    const totalOverdue =
      overdueStandalonePayments.reduce(
        (accumulator, payment) =>
          accumulator + Number(payment.amount),
        0
      );

    const totalExpenses = expensesForPeriod.reduce(
      (accumulator, expense) =>
        accumulator + Number(expense.amount),
      0
    );

    const netResult = totalPaid - totalExpenses;

    /*
     * RESUMEN POR SUCURSAL
     */
    const branchRows = branches.map((branch) => {
      const branchPaid = paidPaymentsForPeriod
        .filter(
          (payment) =>
            payment.patient.branchId === branch.id
        )
        .reduce(
          (accumulator, payment) =>
            accumulator + Number(payment.amount),
          0
        );

      const branchBudgetPending = normalizedBudgets
        .filter(
          (budget) => budget.branchId === branch.id
        )
        .reduce(
          (accumulator, budget) =>
            accumulator + budget.remainingAmount,
          0
        );

      const branchStandalonePending =
        standalonePendingPayments
          .filter(
            (payment) =>
              payment.patient.branchId === branch.id
          )
          .reduce(
            (accumulator, payment) =>
              accumulator + Number(payment.amount),
            0
          );

      const branchPending =
        branchBudgetPending +
        branchStandalonePending;

      const branchOverdue =
        overdueStandalonePayments
          .filter(
            (payment) =>
              payment.patient.branchId === branch.id
          )
          .reduce(
            (accumulator, payment) =>
              accumulator + Number(payment.amount),
            0
          );

      const branchExpenses = expensesForPeriod
        .filter(
          (expense) =>
            expense.branchId === branch.id
        )
        .reduce(
          (accumulator, expense) =>
            accumulator + Number(expense.amount),
          0
        );

      return {
        branch: {
          id: branch.id,
          name: branch.name,
          address: branch.address,
        },
        paid: branchPaid,
        pending: branchPending,
        overdue: branchOverdue,
        expense: branchExpenses,
        result: branchPaid - branchExpenses,
      };
    });

    const monthlyData = Array.from(
      { length: 12 },
      (_, monthIndex) => {
        const monthlyPaid = payments
          .filter((payment) => {
            if (payment.status !== "PAID") {
              return false;
            }

            const paymentDate =
              payment.paidAt || payment.createdAt;

            const matchesPeriod = isSameMonthAndYear(
              new Date(paymentDate),
              monthIndex,
              selectedYear
            );

            const matchesBranch =
              !branchId ||
              payment.patient.branchId === branchId;

            return matchesPeriod && matchesBranch;
          })
          .reduce(
            (accumulator, payment) =>
              accumulator + Number(payment.amount),
            0
          );

        const monthlyExpenses = expenses
          .filter((expense) => {
            const matchesPeriod =
              isSameMonthAndYear(
                new Date(expense.date),
                monthIndex,
                selectedYear
              );

            const matchesBranch =
              !branchId ||
              expense.branchId === branchId;

            return matchesPeriod && matchesBranch;
          })
          .reduce(
            (accumulator, expense) =>
              accumulator + Number(expense.amount),
            0
          );

        return {
          monthIndex,
          income: monthlyPaid,
          expense: monthlyExpenses,
          result: monthlyPaid - monthlyExpenses,
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
      },

      pendingBreakdown: {
        budgets: totalBudgetPending,
        standalonePayments: totalStandalonePending,
      },

      branches,
      branchRows,
      expenses: expensesForPeriod,
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