import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UsersClient from "./UsersClient";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  const users = await prisma.user.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true, 
      email: true,
      role: true,
      lastLoginAt: true,
    },
  });

  const currentUser = users.find((user) => user.id === session.user.id) || null;

  return (
    <UsersClient
      users={users}
      currentUser={currentUser}
    />
  );
}