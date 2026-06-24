import Link from "next/link";

export default function PatientDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">
          Mi portal de paciente
        </h1>

        <p className="mt-2 text-gray-500">
          Gestioná tus turnos, presupuestos y pagos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/dashboard/patient/turnos"
          className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md"
        >
          <h2 className="text-xl font-semibold">
            Reservar turno
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Solicitar un nuevo turno.
          </p>
        </Link>

        <Link
          href="/dashboard/patient/mis-turnos"
          className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md"
        >
          <h2 className="text-xl font-semibold">
            Mis turnos
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Consultar próximos turnos.
          </p>
        </Link>

        <Link
          href="/dashboard/patient/presupuestos"
          className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md"
        >
          <h2 className="text-xl font-semibold">
            Presupuestos
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Ver presupuestos recibidos.
          </p>
        </Link>

        <Link
          href="/dashboard/patient/pagos"
          className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md"
        >
          <h2 className="text-xl font-semibold">
            Pagos
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Consultar pagos pendientes.
          </p>
        </Link>
      </div>
    </div>
  );
}