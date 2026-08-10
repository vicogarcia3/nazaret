import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

import { sendVerificationEmail } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/*
 * Normaliza números argentinos para poder compararlos.
 *
 * Ejemplos que terminan siendo equivalentes:
 * 3515551234
 * 03515551234
 * +54 9 351 5551234
 * 5493515551234
 */
function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("549")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("54")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits;
}

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

    /*
     * Campos obligatorios.
     */
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

    /*
     * Validar email.
     */
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

    /*
     * Validar contraseña.
     */
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
     * Verificar que no exista ya una cuenta User
     * con ese correo.
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
     * ------------------------------------------------
     * 1. BUSCAR FICHA DE PACIENTE POR EMAIL
     * ------------------------------------------------
     *
     * La prioridad siempre es EMAIL.
     */
    const patientsByEmail =
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
          phone: true,
          branchId: true,
        },
        take: 2,
      });

    /*
     * Si existen varias fichas con el mismo email,
     * no podemos decidir automáticamente cuál vincular.
     */
    if (patientsByEmail.length > 1) {
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

    let existingPatient =
      patientsByEmail[0] ?? null;

    let matchedBy:
      | "EMAIL"
      | "PHONE"
      | null = existingPatient
      ? "EMAIL"
      : null;

    /*
     * ------------------------------------------------
     * 2. SI NO COINCIDE EMAIL, BUSCAR POR CELULAR
     * ------------------------------------------------
     */
    if (!existingPatient) {
      const normalizedRegistrationPhone =
        normalizePhone(phone);

      /*
       * Traemos pacientes con teléfono cargado
       * y hacemos la comparación normalizada.
       *
       * No filtramos por userId acá porque,
       * si encontramos una ficha que ya tiene cuenta,
       * queremos detectarla y evitar crear un duplicado.
       */
      const patients =
        await prisma.patient.findMany({
          where: {
            phone: {
              not: "",
            },
          },
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            branchId: true,
          },
        });

      const patientsByPhone =
        patients.filter(
          (patient) =>
            normalizePhone(patient.phone) ===
            normalizedRegistrationPhone
        );

      /*
       * Si varias fichas comparten teléfono,
       * no vincular automáticamente.
       */
      if (patientsByPhone.length > 1) {
        return NextResponse.json(
          {
            error:
              "Encontramos más de una ficha de paciente con este número de celular. Contactá al consultorio para vincular tu cuenta.",
          },
          {
            status: 409,
          }
        );
      }

      if (patientsByPhone.length === 1) {
        existingPatient =
          patientsByPhone[0];

        matchedBy = "PHONE";
      }
    }

    /*
     * Si encontramos una ficha que ya tiene
     * un User asociado, no crear otra cuenta.
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
     * ------------------------------------------------
     * 3. VALIDAR SUCURSAL
     * ------------------------------------------------
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

    /*
     * ------------------------------------------------
     * 4. HASHEAR CONTRASEÑA
     * ------------------------------------------------
     */
    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    /*
     * ------------------------------------------------
     * 5. CREAR CUENTA Y VINCULAR/CREAR PATIENT
     * ------------------------------------------------
     */
    const result =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Si ya existe una ficha manual,
           * respetamos el nombre almacenado allí.
           */
          const userName =
            existingPatient
              ? `${existingPatient.firstName} ${existingPatient.lastName}`
              : `${firstName} ${lastName}`;

          const createdUser =
            await tx.user.create({
              data: {
                name: userName,
                email,
                password:
                  hashedPassword,
                role: "PATIENT",
                emailVerified: null,
              },
            });

          /*
           * ------------------------------------------------
           * PACIENTE EXISTENTE
           * ------------------------------------------------
           *
           * Puede haber sido encontrado por:
           *
           * 1. EMAIL
           * 2. TELÉFONO
           *
           * En ambos casos vinculamos el User
           * a la ficha existente.
           *
           * NO se crea un segundo Patient.
           */
          if (
            existingPatient &&
            (
              matchedBy === "EMAIL" ||
              matchedBy === "PHONE"
            )
          ) {
            await tx.patient.update({
              where: {
                id:
                  existingPatient.id,
              },
              data: {
                userId:
                  createdUser.id,

                /*
                 * Si la ficha fue creada manualmente
                 * sin email, o tenía otro formato,
                 * dejamos guardado el email utilizado
                 * para crear la cuenta.
                 */
                email,
              },
            });

            return {
              user: createdUser,
              patientId:
                existingPatient.id,
              linkedExistingPatient:
                true,
              matchedBy,
            };
          }

          /*
           * ------------------------------------------------
           * PACIENTE NUEVO
           * ------------------------------------------------
           *
           * No encontramos coincidencia ni por email
           * ni por celular.
           */
          const createdPatient =
            await tx.patient.create({
              data: {
                userId:
                  createdUser.id,
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
            linkedExistingPatient:
              false,
            matchedBy: null,
          };
        }
      );

    /*
     * ------------------------------------------------
     * 6. ENVIAR VERIFICACIÓN DE EMAIL
     * ------------------------------------------------
     */
    try {
      await sendVerificationEmail({
        userId:
          result.user.id,
        email:
          result.user.email,
        name:
          result.user.name,
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
          matchedBy:
            result.matchedBy,
          message:
            "La cuenta fue creada, pero no pudimos enviar el correo. Solicitá uno nuevo desde el inicio de sesión.",
        },
        {
          status: 201,
        }
      );
    }

    /*
     * ------------------------------------------------
     * 7. RESPUESTA FINAL
     * ------------------------------------------------
     */
    return NextResponse.json(
      {
        success: true,
        emailSent: true,
        email,
        linkedExistingPatient:
          result.linkedExistingPatient,
        matchedBy:
          result.matchedBy,
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