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
  doctorIds?: string[];
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

/*
 * Verifica si un paciente pertenece al especialista
 * mediante el campo:
 *
 * ClinicalHistory.data.odontologo
 *
 * Ejemplo:
 *
 * {
 *   odontologo: "Victoria Garcia"
 * }
 */
async function doctorCanAccessPatient(
  userId: string,
  patientId: string
) {
  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!doctor) {
    return {
      allowed: false,
      doctor: null,
    };
  }

  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      histories: {
        some: {
          data: {
            path: ["odontologo"],
            equals: doctor.name,
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  return {
    allowed: Boolean(patient),
    doctor,
  };
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
          error:
            "No tenés permisos para consultar presupuestos.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ADMIN:
     * ve todos los presupuestos.
     *
     * DOCTOR:
     * ve los presupuestos de los pacientes
     * que están vinculados a él mediante
     * la Historia Clínica.
     */
    let where:
      | Prisma.BudgetWhereInput
      | undefined = undefined;

    if (session.user.role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!doctor) {
        return NextResponse.json(
          {
            error:
              "No se encontró el perfil profesional.",
          },
          {
            status: 404,
          }
        );
      }

      where = {
        patient: {
          histories: {
            some: {
              data: {
                path: ["odontologo"],
                equals: doctor.name,
              },
            },
          },
        },
      };
    }

    const budgets = await prisma.budget.findMany({
      where,

      include: {
        patient: {
          include: {
            plan: true,
            branch: true,
          },
        },

        doctors: {
          include: {
            doctor: {
              include: {
                user: true,
              },
            },
          },

          orderBy: {
            id: "asc",
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
        (accumulator, payment) =>
          accumulator + Number(payment.amount),
        0
      );

      const remainingAmount = Math.max(
        total - paidAmount,
        0
      );

      const status = calculateBudgetStatus(
        total,
        paidAmount
      );

      return {
        ...budget,

        subtotal,
        discount,
        total,

        paidAmount,
        remainingAmount,

        status,

        doctors: budget.doctors.map(
          ({ doctor }) => ({
            id: doctor.id,

            name:
              doctor.name ||
              doctor.user?.name ||
              "Especialista sin nombre",

            specialty: doctor.specialty,

            professionalLicense:
              doctor.professionalLicense,
          })
        ),

        payments: budget.payments.map(
          (payment) => ({
            ...payment,
            amount: Number(payment.amount),
          })
        ),
      };
    });

    return NextResponse.json(
      normalizedBudgets
    );
  } catch (error) {
    console.error(
      "Error obteniendo presupuestos:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron obtener los presupuestos.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
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
          error:
            "No tenés permisos para crear presupuestos.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      (await request.json()) as CreateBudgetBody;

    const patientId =
      typeof body.patientId === "string"
        ? body.patientId.trim()
        : "";

    let doctorIds = Array.isArray(
      body.doctorIds
    )
      ? [
          ...new Set(
            body.doctorIds
              .filter(
                (
                  doctorId
                ): doctorId is string =>
                  typeof doctorId === "string"
              )
              .map((doctorId) =>
                doctorId.trim()
              )
              .filter(Boolean)
          ),
        ]
      : [];

    if (!patientId) {
      return NextResponse.json(
        {
          error:
            "El paciente es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Si es DOCTOR:
     *
     * El presupuesto solamente puede ser creado
     * para uno de sus pacientes de Historia Clínica.
     *
     * Además, el presupuesto queda asignado
     * automáticamente al especialista logueado.
     */
    let sessionDoctor:
      | {
          id: string;
          name: string;
        }
      | null = null;

    if (session.user.role === "DOCTOR") {
      const access =
        await doctorCanAccessPatient(
          session.user.id,
          patientId
        );

      if (!access.allowed || !access.doctor) {
        return NextResponse.json(
          {
            error:
              "El paciente no está vinculado a este profesional mediante la historia clínica.",
          },
          {
            status: 403,
          }
        );
      }

      sessionDoctor = access.doctor;

      /*
       * El especialista solo puede crear presupuestos
       * asignados a sí mismo.
       */
      doctorIds = [sessionDoctor.id];
    }

    /*
     * ADMIN debe seleccionar al menos un especialista.
     *
     * DOCTOR ya tiene automáticamente su propio ID.
     */
    if (
      session.user.role === "ADMIN" &&
      doctorIds.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Seleccioná al menos un especialista.",
        },
        {
          status: 400,
        }
      );
    }

    const patient =
      await prisma.patient.findUnique({
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
          error:
            "Paciente no encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Validamos los especialistas seleccionados.
     */
    const selectedDoctors =
      await prisma.doctor.findMany({
        where: {
          id: {
            in: doctorIds,
          },
        },

        select: {
          id: true,
          name: true,
          active: true,
          specialty: true,
          professionalLicense: true,

          user: {
            select: {
              name: true,
            },
          },
        },
      });

    if (
      selectedDoctors.length !==
      doctorIds.length
    ) {
      return NextResponse.json(
        {
          error:
            "Uno o más especialistas seleccionados no existen.",
        },
        {
          status: 404,
        }
      );
    }

    const inactiveDoctor =
      selectedDoctors.find(
        (doctor) => !doctor.active
      );

    if (inactiveDoctor) {
      return NextResponse.json(
        {
          error: `El especialista ${
            inactiveDoctor.name ||
            inactiveDoctor.user?.name ||
            ""
          } está inactivo.`,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * En caso de DOCTOR comprobamos nuevamente
     * que el doctor seleccionado sea el mismo
     * que está logueado.
     */
    if (
      session.user.role === "DOCTOR" &&
      sessionDoctor &&
      (
        doctorIds.length !== 1 ||
        doctorIds[0] !== sessionDoctor.id
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Los profesionales solamente pueden crear presupuestos asignados a sí mismos.",
        },
        {
          status: 403,
        }
      );
    }

    const items = Array.isArray(body.items)
      ? body.items
      : [];

    const validItems = items
      .map((item) => {
        const serviceName =
          typeof item.serviceName === "string"
            ? item.serviceName.trim()
            : "";

        const quantityValue = Number(
          item.quantity ?? 1
        );

        const unitPriceValue = Number(
          item.unitPrice ?? 0
        );

        const quantity =
          Number.isFinite(
            quantityValue
          ) && quantityValue > 0
            ? Math.trunc(
                quantityValue
              )
            : 1;

        const unitPrice =
          Number.isFinite(
            unitPriceValue
          ) && unitPriceValue >= 0
            ? unitPriceValue
            : 0;

        return {
          serviceName,
          quantity,
          unitPrice,
          total:
            quantity * unitPrice,
        };
      })
      .filter(
        (item) =>
          item.serviceName.length > 0 &&
          item.unitPrice >= 0
      );

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
      (accumulator, item) =>
        accumulator + item.total,
      0
    );

    const discount =
      patient.plan?.visible === true
        ? Number(
            patient.plan.discount || 0
          )
        : 0;

    const total = Math.max(
      subtotal -
        subtotal *
          (discount / 100),
      0
    );

    const description =
      typeof body.description === "string" &&
      body.description.trim().length > 0
        ? body.description.trim()
        : null;

    const budget =
      await prisma.budget.create({
        data: {
          patientId,

          description,

          subtotal:
            new Prisma.Decimal(
              subtotal
            ),

          discount:
            new Prisma.Decimal(
              discount
            ),

          total:
            new Prisma.Decimal(
              total
            ),

          status: "CREATED",

          doctors: {
            create: doctorIds.map(
              (doctorId) => ({
                doctorId,
              })
            ),
          },

          items: {
            create: validItems.map(
              (item) => ({
                serviceName:
                  item.serviceName,

                quantity:
                  item.quantity,

                unitPrice:
                  item.unitPrice,

                total:
                  item.total,
              })
            ),
          },
        },

        include: {
          patient: {
            include: {
              plan: true,
              branch: true,
            },
          },

          doctors: {
            include: {
              doctor: {
                include: {
                  user: true,
                },
              },
            },
          },

          items: true,

          payments: true,
        },
      });

    const doctorNames =
      budget.doctors
        .map(
          ({ doctor }) =>
            doctor.name ||
            doctor.user?.name ||
            "Especialista"
        )
        .join(", ");

    /*
     * Notification todavía tiene un único doctorId.
     * Usamos el primer especialista como actor principal.
     */
    const primaryDoctorId =
      budget.doctors[0]?.doctorId;

    /*
    * La notificación siempre se envía al paciente.
    *
    * Si el presupuesto lo crea ADMIN:
    * también se informa al especialista asignado.
    *
    * Si lo crea DOCTOR:
    * no se envía una notificación al mismo doctor
    * que acaba de crear el presupuesto.
    */
    const notificationDoctorId =
      session.user.role === "ADMIN"
        ? primaryDoctorId
        : null;

    await prisma.notification.create({
      data: {
        patientId: budget.patientId,
        doctorId: notificationDoctorId,
        budgetId: budget.id,

        title: "Nuevo presupuesto",

        message:
          `${doctorNames} creó un nuevo presupuesto. Más detalles en "Presupuestos".`,

        type: "BUDGET",

        actor: "DOCTOR",

        actionUrl:
          "/dashboard/patient/presupuestos",
      },
    });

    return NextResponse.json(
      {
        ...budget,

        subtotal:
          Number(
            budget.subtotal
          ),

        discount:
          Number(
            budget.discount
          ),

        total:
          Number(
            budget.total
          ),

        doctors:
          budget.doctors.map(
            ({ doctor }) => ({
              id: doctor.id,

              name:
                doctor.name ||
                doctor.user?.name ||
                "Especialista sin nombre",

              specialty:
                doctor.specialty,

              professionalLicense:
                doctor.professionalLicense,
            })
          ),

        paidAmount: 0,

        remainingAmount:
          Number(
            budget.total
          ),

        status:
          "CREATED",
      },

      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error creando presupuesto:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo crear el presupuesto.",
      },
      {
        status: 500,
      }
    );
  }
}