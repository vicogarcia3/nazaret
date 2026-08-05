import Link from "next/link";
import {
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  Clock3,
  CreditCard,
  FileText,
  Mail,
  MessageCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

const faqs = [
  {
    icon: CalendarDays,
    question: "¿Cómo reservo un turno?",
    answer:
      'Ingresá en “Reservar turno”, elegí el tratamiento, el profesional, la fecha y el horario disponible. Al finalizar, vas a ver la confirmación del turno.',
  },
  {
    icon: CalendarCheck,
    question: "¿Cómo puedo cancelar o reprogramar un turno?",
    answer:
      'Desde “Mis turnos” podés consultar tus reservas. Seleccioná el turno correspondiente y elegí la opción disponible para cancelarlo o reprogramarlo. Si el turno está muy próximo, comunicate con el consultorio.',
  },
  {
    icon: FileText,
    question: "¿Cómo veo mis presupuestos?",
    answer:
      'En la sección “Presupuestos” vas a encontrar todos los presupuestos que te haya enviado el consultorio, junto con su fecha, estado, tratamientos e importe.',
  },
  {
    icon: CreditCard,
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Los medios de pago pueden variar según la sucursal y el tratamiento. Podés consultar las opciones disponibles desde la sección Pagos o comunicarte directamente con el consultorio.",
  },
  {
    icon: UserRound,
    question: "¿Cómo actualizo mis datos personales?",
    answer:
      'Ingresá en “Mi perfil” para modificar tu nombre, apellido, correo electrónico, teléfono, fecha de nacimiento, foto y contraseña. Para cambiar el DNI o la sucursal, tenés que comunicarte con el consultorio.',
  },
];

export default async function PatientHelpPage() {
  const [siteConfig, adminUser, branches] = await Promise.all([
    prisma.siteConfig.findFirst({
      select: {
        whatsapp: true,
      },
    }),

    prisma.user.findFirst({
      where: {
        role: "ADMIN",
      },
      select: {
        email: true,
      },
      orderBy: {
        id: "asc",
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
        mondayToFridayHours: true,
        saturdayHours: true,
        sundayHours: true,
      },
    }),
  ]);

  const whatsappValue = siteConfig?.whatsapp || "";

  const contactInfo = {
    whatsappNumber: whatsappValue.replace(/\D/g, ""),
    whatsappDisplay: whatsappValue || "No configurado",
    email: adminUser?.email || "No configurado",
  };

  const whatsappUrl = contactInfo.whatsappNumber
    ? `https://wa.me/${contactInfo.whatsappNumber}?text=${encodeURIComponent(
        "Hola, necesito ayuda con mi cuenta del portal de pacientes."
      )}`
    : "#";

  return (
    <div className="space-y-7">
      <header>
        <h1 className="font-serif text-4xl font-medium text-[#263F3B]">
          Ayuda
        </h1>

        <p className="mt-2 text-[#6B7774]">
          Estamos para ayudarte. Encontrá respuestas a tus dudas o
          contactanos.
        </p>
      </header>

      <section className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <article
          id="preguntas-frecuentes"
          className="border border-[#DED9CD] bg-white p-6 md:p-7"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7B916A]">
              Centro de ayuda
            </p>

            <h2 className="mt-2 text-xl font-semibold text-[#263F3B]">
              Preguntas frecuentes
            </h2>

            <p className="mt-2 text-sm text-[#6B7774]">
              Seleccioná una pregunta para ver su respuesta.
            </p>
          </div>

          <div className="mt-6 divide-y divide-[#E5E1D8]">
            {faqs.map((faq) => {
              const Icon = faq.icon;

              return (
                <details key={faq.question} className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-4 py-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#F0F2EA] text-[#6F855F]">
                      <Icon className="h-5 w-5" />
                    </span>

                    <span className="flex-1 font-medium text-[#263F3B]">
                      {faq.question}
                    </span>

                    <ChevronRight className="h-5 w-5 shrink-0 text-[#6F855F] transition-transform duration-200 group-open:rotate-90" />
                  </summary>

                  <div className="pb-5 pl-[60px] pr-8">
                    <p className="text-sm leading-6 text-[#6B7774]">
                      {faq.answer}
                    </p>
                  </div>
                </details>
              );
            })}
          </div>
        </article>

        <aside
          id="contacto"
          className="border border-[#DED9CD] bg-white p-6 md:p-7"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7B916A]">
            Contacto
          </p>

          <h2 className="mt-2 text-xl font-semibold text-[#263F3B]">
            ¿Necesitás más ayuda?
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#6B7774]">
            Nuestro equipo está disponible para ayudarte con turnos,
            presupuestos, pagos o problemas de acceso.
          </p>

          <div className="mt-6 space-y-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-4 border border-[#E1DED5] bg-[#FAF9F5] p-4 transition hover:border-[#A2B38B] hover:bg-[#F4F5EE]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF0E4] text-[#6F855F]">
                <MessageCircle className="h-5 w-5" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-medium text-[#263F3B]">
                  WhatsApp
                </span>

                <span className="mt-1 block text-sm text-[#6B7774]">
                  {contactInfo.whatsappDisplay}
                </span>
              </span>

              <ChevronRight className="h-5 w-5 text-[#6F855F] transition group-hover:translate-x-1" />
            </a>

            <a
              href={`mailto:${contactInfo.email}`}
              className="group flex items-center gap-4 border border-[#E1DED5] bg-[#FAF9F5] p-4 transition hover:border-[#A2B38B] hover:bg-[#F4F5EE]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF0E4] text-[#6F855F]">
                <Mail className="h-5 w-5" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-medium text-[#263F3B]">
                  Correo electrónico
                </span>

                <span className="mt-1 block truncate text-sm text-[#6B7774]">
                  {contactInfo.email}
                </span>
              </span>

              <ChevronRight className="h-5 w-5 text-[#6F855F] transition group-hover:translate-x-1" />
            </a>

            <div className="flex items-start gap-4 border border-[#E1DED5] bg-[#FAF9F5] p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF0E4] text-[#6F855F]">
                <Clock3 className="h-5 w-5" />
              </span>

              <div>
                <p className="font-medium text-[#263F3B]">
                  Horarios de atención
                </p>

                <div className="mt-3 space-y-4 text-sm leading-6 text-[#6B7774]">
                  {branches.length > 0 ? (
                    branches.map((branch) => (
                      <div
                        key={branch.id}
                        className="border-t border-[#E5E1D8] pt-3 first:border-t-0 first:pt-0"
                      >
                        <p className="font-medium text-[#263F3B]">
                          {branch.name}
                        </p>

                        <p className="mt-1">
                          {branch.address}, {branch.city}
                        </p>

                        {branch.mondayToFridayHours && (
                          <p className="mt-1">
                            Lunes a viernes: {branch.mondayToFridayHours}
                          </p>
                        )}

                        {branch.saturdayHours && (
                          <p>
                            Sábados: {branch.saturdayHours}
                          </p>
                        )}

                        {branch.sundayHours && (
                          <p>
                            Domingos: {branch.sundayHours}
                          </p>
                        )}

                        {!branch.mondayToFridayHours &&
                          !branch.saturdayHours &&
                          !branch.sundayHours && (
                            <p className="mt-1">
                              Horarios no configurados.
                            </p>
                          )}
                      </div>
                    ))
                  ) : (
                    <p>No hay sucursales activas.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-[#E5E1D8] pt-5">
            <p className="text-sm text-[#6B7774]">
              También podés acercarte a tu sucursal habitual para recibir
              atención presencial.
            </p>
          </div>
        </aside>
      </section>

      <section className="flex flex-col gap-5 border border-[#D7DFC9] bg-[#F0F4E9] p-6 sm:flex-row sm:items-center">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#6F855F] text-white">
          <ShieldCheck className="h-7 w-7" />
        </div>

        <div className="flex-1">
          <h2 className="font-semibold text-[#263F3B]">
            Tu información está segura
          </h2>

          <p className="mt-1 text-sm leading-6 text-[#6B7774]">
            Cuidamos la privacidad de tus datos personales y nunca te
            solicitaremos contraseñas ni información sensible por WhatsApp o
            correo electrónico.
          </p>
        </div>

        <Link
          href="/dashboard/patient/perfil"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#6F855F] transition hover:text-[#536847]"
        >
          Revisar mi perfil
          <ChevronRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}