import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  notifyAppointmentCancelled,
  notifyAppointmentRescheduled,
} from "@/lib/notifications";

const MINIMUM_NOTICE_HOURS = 24;

function hasEnoughNotice(appointmentDate: Date) {
  const modificationLimit = new Date(
    Date.now() + MINIMUM_NOTICE_HOURS * 60 * 60 * 1000
  );

  return appointmentDate > modificationLimit;
}

function getDoctorName(
  doctor: {
    user?: {
      name?: string | null;
    } | null;
  }
) {
  return doctor.user?.name?.trim() || "el profesional";
}

/**
 * Una falla al crear la notificación no debe cancelar
 * una modificación del turno que ya se realizó correctamente.
 */
async function safelyCreateNotification(
  callback: () => Promise<unknown>
) {
  try {
    await callback();
  } catch (error) {
    console.error(
      "No se pudo crear la notificación del turno:",
      error
    );
  }
}

async function getAuthorizedAppointment(
  appointmentId: string,
  userId: string,
  role: string
) {
  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
    },
    include: {
      patient: {
        select: {
          id: true,
          userId: true,
          branchId: true,
        },
      },
      doctor: {
        include: {
          user: true,
        },
      },
      branch: true,
    },
  });

  if (!appointment) {
    return {
      error: NextResponse.json(
        { error: "Turno no encontrado." },
        { status: 404 }
      ),
    };
  }

  if (role === "ADMIN") {
    return { appointment };
  }

  if (
    role === "PATIENT" &&
    appointment.patient.userId === userId
  ) {
    return { appointment };
  }

  return {
    error: NextResponse.json(
      {
        error:
          "No tenés permiso para acceder a este turno.",
      },
      { status: 403 }
    ),
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const result = await getAuthorizedAppointment(
      id,
      session.user.id,
      session.user.role
    );

    if (result.error) {
      return result.error;
    }

    return NextResponse.json(result.appointment);
  } catch (error) {
    console.error("Error al consultar turno:", error);

    return NextResponse.json(
      { error: "No se pudo consultar el turno." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const result = await getAuthorizedAppointment(
      id,
      session.user.id,
      session.user.role
    );

    if (result.error) {
      return result.error;
    }

    const appointment = result.appointment;
    const doctorName = getDoctorName(appointment.doctor);

    /*
     * El administrador elimina físicamente el turno,
     * tal como ya funcionaba en tu sistema.
     */
    if (session.user.role === "ADMIN") {
      await prisma.appointment.delete({
        where: {
          id,
        },
      });

      await safelyCreateNotification(() =>
        notifyAppointmentCancelled({
          patientId: appointment.patientId,
          appointmentId: appointment.id,
          doctorName,
          date: appointment.date,
        })
      );

      return NextResponse.json({
        message: "Turno eliminado.",
      });
    }

    if (appointment.status === "CANCELED") {
      return NextResponse.json(
        { error: "El turno ya fue cancelado." },
        { status: 400 }
      );
    }

    if (appointment.status === "COMPLETED") {
      return NextResponse.json(
        {
          error:
            "No podés cancelar un turno completado.",
        },
        { status: 400 }
      );
    }

    if (appointment.date <= new Date()) {
      return NextResponse.json(
        {
          error:
            "No podés cancelar un turno que ya pasó.",
        },
        { status: 400 }
      );
    }

    if (!hasEnoughNotice(appointment.date)) {
      return NextResponse.json(
        {
          error:
            "Este turno ya no puede cancelarse desde el portal porque faltan menos de 24 horas. Comunicate con el consultorio.",
        },
        { status: 400 }
      );
    }

    await prisma.appointment.update({
      where: {
        id,
      },
      data: {
        status: "CANCELED",
        reminderSent: false,
      },
    });

    await safelyCreateNotification(() =>
      notifyAppointmentCancelled({
        patientId: appointment.patientId,
        appointmentId: appointment.id,
        doctorName,
        date: appointment.date,
      })
    );

    return NextResponse.json({
      message: "El turno fue cancelado correctamente.",
    });
  } catch (error) {
    console.error("Error al cancelar turno:", error);

    return NextResponse.json(
      { error: "No se pudo cancelar el turno." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const result = await getAuthorizedAppointment(
      id,
      session.user.id,
      session.user.role
    );

    if (result.error) {
      return result.error;
    }

    const appointment = result.appointment;
    const previousDate = appointment.date;

    /*
     * MODIFICACIÓN REALIZADA POR EL ADMINISTRADOR
     */
    if (session.user.role === "ADMIN") {
      let newDate: Date | undefined;

      if (body.date) {
        newDate = new Date(body.date);

        if (Number.isNaN(newDate.getTime())) {
          return NextResponse.json(
            { error: "La nueva fecha no es válida." },
            { status: 400 }
          );
        }
      }

      const updatedAppointment =
        await prisma.appointment.update({
          where: {
            id,
          },
          data: {
            ...(newDate && {
              date: newDate,
              reminderSent: false,
            }),
            ...(body.status && {
              status: body.status,
            }),
            ...(body.notes !== undefined && {
              notes: body.notes || null,
            }),
          },
          include: {
            doctor: {
              include: {
                user: true,
              },
            },
            branch: true,
          },
        });

      const doctorName = getDoctorName(
        updatedAppointment.doctor
      );

      const wasCancelled =
        appointment.status !== "CANCELED" &&
        updatedAppointment.status === "CANCELED";

      const wasRescheduled =
        previousDate.getTime() !==
        updatedAppointment.date.getTime();

      /*
       * Si el administrador cancela y también cambia la fecha
       * en la misma operación, priorizamos la cancelación.
       */
      if (wasCancelled) {
        await safelyCreateNotification(() =>
          notifyAppointmentCancelled({
            patientId: appointment.patientId,
            appointmentId: appointment.id,
            doctorName,
            date: previousDate,
          })
        );
      } else if (wasRescheduled) {
        await safelyCreateNotification(() =>
          notifyAppointmentRescheduled({
            patientId: appointment.patientId,
            appointmentId: appointment.id,
            doctorName,
            previousDate,
            newDate: updatedAppointment.date,
          })
        );
      }

      return NextResponse.json(updatedAppointment);
    }

    /*
     * REPROGRAMACIÓN REALIZADA POR EL PACIENTE
     */
    if (
      appointment.status === "CANCELED" ||
      appointment.status === "COMPLETED"
    ) {
      return NextResponse.json(
        {
          error: "Este turno no puede ser reprogramado.",
        },
        { status: 400 }
      );
    }

    if (appointment.date <= new Date()) {
      return NextResponse.json(
        {
          error:
            "No podés reprogramar un turno que ya pasó.",
        },
        { status: 400 }
      );
    }

    if (!hasEnoughNotice(appointment.date)) {
      return NextResponse.json(
        {
          error:
            "Este turno ya no puede reprogramarse desde el portal porque faltan menos de 24 horas. Comunicate con el consultorio.",
        },
        { status: 400 }
      );
    }

    if (!body.date || !body.time || !body.doctorId) {
      return NextResponse.json(
        {
          error:
            "Seleccioná un especialista, una fecha y un horario.",
        },
        { status: 400 }
      );
    }

    const newDate = new Date(
      `${body.date}T${body.time}:00`
    );

    if (Number.isNaN(newDate.getTime())) {
      return NextResponse.json(
        {
          error: "La fecha o el horario no son válidos.",
        },
        { status: 400 }
      );
    }

    if (newDate <= new Date()) {
      return NextResponse.json(
        {
          error: "El nuevo turno debe ser futuro.",
        },
        { status: 400 }
      );
    }

    const doctor = await prisma.doctor.findFirst({
      where: {
        id: body.doctorId,
        active: true,
        branches: {
          some: {
            branchId: appointment.patient.branchId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        {
          error:
            "El especialista seleccionado no está disponible en tu sucursal.",
        },
        { status: 400 }
      );
    }

    const occupiedAppointment =
      await prisma.appointment.findFirst({
        where: {
          id: {
            not: appointment.id,
          },
          doctorId: body.doctorId,
          date: newDate,
          status: {
            not: "CANCELED",
          },
        },
        select: {
          id: true,
        },
      });

    if (occupiedAppointment) {
      return NextResponse.json(
        {
          error:
            "El horario seleccionado acaba de ser ocupado. Elegí otro horario.",
        },
        { status: 409 }
      );
    }

    const updatedAppointment =
      await prisma.appointment.update({
        where: {
          id,
        },
        data: {
          doctorId: body.doctorId,
          branchId: appointment.patient.branchId,
          date: newDate,
          notes:
            typeof body.treatmentName === "string" &&
            body.treatmentName.trim()
              ? body.treatmentName.trim()
              : appointment.notes,
          status: "PENDING",
          reminderSent: false,
        },
        include: {
          doctor: {
            include: {
              user: true,
            },
          },
          branch: true,
        },
      });

    await safelyCreateNotification(() =>
      notifyAppointmentRescheduled({
        patientId: appointment.patientId,
        appointmentId: appointment.id,
        doctorName: getDoctorName(
          updatedAppointment.doctor
        ),
        previousDate,
        newDate: updatedAppointment.date,
      })
    );

    return NextResponse.json({
      message:
        "El turno fue reprogramado correctamente.",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error al reprogramar turno:", error);

    return NextResponse.json(
      { error: "No se pudo reprogramar el turno." },
      { status: 500 }
    );
  }
}