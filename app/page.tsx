import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TestimonialsCarousel from "@/components/home/TestimonialsCarousel";
import ServicesCarousel from "./components/home/ServicesCarousel";
import Header from "@/components/home/Header";
import Image from "next/image";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const GOOGLE_REVIEWS_URL =
  "https://www.google.com/maps/place/CONSULTORIOS+NAZARET-+BARRIO+LAS+ROSAS+(CORDOBA+CAPITAL)/@-31.3915773,-64.2255825,17z/data=!4m18!1m9!3m8!1s0x943298c48f0d390b:0x61d7bfb34430fa99!2sCONSULTORIOS+NAZARET-+BARRIO+LAS+ROSAS+(CORDOBA+CAPITAL)!8m2!3d-31.3915773!4d-64.2255825!9m1!1b1!16s%2Fg%2F11f5dbt728!3m7!1s0x943298c48f0d390b:0x61d7bfb34430fa99!8m2!3d-31.3915773!4d-64.2255825!9m1!1b1!16s%2Fg%2F11f5dbt728?entry=ttu&g_ep=EgoyMDI2MDcyNi4wIKXMDSoASAFQAw%3D%3D";

export default async function HomePage() {

  const config = await prisma.siteConfig.findFirst();
  const doctors = await prisma.doctor.findMany({
    where: {
      active: true,
      visible: true,
    },
    include: {
      user: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const branches = await prisma.branch.findMany({
    where: {
      active: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const mainBranch =
    branches.find((branch) =>
      branch.address
        .toLowerCase()
        .includes("nazaret 3182")
    ) ?? branches[0];

  const testimonials = await prisma.testimonial.findMany({
    where: {
      approved: true,
      visible: true,
    },
    include: {
      patient: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const servicesWithImages = await prisma.service.findMany({
    where: {
      active: true,
      image: {
        not: null,
      },
    },
    orderBy: {
      title: "asc",
    },
  });

  const healthInsurances =
    await prisma.healthInsurance.findMany({
      where: {
        visible: true,
      },
      orderBy: {
        name: "asc",
      },
    });

  const plans = await prisma.plan.findMany({
    where: {
      visible: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const publicTestimonials = testimonials.map((testimonial) => ({
    id: testimonial.id,
    rating: testimonial.rating,
    comment: testimonial.comment,
    patientName: testimonial.patient.user?.name ?? "Paciente",
  }));

  return (
    <main className="min-h-screen bg-[#F7F5EF] text-[#1f1f1f]">
      <Header
        clinicName={config?.clinicName}
        showServices={servicesWithImages.length > 0}
        showHealthInsurances={healthInsurances.length > 0}
      />

      <section className="grid min-h-[78vh] items-center gap-12 px-8 py-12 md:grid-cols-2 md:px-16 lg:px-24">
        <div>
          <h2 className="font-serif text-5xl leading-[1.1] text-gray-800 md:text-7xl lg:text-6xl">
            {config?.heroTitle || "Tu sonrisa, nuestra prioridad"}
          </h2>

          <p className="mt-6 max-w-lg text-base leading-7 text-gray-600 md:text-lg">
            {config?.heroSubtitle ||
              "Atención odontológica integral en un ambiente cálido, profesional y de confianza."}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/dashboard/patient/turnos"
              className="rounded-full bg-[#A2B38B] px-6 py-3 text-sm font-medium text-white hover:bg-[#8FA178]"
            >
              Reservar un turno
            </Link>

            {servicesWithImages.length > 0 && (
              <a
                href="#servicios"
                className="rounded-full border border-[#A2B38B] px-6 py-3 text-sm font-medium text-[#6F7F5F] transition hover:bg-white"
              >
                Ver servicios
              </a>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-5 -top-5 h-28 w-28 rounded-full bg-[#DCE5D0]" />

          <div className="relative overflow-hidden rounded-[2rem] shadow-xl">
            {config?.heroImage ? (
              <Image
                src={config.heroImage}
                alt={config.clinicName || "Consultorio odontológico"}
                width={900}
                height={1200}
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="aspect-[3/4] w-full rounded-[2rem] object-cover outline outline-1 -outline-offset-1 outline-black/5"
              />
            ) : (
              <div className="flex aspect-[3/4] w-full items-center justify-center rounded-[2rem] bg-white text-gray-400 outline outline-1 -outline-offset-1 outline-black/5">
                Imagen principal pendiente
              </div>
            )}
          </div>

          <div className="absolute -bottom-7 -left-7 hidden max-w-[240px] bg-white p-7 shadow-xl lg:block">
            <p className="text-base text-[#A2B38B]">
              Atención de excelencia
            </p>

            <p className="text-sm leading-relaxed text-gray-500">
              {config?.heroTitle || "Tu sonrisa, nuestra prioridad"}
            </p>
          </div>
        </div>
      </section>

      {servicesWithImages.length > 0 && (
        <section
          id="servicios"
          className="scroll-mt-24 bg-white"
        >
          <ServicesCarousel services={servicesWithImages} />
        </section>
      )}

      <section
        id="equipo"
        className="scroll-mt-8 px-8 py-16 md:px-16 lg:px-24"
      >
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
                  className="rounded-3xl border border-[#DED9CD] bg-[#FCFBF8] p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-xl"
                >
                {doctor.photo ? (
                  <Image
                    src={doctor.photo}
                    alt={doctor.name || doctor.user?.name || "Odontólogo"}
                    width={96}
                    height={96}
                    sizes="96px"
                    className="mb-4 h-24 w-24 rounded-full object-cover"
                  />
                ) : null}

                <h3 className="text-lg font-semibold">
                  {doctor.name || doctor.user?.name || "Especialista"}
                </h3>

                {doctor.professionalLicense && (
                  <p className="mt-1 text-xs text-[#6B7774]">
                    MP {doctor.professionalLicense}
                  </p>
                )}

                <p className="mt-1 text-sm text-[#A2B38B]">
                  {doctor.specialty || "Odontología general"}
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

      {healthInsurances.length > 0 && (
        <section
          id="obras-sociales"
          className="scroll-mt-8 bg-white px-8 py-12 md:px-16 lg:px-24"
        >
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#A2B38B]">
              Coberturas
            </p>

            <h2 className="mt-3 font-serif text-3xl font-semibold md:text-4xl">
              Obras Sociales
            </h2>

            <div className="mt-8 flex flex-wrap justify-center gap-5">
              {healthInsurances.map((insurance) => (
                <article
                  key={insurance.id}
                  className="flex h-36 w-40 flex-col items-center justify-center rounded-2xl border border-[#DED9CD] bg-[#FCFBF8] p-5 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-xl"
                >
                  {insurance.logo ? (
                    <img
                      src={insurance.logo}
                      alt={insurance.name}
                      className="h-16 w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-14 items-center text-xs text-[#9A9F9D]">
                      Sin logo
                    </div>
                  )}

                  <p className="mt-5 text-sm font-medium text-[#263F3B]">
                    {insurance.name}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {plans.length > 0 && (
        <section
          id="planes"
          className="scroll-mt-8 px-8 py-16 md:px-16 lg:px-24"
        >
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#A2B38B]">
              Afiliación
            </p>

            <h2 className="mt-3 font-serif text-3xl font-semibold md:text-4xl">
              Nuestros planes
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6B7774]">
              Elegí el plan que mejor se adapte a vos y accedé a sus beneficios.
            </p>

            <div className="mt-10 grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
              {plans.map((plan) => {
                const benefits = plan.benefits
                  ? plan.benefits
                      .split("\n")
                      .map((benefit) => benefit.trim())
                      .filter(Boolean)
                  : [];

                return (
                  <article
                    key={plan.id}
                    className="flex h-full flex-col rounded-3xl border border-[#DED9CD] bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* TÍTULO */}

                    <h3 className="font-serif text-3xl font-semibold text-[#263F3B]">
                      {plan.name}
                    </h3>

                    {/* DESCRIPCIÓN */}

                    <p className="mt-3 text-sm leading-6 text-[#6B7774]">
                      {plan.description}
                    </p>

                    {/* BENEFICIOS */}

                    {benefits.length > 0 && (
                      <div className="mt-7">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                          Beneficios
                        </p>

                        <ul className="mt-4 space-y-3">
                          {benefits.map((benefit, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-3 text-sm leading-5 text-[#263F3B]"
                            >
                              <span className="mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8EEE2] text-[11px] font-bold text-[#6F855F]">
                                ✓
                              </span>

                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CONDICIONES */}

                    {plan.conditions && (
                      <div className="mt-7 border-t border-[#E7E2D8] pt-5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                          Condiciones
                        </p>

                        <p className="mt-3 whitespace-pre-line text-xs leading-5 text-[#6B7774]">
                          {plan.conditions}
                        </p>
                      </div>
                    )}

                    {/* PRECIO Y DESCUENTO */}

                    <div className="mt-auto pt-8">
                      {Number(plan.discount) > 0 && (
                        <div className="mb-3 inline-flex rounded-full bg-[#E8EEE2] px-3 py-1.5 text-xs font-semibold text-[#6F855F]">
                          {Number(plan.discount)}% de descuento
                        </div>
                      )}

                      {plan.price !== null && (
                        <div>
                          <span className="font-serif text-3xl font-semibold text-[#263F3B]">
                            $
                            {Number(plan.price).toLocaleString(
                              "es-AR"
                            )}
                          </span>

                          <span className="ml-2 text-xs text-[#6B7774]">
                            / mes
                          </span>
                        </div>
                      )}

                      {/* AFILIARME */}

                      <Link
                        href={`/registro?plan=${plan.id}`}
                        className="mt-6 flex w-full items-center justify-center rounded-full bg-[#263F3B] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#6F855F]"
                      >
                        Afiliarme
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section
        id="testimonios"
        className="scroll-mt-8 bg-white px-8 py-16 md:px-16 lg:px-24"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#A2B38B]">
            Testimonios
          </p>

          <h2 className="mt-3 font-serif text-3xl font-semibold md:text-4xl">
            Lo que opinan nuestros pacientes
          </h2>

          <TestimonialsCarousel
            testimonials={publicTestimonials}
            googleReviewsUrl={
              config?.googleReviewsUrl || GOOGLE_REVIEWS_URL
            }
          />
        </div>
      </section>

      <section
        id="contacto"
        className="scroll-mt-8 px-8 py-10 md:px-16 lg:px-24"
      >
        <div className="relative bg-[#A2B38B] px-8 py-16 text-white md:px-20">
          <h2 className="font-serif text-3xl md:text-4xl">
            Tu primera visita comienza con una conversación.
          </h2>

          <p className="mt-4 max-w-xl text-base leading-6 text-white/70">
            Escribinos o pasá a conocernos. Estamos para ayudarte.
          </p>

          <div className="mt-10 grid gap-12 md:grid-cols-2">
            <div>
              <h3 className="mb-4 text-base font-semibold uppercase tracking-[0.25em] text-white/50">
                Horarios
              </h3>

              <div className="space-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                <p>
                  LUNES A VIERNES:{" "}
                  {mainBranch?.mondayToFridayHours || "Sin horario cargado"}
                </p>

                <p>
                  SÁBADOS:{" "}
                  {mainBranch?.saturdayHours || "Sin horario cargado"}
                </p>

                <p>
                  DOMINGOS:{" "}
                  {mainBranch?.sundayHours || "Cerrado"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-base font-semibold uppercase tracking-[0.25em] text-white/50">
                Sucursales
              </h3>

              <div className="space-y-5">
                {branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="text-xs text-white/70">
                      <p className="font-semibold text-white">
                        {branch.name}
                      </p>

                      <p>
                        {branch.address}
                        {branch.city ? ` — ${branch.city}` : ""}
                      </p>
                    </div>

                    {branch.mapUrl && (
                      <a
                        href={branch.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-fit items-center justify-center rounded-full border border-white/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-white hover:text-[#6F855F]"
                      >
                        Ver ubicación
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-[#263F3B]"
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

          <a
            href={`https://wa.me/${(
              config?.whatsapp || "3517049724"
            ).replace(/\D/g, "")}?text=${encodeURIComponent(
              "Hola! Quiero hacer una consulta"
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="
            mt-6
            inline-flex
            w-full
            justify-center
            rounded-full
            bg-[#25D366]
            px-6
            py-3
            text-sm
            font-semibold
            text-white
            shadow-lg
            transition
            hover:bg-[#1EBE5D]
            md:absolute
            md:bottom-10
            md:right-12
            md:mt-0
            md:w-auto
            md:hover:scale-105
            "
          >
            WhatsApp
          </a>
        </div>
      </section>

      <footer className="px-8 py-8 text-center text-sm text-gray-500">
        © 2026 {config?.clinicName || "Consultorios Nazaret"}
      </footer>
    </main>
  );
}