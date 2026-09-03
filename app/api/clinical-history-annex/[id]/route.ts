import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getClinicalExternalSession,
  canExternalDoctorAccessPatient,
} from "@/lib/clinical-external-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ExternalSession = Awaited<
  ReturnType<typeof getClinicalExternalSession>
>;

function optionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();

  return text || null;
}

function optionalDecimal(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const normalized = String(value)
    .trim()
    .replace(",", ".");

  if (!normalized) {
    return null;
  }

  const number = Number(normalized);

  if (!Number.isFinite(number)) {
    return undefined;
  }

  return normalized;
}

function optionalDate(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

/* =========================================================
   BUSCAR ENTRADA AUTORIZADA
========================================================= */

async function getAuthorizedEntry({
  entryId,
  isAdmin,
  internalDoctorId,
  externalSession,
}: {
  entryId: string;
  isAdmin: boolean;
  internalDoctorId?: string;
  externalSession?: ExternalSession;
}) {
  /*
   * ADMIN puede administrar cualquier entrada.
   */
  if (isAdmin) {
    return prisma.clinicalHistoryAnnexEntry.findUnique({
      where: {
        id: entryId,
      },
    });
  }

  /*
   * Doctor interno (panel propio, NextAuth):
   * solamente puede modificar/eliminar
   * sus propias prestaciones.
   */
  if (internalDoctorId) {
    const entry =
      await prisma.clinicalHistoryAnnexEntry.findFirst({
        where: {
          id: entryId,
          createdByDoctorId: internalDoctorId,
        },
      });

    if (entry) {
      return entry;
    }
  }

  /*
   * Especialista externo (cookie /acceso-clinico):
   * solamente puede modificar/eliminar sus propias
   * prestaciones, y solo si sigue teniendo acceso
   * a esa historia clínica (todas, o selección
   * puntual).
   */
  if (externalSession) {
    const entry =
      await prisma.clinicalHistoryAnnexEntry.findFirst({
        where: {
          id: entryId,
          createdByDoctorId: externalSession.doctor.id,
        },
        include: {
          clinicalHistory: {
            select: {
              patientId: true,
            },
          },
        },
      });

    if (!entry) {
      return null;
    }

    const hasAccess =
      await canExternalDoctorAccessPatient(
        externalSession.doctor.id,
        externalSession.clinicalAccess,
        entry.clinicalHistory.patientId
      );

    return hasAccess ? entry : null;
  }

  return null;
}

async function resolveAuthContext() {
  const session = await auth();

  const isAdmin =
    session?.user?.role === "ADMIN";

  let internalDoctorId: string | undefined;

  if (
    !isAdmin &&
    session?.user?.id &&
    session.user.role === "DOCTOR"
  ) {
    const doctor = await prisma.doctor.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    internalDoctorId = doctor?.id;
  }

  const externalSession =
    await getClinicalExternalSession();

  return {
    isAdmin,
    internalDoctorId,
    externalSession: externalSession ?? undefined,
  };
}

/* =========================================================
   PUT - EDITAR PRESTACIÓN
========================================================= */

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const {
      isAdmin,
      internalDoctorId,
      externalSession,
    } = await resolveAuthContext();

    if (
      !isAdmin &&
      !internalDoctorId &&
      !externalSession
    ) {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;

    const existingEntry = await getAuthorizedEntry({
      entryId: id,
      isAdmin,
      internalDoctorId,
      externalSession,
    });

    if (!existingEntry) {
      return NextResponse.json(
        {
          error:
            "No podés modificar este registro.",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request.json();

    const professionalName =
      typeof body.professionalName === "string"
        ? body.professionalName.trim()
        : "";

    const treatment =
      typeof body.treatment === "string"
        ? body.treatment.trim()
        : "";

    if (!professionalName) {
      return NextResponse.json(
        {
          error:
            "Ingresá el profesional actuante.",
        },
        {
          status: 400,
        }
      );
    }

    if (!treatment) {
      return NextResponse.json(
        {
          error:
            "Ingresá el tratamiento realizado.",
        },
        {
          status: 400,
        }
      );
    }

    const debit = optionalDecimal(body.debit);
    const credit = optionalDecimal(body.credit);
    const balance = optionalDecimal(body.balance);

    if (
      debit === undefined ||
      credit === undefined ||
      balance === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Debe, Haber y Saldo deben contener valores numéricos.",
        },
        {
          status: 400,
        }
      );
    }

    const nextAppointment = optionalDate(
      body.nextAppointment
    );

    if (nextAppointment === undefined) {
      return NextResponse.json(
        {
          error:
            "La fecha del próximo turno no es válida.",
        },
        {
          status: 400,
        }
      );
    }

    const performedAt = optionalDate(
      body.performedAt
    );

    if (performedAt === undefined) {
      return NextResponse.json(
        {
          error:
            "La fecha y hora de la prestación no es válida.",
        },
        {
          status: 400,
        }
      );
    }

    const updatedEntry =
      await prisma.clinicalHistoryAnnexEntry.update({
        where: {
          id: existingEntry.id,
        },

        data: {
          professionalName,

          treatment,

          indications: optionalText(
            body.indications
          ),

          debit,
          credit,
          balance,

          /*
           * Si no vino una nueva fecha,
           * conservamos la anterior.
           */
          performedAt:
            performedAt ||
            existingEntry.performedAt,

          nextAppointment,

          patientSignature: optionalText(
            body.patientSignature
          ),
        },
      });

    return NextResponse.json({
      success: true,
      entry: updatedEntry,
    });
  } catch (error) {
    console.error(
      "Error editando entrada del anexo:",
      error
    );

    return NextResponse.json(
      {
        error: "No se pudo modificar la entrada.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE - ELIMINAR PRESTACIÓN
========================================================= */

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const {
      isAdmin,
      internalDoctorId,
      externalSession,
    } = await resolveAuthContext();

    if (
      !isAdmin &&
      !internalDoctorId &&
      !externalSession
    ) {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;

    const existingEntry = await getAuthorizedEntry({
      entryId: id,
      isAdmin,
      internalDoctorId,
      externalSession,
    });

    if (!existingEntry) {
      return NextResponse.json(
        {
          error:
            "No podés eliminar este registro.",
        },
        {
          status: 403,
        }
      );
    }

    await prisma.clinicalHistoryAnnexEntry.delete({
      where: {
        id: existingEntry.id,
      },
    });

    return NextResponse.json({
      success: true,

      message: "Registro eliminado correctamente.",
    });
  } catch (error) {
    console.error(
      "Error eliminando entrada del anexo:",
      error
    );

    return NextResponse.json(
      {
        error: "No se pudo eliminar la entrada.",
      },
      {
        status: 500,
      }
    );
  }
}