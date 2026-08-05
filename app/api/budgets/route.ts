import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CreateBudgetItem = {
  serviceName?: string;
  quantity?: number | string;
  unitPrice?: number | string;
};

type CreateBudgetBody = {
  patientId?: string;
  doctorId?: string;
  description?: string | null;
  items?: CreateBudgetItem[];
};

function calculateBudgetStatus(
  total: number,
  paidAmount: number
): "CREATED" | "IN_PROGRESS" | "COMPLETED" {
  if (total > 0 && paidAmount >= total) {
    return "COMPLETED";
  }

  if (paidAmount > 0) {
    return "IN_PROGRESS";
  }

  return "CREATED";
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "DOCTOR"
    ) {
      return NextResponse.json(
        {
          error: "No tenés permisos para consultar presupuestos.",
        },
        {
          status: 403,
        }
      );
    }

    let doctorId: string | undefined;

    if (session.user.role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
        },
      });

      if (!doctor) {
        return NextResponse.json(
          {
            error: "No se encontró el perfil profesional.",
          },
          {
            status: 404,
          }
        );
      }

      doctorId = doctor.id;
    }

    const budgets = await prisma.budget.findMany({
      where: doctorId
        ? {
            doctorId,
          }
        : undefined,

      include: {
        patient: {
          include: {
            plan: true,
            branch: true,
          },
        },

        doctor: {
          include: {
            user: true,
          },
        },

        items: true,

        payments: {
          where: {
            status: "PAID",
          },
          orderBy: [
            {
              paidAt: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const normalizedBudgets = budgets.map((budget) => {
      const subtotal = Number(budget.subtotal);
      const discount = Number(budget.discount);
      const total = Number(budget.total);

      const paidAmount = budget.payments.reduce(
        (accumulator, payment) => {
          return accumulator + Number(payment.amount);
        },
        0
      );

      const remainingAmount = Math.max(total - paidAmount, 0);

      const status = calculateBudgetStatus(total, paidAmount);

      return {
        ...budget,

        subtotal,
        discount,
        total,

        paidAmount,
        remainingAmount,
        status,

        payments: budget.payments.map((payment) => ({
          ...payment,
          amount: Number(payment.amount),
        })),
      };
    });

    return NextResponse.json(normalizedBudgets);
  } catch (error) {
    console.error("Error obteniendo presupuestos:", error);

    return NextResponse.json(
      {
        error: "No se pudieron obtener los presupuestos.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "DOCTOR"
    ) {
      return NextResponse.json(
        {
          error: "No tenés permisos para crear presupuestos.",
        },
        {
          status: 403,
        }
      );
    }

    const body = (await request.json()) as CreateBudgetBody;

    const patientId =
      typeof body.patientId === "string"
        ? body.patientId.trim()
        : "";

    const doctorId =
      typeof body.doctorId === "string"
        ? body.doctorId.trim()
        : "";

    if (!patientId || !doctorId) {
      return NextResponse.json(
        {
          error:
            "El paciente y el especialista son obligatorios.",
        },
        {
          status: 400,
        }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: {
        id: patientId,
      },
      include: {
        plan: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        {
          error: "Paciente no encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const doctor = await prisma.doctor.findUnique({
      where: {
        id: doctorId,
      },
      select: {
        id: true,
        active: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        {
          error: "Especialista no encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (!doctor.active) {
      return NextResponse.json(
        {
          error: "El especialista seleccionado está inactivo.",
        },
        {
          status: 400,
        }
      );
    }

    if (session.user.role === "DOCTOR") {
      const sessionDoctor = await prisma.doctor.findUnique({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
        },
      });

      if (!sessionDoctor || sessionDoctor.id !== doctorId) {
        return NextResponse.json(
          {
            error:
              "No podés crear un presupuesto asignado a otro especialista.",
          },
          {
            status: 403,
          }
        );
      }
    }

    const items = Array.isArray(body.items) ? body.items : [];

    const validItems = items
      .map((item) => {
        const serviceName =
          typeof item.serviceName === "string"
            ? item.serviceName.trim()
            : "";

        const quantityValue = Number(item.quantity ?? 1);
        const unitPriceValue = Number(item.unitPrice ?? 0);

        const quantity =
          Number.isFinite(quantityValue) && quantityValue > 0
            ? Math.trunc(quantityValue)
            : 1;

        const unitPrice =
          Number.isFinite(unitPriceValue) && unitPriceValue >= 0
            ? unitPriceValue
            : 0;

        return {
          serviceName,
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        };
      })
      .filter((item) => item.serviceName.length > 0);

    if (validItems.length === 0) {
      return NextResponse.json(
        {
          error:
            "El presupuesto debe contener al menos un tratamiento.",
        },
        {
          status: 400,
        }
      );
    }

    const subtotal = validItems.reduce(
      (accumulator, item) => accumulator + item.total,
      0
    );

    const discount =
      patient.plan?.active === true
        ? Number(patient.plan.discount || 0)
        : 0;

    const total = Math.max(
      subtotal - subtotal * (discount / 100),
      0
    );

    const description =
      typeof body.description === "string" &&
      body.description.trim().length > 0
        ? body.description.trim()
        : null;

    const budget = await prisma.budget.create({
      data: {
        patientId,
        doctorId,
        description,

        subtotal: new Prisma.Decimal(subtotal),
        discount: new Prisma.Decimal(discount),
        total: new Prisma.Decimal(total),

        status: "CREATED",

        items: {
          create: validItems.map((item) => ({
            serviceName: item.serviceName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },

      include: {
        patient: {
          include: {
            plan: true,
            branch: true,
          },
        },

        doctor: {
          include: {
            user: true,
          },
        },

        items: true,
        payments: true,
      },
    });

    const doctorName =
      budget.doctor.name ||
      budget.doctor.user?.name ||
      "Tu odontólogo";

    await prisma.notification.create({
      data: {
        patientId: budget.patientId,
        doctorId: budget.doctorId,
        budgetId: budget.id,

        title: "Nuevo presupuesto",

        message: `${doctorName} creó un nuevo presupuesto. Más detalles en "Presupuestos".`,

        type: "BUDGET",
        actor: "DOCTOR",

        actionUrl: "/dashboard/patient/presupuestos",
      },
    });

    return NextResponse.json(
      {
        ...budget,

        subtotal: Number(budget.subtotal),
        discount: Number(budget.discount),
        total: Number(budget.total),

        paidAmount: 0,
        remainingAmount: Number(budget.total),
        status: "CREATED",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Error creando presupuesto:", error);

    return NextResponse.json(
      {
        error: "No se pudo crear el presupuesto.",
      },
      {
        status: 500,
      }
    );
  }
}