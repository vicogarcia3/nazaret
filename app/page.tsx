import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const config = await prisma.siteConfig.findFirst();

  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { id: "desc" },
  });

  const doctors = await prisma.doctor.findMany({
    where: { active: true },
    include: { user: true },
    orderBy: { id: "desc" },
  });

  return (
    <main className="min-h-screen bg-[#F7F5EF] text-[#1f1f1f]">
      <header className="flex items-center justify-between px-8 py-5 md:px-16">
        <h1 className="font-serif text-xl font-semibold uppercase tracking-tight text-gray-800">
          {config?.clinicName || "Consultorios Nazaret"}
        </h1>

        <nav className="hidden gap-8 text-sm text-gray-800 md:flex">
          <a href="#servicios">Servicios</a>
          <a href="#equipo">Equipo</a>
          <a href="#contacto">Contacto</a>
        </nav>

        <div className="flex gap-3 text-sm">
          <Link
            href="/login"
            className="rounded-full border border-[#A2B38B] px-4 py-2.5 text-[#6f7f5f] hover:bg-white"
          >
            Iniciar sesión
          </Link>

          <Link
            href="/dashboard/patient/turnos"
            className="rounded-full bg-[#A2B38B] px-5 py-2.5 text-white hover:bg-[#8FA178]"
          >
            Reservar cita
          </Link>
        </div>
      </header>

      <section className="grid min-h-[78vh] items-center gap-12 px-8 py-12 md:grid-cols-2 md:px-16 lg:px-24">
        <div>
          <h2 className="font-serif text-5xl leading-[1.1] md:text-7xl lg:text-6xl text-gray-800">
            {config?.heroTitle || "Tu sonrisa, nuestra prioridad"}
          </h2>

          <p className="mt-6 max-w-lg text-base leading-7 text-gray-600 md:text-lg">
            {config?.heroSubtitle ||
              "Atención odontológica integral en un ambiente cálido, profesional y de confianza."}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#contacto"
              className="rounded-full bg-[#A2B38B] px-6 py-3 text-sm font-medium text-white hover:bg-[#8FA178]"
            >
              Conocé nuestra clínica
            </a>

            <a
              href="#servicios"
              className="rounded-full border border-[#A2B38B] px-6 py-3 text-sm font-medium text-[#6f7f5f] hover:bg-white"
            >
              Ver tratamientos
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-5 -top-5 h-28 w-28 rounded-full bg-[#DCE5D0]" />

          <div className="relative overflow-hidden rounded-[2rem] shadow-xl">
            {config?.heroImage ? (
              <img
                src={config.heroImage}
                alt={config?.clinicName || "Consultorio odontológico"}
                className="aspect-[3/4] w-full rounded-[2rem] object-cover outline outline-1 -outline-offset-1 outline-black/5"
              />
            ) : (
              <div className="flex aspect-[3/4] w-full items-center justify-center rounded-[2rem] bg-white text-gray-400 outline outline-1 -outline-offset-1 outline-black/5">
                Imagen principal pendiente
              </div>
            )}
          </div>

          <div className="absolute -bottom-7 -left-7 hidden max-w-[210px] bg-white p-7 shadow-xl lg:block">
            <p className="text-sm text-[#A2B38B]">Atención de excelencia</p>
            <p className="text-[12px] leading-relaxed text-[var(--brand-primary)]/60 text-gray-500">
              {config?.heroTitle || "Tu sonrisa, nuestra prioridad"}
            </p>
          </div>
        </div>
      </section>

      <section id="servicios" className="bg-white px-8 py-16 md:px-16 lg:px-24">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#A2B38B]">
          Especialidades
        </p>

        <h2 className="mt-3 font-serif text-3xl font-semibold md:text-4xl">
          Nuestros servicios
        </h2>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {services.length > 0 ? (
            services.map((service) => (
              <div
                key={service.id}
                className="rounded-3xl border bg-[#F7F5EF] p-6"
              >
                <h3 className="text-lg font-semibold">{service.title}</h3>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {service.description ||
                    "Tratamiento odontológico personalizado."}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Todavía no hay servicios cargados.</p>
          )}
        </div>
      </section>

      <section id="equipo" className="px-8 py-16 md:px-16 lg:px-24">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#A2B38B]">
          Equipo profesional
        </p>

        <h2 className="mt-3 font-serif text-3xl font-semibold md:text-4xl">
          Nuestros especialistas
        </h2>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {doctors.length > 0 ? (
            doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="rounded-3xl border bg-white p-6 shadow-sm"
              >
                {doctor.photo && (
                  <img
                    src={doctor.photo}
                    alt={doctor.user.name || "Odontólogo"}
                    className="mb-4 h-24 w-24 rounded-full object-cover"
                  />
                )}

                <h3 className="text-lg font-semibold">{doctor.user.name}</h3>

                <p className="mt-1 text-sm text-[#A2B38B]">
                  {doctor.specialty || "Odontología general"}
                </p>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {doctor.description || "Profesional del equipo odontológico."}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">
              Todavía no hay especialistas cargados.
            </p>
          )}
        </div>
      </section>

      <section id="contacto" className="px-8 py-16 md:px-16 lg:px-24">
        <div className="rounded-[2rem] bg-[#A2B38B] p-8 text-white md:p-12">
          <h2 className="font-serif text-3xl font-semibold md:text-4xl">
            Tu primera visita comienza con una conversación.
          </h2>

          <p className="mt-4 max-w-xl text-base leading-7">
            Escribinos o reservá tu turno desde el portal.
          </p>

          <div className="mt-7 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-[#6f7f5f]"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/registro"
              className="rounded-full border border-white px-6 py-3 text-sm font-medium text-white"
            >
              Crear cuenta paciente
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-8 py-8 text-center text-sm text-gray-500">
        © 2026 {config?.clinicName || "Consultorios Nazaret"}
      </footer>
    </main>
  );
}