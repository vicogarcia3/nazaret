import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getClinicalExternalSession } from "@/lib/clinical-external-auth";

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

export async function POST(request: Request) {
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

    const body = await request.json();

    const clinicalHistoryId =
      typeof body.clinicalHistoryId === "string"
        ? body.clinicalHistoryId.trim()
        : "";

    if (!clinicalHistoryId) {
      return NextResponse.json(
        {
          error:
            "No se indicó la historia clínica.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Buscamos las sucursales a las que pertenece
     * el especialista.
     */
    const doctor = await prisma.doctor.findUnique({
      where: {
        id: clinicalSession.doctor.id,
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
      return NextResponse.json(
        {
          error:
            "No se encontró el especialista.",
        },
        {
          status: 404,
        }
      );
    }

    const branchIds = doctor.branches.map(
      (branch) => branch.branchId
    );

    /*
     * La historia tiene que pertenecer a un paciente
     * de alguna sucursal del especialista.
     */
    const clinicalHistory =
      await prisma.clinicalHistory.findFirst({
        where: {
          id: clinicalHistoryId,

          patient: {
            branchId: {
              in: branchIds,
            },
          },
        },

        select: {
          id: true,
        },
      });

    if (!clinicalHistory) {
      return NextResponse.json(
        {
          error:
            "No tenés acceso a esta historia clínica.",
        },
        {
          status: 403,
        }
      );
    }

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

    const entry =
      await prisma.clinicalHistoryAnnexEntry.create({
        data: {
          clinicalHistoryId,

          /*
           * Autor real interno.
           */
          createdByDoctorId:
            clinicalSession.doctor.id,

          /*
           * Profesional actuante visible:
           * se carga manualmente.
           */
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

    return NextResponse.json(
      {
        success: true,
        entry,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error creando entrada del anexo:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo guardar la entrada del anexo.",
      },
      {
        status: 500,
      }
    );
  }
}