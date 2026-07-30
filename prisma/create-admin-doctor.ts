import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "virginiaparino90@gmail.com";
  const branchId = "REEMPLAZAR_CON_EL_ID_DE_LA_SUCURSAL";

  const admin = await prisma.user.findUnique({
    where: {
      email: adminEmail.trim().toLowerCase(),
    },
    select: {
      id: true,
      name: true,
      role: true,
      doctor: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!admin) {
    throw new Error("No se encontró la administradora.");
  }

  if (admin.role !== "ADMIN") {
    throw new Error("El usuario encontrado no tiene rol ADMIN.");
  }

  const doctor = await prisma.doctor.upsert({
    where: {
      userId: admin.id,
    },
    update: {
      specialty: "Odontología General",
      active: true,
    },
    create: {
      userId: admin.id,
      specialty: "Odontología General",
      active: true,
    },
  });

  await prisma.doctorBranch.upsert({
    where: {
      doctorId_branchId: {
        doctorId: doctor.id,
        branchId,
      },
    },
    update: {},
    create: {
      doctorId: doctor.id,
      branchId,
    },
  });

  console.log(
    `${admin.name} ya puede atender como especialista sin dejar de ser ADMIN.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });