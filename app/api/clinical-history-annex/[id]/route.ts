import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getClinicalExternalSession } from "@/lib/clinical-external-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

async function getAuthorizedEntry(
  entryId: string,
  doctorId: string
) {
  const doctor = await prisma.doctor.findUnique({
    where: {
      id: doctorId,
    },

    select: {
      branches: {
        select: {
          branchId: true,
        },
      },
    },
  });

  if (!doctor) {
    return null;
  }

  const branchIds = doctor.branches.map(
    (branch) => branch.branchId
  );

  return prisma.clinicalHistoryAnnexEntry.findFirst({
    where: {
      id: entryId,

      /*
       * Solamente puede modificar su propia entrada.
       */
      createdByDoctorId: doctorId,

      /*
       * Y además la HC debe pertenecer a una
       * de sus sucursales.
       */
      clinicalHistory: {
        patient: {
          branchId: {
            in: branchIds,
          },
        },
      },
    },
  });
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const clinicalSession =
      await getClinicalExternalSession();

    if (!clinicalSession) {
      return NextResponse.json(
        {
          error:
            "Tu sesión clínica no es válida o venció.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;

    const existingEntry =
      await getAuthorizedEntry(
        id,
        clinicalSession.doctor.id
      );

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

    const debit =
      optionalDecimal(body.debit);

    const credit =
      optionalDecimal(body.credit);

    const balance =
      optionalDecimal(body.balance);

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

    const nextAppointment =
      optionalDate(body.nextAppointment);

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

    const updatedEntry =
      await prisma.clinicalHistoryAnnexEntry.update({
        where: {
          id: existingEntry.id,
        },

        data: {
          professionalName,
          treatment,

          indications:
            optionalText(body.indications),

          debit,
          credit,
          balance,

          nextAppointment,

          patientSignature:
            optionalText(
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
        error:
          "No se pudo modificar la entrada.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const clinicalSession =
      await getClinicalExternalSession();

    if (!clinicalSession) {
      return NextResponse.json(
        {
          error:
            "Tu sesión clínica no es válida o venció.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;

    const existingEntry =
      await getAuthorizedEntry(
        id,
        clinicalSession.doctor.id
      );

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
      message:
        "Registro eliminado correctamente.",
    });
  } catch (error) {
    console.error(
      "Error eliminando entrada del anexo:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo eliminar la entrada.",
      },
      {
        status: 500,
      }
    );
  }
}