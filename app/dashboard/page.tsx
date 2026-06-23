import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  if (session.user.role === "DOCTOR") {
    redirect("/dashboard/doctor");
  }

  if (session.user.role === "PATIENT") {
    redirect("/dashboard/patient");
  }

  redirect("/login");
}