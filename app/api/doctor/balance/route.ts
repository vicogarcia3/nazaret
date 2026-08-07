import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getMonthRange(year: number, month: number) {
  return {
    start: new Date(year, month, 1, 0, 0, 0, 0),
    end: new Date(year, month + 1, 1, 0, 0, 0, 0),
  };
}

function isValidMonth(value: number) {
  return Number.isInteger(value) && value >= 0 && value <= 11;
}

function isValidYear(value: number) {
  return Number.isInteger(value) && value >= 2000 && value <= 2100;
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const now = new Date();

    const requestedMonth = Number(
      searchParams.get("month") ?? now.getMonth()
    );

    const requestedYear = Number(
      searchParams.get("year") ?? now.getFullYear()
    );

    const branchId = searchParams.get("branchId") || "";

    if (
      !isValidMonth(requestedMonth) ||
      !isValidYear(requestedYear)
    ) {
      return NextResponse.json(
        { error: "El período seleccionado no es válido." },
        { status: 400 }
      );
    }

    const doctor = await prisma.doctor.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        branches: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
              },
            },
          },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Perfil de odontólogo no encontrado." },
        { status: 404 }
      );
    }

    const doctorBranchIds = doctor.branches.map(
      (doctorBranch) => doctorBranch.branchId
    );

    if (branchId && !doctorBranchIds.includes(branchId)) {
      return NextResponse.json(
        { error: "No tenés acceso a esa sucursal." },
        { status: 403 }
      );
    }

    const { start, end } = getMonthRange(
      requestedYear,
      requestedMonth
    );

    const paymentBranchFilter = branchId
      ? {
          patient: {
            branchId,
          },
        }
      : {
          patient: {
            branchId: {
              in: doctorBranchIds,
            },
          },
        };

    const appointmentBranchFilter = branchId
      ? {
          branchId,
        }
      : {
          branchId: {
            in: doctorBranchIds,
          },
        };

    const [payments, completedAppointments, yearlyPayments] =
      await Promise.all([
        prisma.payment.findMany({
          where: {
            budget: {
              is: {
                doctors: {
                  some: {
                    doctorId: doctor.id,
                  },
                },
              },
            },
            ...paymentBranchFilter,
            OR: [
              {
                paidAt: {
                  gte: start,
                  lt: end,
                },
              },
              {
                paidAt: null,
                dueDate: {
                  gte: start,
                  lt: end,
                },
              },
            ],
          },
          include: {
            patient: {
              include: {
                branch: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    city: true,
                  },
                },
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
            budget: {
              select: {
                id: true,
                description: true,
                total: true,
                status: true,
              },
            },
          },
          orderBy: [
            {
              dueDate: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
        }),

        prisma.appointment.count({
          where: {
            doctorId: doctor.id,
            status: "COMPLETED",
            date: {
              gte: start,
              lt: end,
            },
            ...appointmentBranchFilter,
          },
        }),

        prisma.payment.findMany({
          where: {
            budget: {
              is: {
                doctors: {
                  some: {
                    doctorId: doctor.id,
                  },
                },
              },
            },
            status: "PAID",
            paidAt: {
              gte: new Date(
                requestedYear,
                0,
                1,
                0,
                0,
                0,
                0
              ),
              lt: new Date(
                requestedYear + 1,
                0,
                1,
                0,
                0,
                0,
                0
              ),
            },
            ...paymentBranchFilter,
          },
          select: {
            amount: true,
            paidAt: true,
          },
        }),
      ]);

    const totalPaid = payments
      .filter((payment) => payment.status === "PAID")
      .reduce(
        (total, payment) => total + Number(payment.amount),
        0
      );

    const totalPending = payments
      .filter((payment) => payment.status === "PENDING")
      .reduce(
        (total, payment) => total + Number(payment.amount),
        0
      );

    const today = new Date();
      
    const totalOverdue = payments
      .filter(
        (payment) =>
          payment.status === "PENDING" &&
          payment.dueDate < today
      )
      .reduce(
        (total, payment) => total + Number(payment.amount),
        0
      );

    const monthlyIncome = Array.from(
      { length: 12 },
      (_, monthIndex) => ({
        month: monthIndex,
        income: 0,
      })
    );

    yearlyPayments.forEach((payment) => {
      if (!payment.paidAt) {
        return;
      }

      const monthIndex = payment.paidAt.getMonth();

      monthlyIncome[monthIndex].income += Number(
        payment.amount
      );
    });

    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      concept: payment.concept,
      status: payment.status,
      dueDate: payment.dueDate,
      paidAt: payment.paidAt,
      patient: {
        id: payment.patient.id,
        name:
          payment.patient.user?.name ||
          "Paciente sin nombre",
        email: payment.patient.user?.email || null,
      },
      branch: payment.patient.branch,
      budget: payment.budget
        ? {
            id: payment.budget.id,
            description: payment.budget.description,
            total: Number(payment.budget.total),
            status: payment.budget.status,
          }
        : null,
    }));

    return NextResponse.json({
      doctor: {
        id: doctor.id,
        name: doctor.name || doctor.user?.name || "Especialista",
      },
      period: {
        month: requestedMonth,
        year: requestedYear,
      },
      branches: doctor.branches.map(
        (doctorBranch) => doctorBranch.branch
      ),
      summary: {
        paid: totalPaid,
        pending: totalPending,
        overdue: totalOverdue,
        completedAppointments,
        paymentCount: payments.length,
      },
      payments: formattedPayments,
      monthlyIncome,
    });
  } catch (error) {
    console.error(
      "ERROR OBTENIENDO BALANCE DEL DOCTOR:",
      error
    );

    return NextResponse.json(
      { error: "No se pudo cargar el balance." },
      { status: 500 }
    );
  }
}