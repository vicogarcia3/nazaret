import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import UsersClient from "./UsersClient";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [users, branches, availableDoctors] =
    await Promise.all([
      prisma.user.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          lastLoginAt: true,
          doctor: {
            select: {
              id: true,
              name: true,
              specialty: true,
              professionalLicense: true,
              description: true,
              photo: true,
              active: true,
              visible: true,
              branches: {
                select: {
                  branchId: true,
                },
              },
            },
          },
        },
      }),

      prisma.branch.findMany({
        where: {
          active: true,
        },
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
        },
      }),

      /*
       * Especialistas cargados en Equipo
       * que todavía no tienen una cuenta asociada.
       */
      prisma.doctor.findMany({
        where: {
          userId: null,
        },
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          specialty: true,
          professionalLicense: true,
          photo: true,
          active: true,
          visible: true,
          branches: {
            select: {
              branchId: true,
              branch: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                },
              },
            },
          },
        },
      }),
    ]);

  const currentUser =
    users.find(
      (user) => user.id === session.user.id
    ) ?? null;

  return (
    <UsersClient
      users={users}
      currentUser={currentUser}
      branches={branches}
      availableDoctors={availableDoctors}
    />
  );
}