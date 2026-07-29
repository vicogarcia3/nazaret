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
    console.error("Error al actualizar paciente:", error);

    return NextResponse.json(
      {
        error: "No se pudieron guardar los cambios del paciente.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

  try {
    const appointmentsCount = await prisma.appointment.count({
      where: {
        patientId: id,
      },
    });

    if (appointmentsCount > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar este paciente porque tiene turnos asociados. Podés editar sus datos, pero no borrarlo.",
        },
        { status: 400 }
      );
    }

    await prisma.patient.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Paciente eliminado correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar paciente:", error);

    const errorMessage =
      error instanceof Error ? error.message : String(error);

    if (
      errorMessage.includes("Budget_patientId_fkey") ||
      errorMessage.includes('referenced from table "Budget"')
    ) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar este paciente porque tiene presupuestos asociados. Para conservar su historial financiero, podés editar sus datos, pero no borrarlo.",
        },
        { status: 400 }
      );
    }

    if (
      errorMessage.includes("Payment_patientId_fkey") ||
      errorMessage.includes('referenced from table "Payment"')
    ) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar este paciente porque tiene pagos asociados. Para conservar su historial financiero, podés editar sus datos, pero no borrarlo.",
        },
        { status: 400 }
      );
    }

    if (
      errorMessage.includes("Appointment_patientId_fkey") ||
      errorMessage.includes('referenced from table "Appointment"')
    ) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar este paciente porque tiene turnos asociados. Podés editar sus datos, pero no borrarlo.",
        },
        { status: 400 }
      );
    }

    if (
      errorMessage.includes("ClinicalHistory") ||
      errorMessage.includes("MedicalRecord")
    ) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar este paciente porque tiene historia clínica asociada. Podés editar sus datos, pero no borrarlo.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Ocurrió un error al eliminar el paciente.",
      },
      { status: 500 }
    );
  }
}