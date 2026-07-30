import { redirect } from "next/navigation";

export default function MisTurnosRedirectPage() {
  redirect("/dashboard/patient/turnos");
}