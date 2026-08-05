import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const body = await req.json();

  try {
    const patient = await prisma.patient.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        dni: body.dni,
        phone: body.phone,
        branchId: body.branchId,
        planId: body.planId || null,
      },
      include: {
        branch: true,
        plan: true,
      },
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error(
      "Error al actualizar paciente:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron guardar los cambios del paciente.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  try {
    const patient = await prisma.patient.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        {
          error: "El paciente ya fue eliminado o no existe.",
        },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      /*
       * Primero buscamos los presupuestos porque sus ítems
       * dependen de ellos.
       */
      const budgets = await tx.budget.findMany({
        where: {
          patientId: id,
        },
        select: {
          id: true,
        },
      });

      const budgetIds = budgets.map((budget) => budget.id);

      /*
       * Pagos: se eliminan antes de los presupuestos
       * porque pueden estar relacionados con ambos.
       */
      await tx.payment.deleteMany({
        where: {
          patientId: id,
        },
      });

      /*
       * Ítems de los presupuestos.
       */
      if (budgetIds.length > 0) {
        await tx.budgetItem.deleteMany({
          where: {
            budgetId: {
              in: budgetIds,
            },
          },
        });
      }

      /*
       * Presupuestos.
       */
      await tx.budget.deleteMany({
        where: {
          patientId: id,
        },
      });

      /*
       * Turnos y demás información relacionada.
       */
      await tx.appointment.deleteMany({
        where: {
          patientId: id,
        },
      });

      await tx.notification.deleteMany({
        where: {
          patientId: id,
        },
      });

      await tx.testimonial.deleteMany({
        where: {
          patientId: id,
        },
      });

      await tx.clinicalHistory.deleteMany({
        where: {
          patientId: id,
        },
      });

      await tx.odontogram.deleteMany({
        where: {
          patientId: id,
        },
      });

      /*
       * Finalmente eliminamos al paciente.
       */
      await tx.patient.delete({
        where: {
          id,
        },
      });
    });

    return NextResponse.json({
      message:
        "Paciente y todos sus datos asociados fueron eliminados correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar paciente:", error);

    return NextResponse.json(
      {
        error:
          "No se pudo eliminar completamente el paciente.",
      },
      { status: 500 }
    );
  }
}