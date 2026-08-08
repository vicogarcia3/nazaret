import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

import { sendVerificationEmail } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const firstName = String(
      data.firstName || ""
    ).trim();

    const lastName = String(
      data.lastName || ""
    ).trim();

    const phone = String(
      data.phone || ""
    ).trim();

    const dni = String(
      data.dni || ""
    ).trim();

    const branchId = String(
      data.branchId || ""
    ).trim();

    const email = String(
      data.email || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      data.password || ""
    );

    if (
      !firstName ||
      !lastName ||
      !phone ||
      !dni ||
      !branchId ||
      !email ||
      !password
    ) {
      return NextResponse.json(
        {
          error:
            "Completá todos los campos.",
        },
        {
          status: 400,
        }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        {
          error:
            "Ingresá un correo electrónico válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "La contraseña debe tener al menos 8 caracteres.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Primero verificamos que no exista
     * una cuenta de usuario con ese email.
     */
    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "El correo ya está registrado.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Buscamos si la administradora ya creó
     * manualmente un paciente con ese email.
     *
     * Usamos búsqueda case-insensitive para
     * que MAYUSCULAS/minúsculas no afecten.
     */
    const matchingPatients =
      await prisma.patient.findMany({
        where: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          branchId: true,
        },
        take: 2,
      });

    /*
     * Si hubiera dos pacientes manuales con
     * el mismo email, no vinculamos automáticamente.
     * La administradora deberá corregir el duplicado.
     */
    if (matchingPatients.length > 1) {
      return NextResponse.json(
        {
          error:
            "Existe más de un paciente registrado con este correo. Contactá al consultorio para vincular tu cuenta.",
        },
        {
          status: 409,
        }
      );
    }

    const existingPatient =
      matchingPatients[0] ?? null;

    /*
     * Si ese paciente ya está vinculado a
     * otro User, no permitimos crear otra cuenta.
     */
    if (existingPatient?.userId) {
      return NextResponse.json(
        {
          error:
            "Este paciente ya tiene una cuenta asociada.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Validamos la sucursal elegida.
     *
     * Para un paciente preexistente vamos a
     * conservar la sucursal cargada por la admin,
     * pero igualmente mantenemos esta validación
     * para los pacientes nuevos.
     */
    const branch =
      await prisma.branch.findFirst({
        where: {
          id: branchId,
          active: true,
        },
        select: {
          id: true,
        },
      });

    if (!branch) {
      return NextResponse.json(
        {
          error:
            "La sucursal seleccionada no es válida.",
        },
        {
          status: 400,
        }
      );
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const result =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Si la admin ya creó el paciente,
           * usamos los datos que ya existen
           * para el nombre del User.
           */
          const userName = existingPatient
            ? `${existingPatient.firstName} ${existingPatient.lastName}`
            : `${firstName} ${lastName}`;

          const createdUser =
            await tx.user.create({
              data: {
                name: userName,
                email,
                password: hashedPassword,
                role: "PATIENT",
                emailVerified: null,
              },
            });

          if (existingPatient) {
            /*
             * PACIENTE YA EXISTENTE:
             * solamente vinculamos la cuenta.
             *
             * No creamos un segundo Patient.
             */
            await tx.patient.update({
              where: {
                id: existingPatient.id,
              },
              data: {
                userId: createdUser.id,

                /*
                 * Aprovechamos para normalizar
                 * el email almacenado.
                 */
                email,
              },
            });

            return {
              user: createdUser,
              patientId:
                existingPatient.id,
              linkedExistingPatient: true,
            };
          }

          /*
           * PACIENTE NUEVO:
           * si no existía uno con ese email,
           * se crea normalmente.
           */
          const createdPatient =
            await tx.patient.create({
              data: {
                userId: createdUser.id,
                firstName,
                lastName,
                phone,
                email,
                dni,
                branchId,
              },
            });

          return {
            user: createdUser,
            patientId:
              createdPatient.id,
            linkedExistingPatient: false,
          };
        }
      );

    try {
      await sendVerificationEmail({
        userId: result.user.id,
        email: result.user.email,
        name: result.user.name,
      });
    } catch (emailError) {
      console.error(
        "La cuenta se creó, pero no se pudo enviar la verificación:",
        emailError
      );

      return NextResponse.json(
        {
          success: true,
          emailSent: false,
          email,
          linkedExistingPatient:
            result.linkedExistingPatient,

          message:
            "La cuenta fue creada, pero no pudimos enviar el correo. Solicitá uno nuevo desde el inicio de sesión.",
        },
        {
          status: 201,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        emailSent: true,
        email,
        linkedExistingPatient:
          result.linkedExistingPatient,

        message:
          result.linkedExistingPatient
            ? "Cuenta creada y vinculada con tu ficha de paciente. Revisá tu correo para verificarla antes de iniciar sesión."
            : "Cuenta creada. Revisá tu correo para verificarla antes de iniciar sesión.",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error al registrar paciente:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo crear la cuenta.",
      },
      {
        status: 500,
      }
    );
  }
}