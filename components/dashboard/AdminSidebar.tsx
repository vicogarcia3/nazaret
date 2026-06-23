import Link from "next/link";

export default function AdminSidebar() {
  return (
    <aside className="w-64 border-r bg-white p-6">
      <h2 className="mb-8 text-2xl font-bold text-[#A2B38B]">
        Nazaret
      </h2>

      <nav className="flex flex-col gap-8">
        {/* PANEL GENERAL */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Mi Panel Odontológico
          </p>

          <div className="flex flex-col gap-3">
            <Link href="/dashboard/admin/mi-panel">
              Dashboard
            </Link>

            <Link href="/dashboard/admin/mi-panel/pacientes">
              Mis pacientes
            </Link>

            <Link href="/dashboard/admin/mi-panel/turnos">
              Mis turnos
            </Link>

            <Link href="/dashboard/admin/mi-panel/presupuestos">
              Presupuestos
            </Link>

            <Link href="/dashboard/admin/mi-panel/ingresos">
              Ingresos
            </Link>
          </div>
        </div>

        {/* CONFIGURACIÓN */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Configuración
          </p>

          <div className="flex flex-col gap-3">
            <Link href="/dashboard/admin/configuracion">
              Configuración web
            </Link>

            <Link href="/dashboard/admin/configuracion/servicios">
              Servicios
            </Link>

            <Link href="/dashboard/admin/configuracion/planes">
              Planes
            </Link>

            <Link href="/dashboard/admin/configuracion/odontologos">
              Especialistas
            </Link>

            <Link href="/dashboard/admin/configuracion/sucursales">
              Sucursales
            </Link>
          </div>
        </div>
      </nav>
    </aside>
  );
}