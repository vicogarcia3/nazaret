import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function HistoriaClinicaPdfPage({ params }: Props) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      branch: true,
      plan: true,
      histories: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!patient) {
    notFound();
  }

  const history = patient.histories[0];
  const data = (history?.data || {}) as Record<string, string>;

  return (
    <main className="mx-auto max-w-5xl bg-white p-10 text-sm text-black">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <h1 className="mb-6 text-center text-2xl font-bold uppercase">
        Historia Clínica General
      </h1>

      <section className="grid grid-cols-2 gap-4 border-b pb-4">
        <p><strong>Lugar:</strong> {data.lugar || "-"}</p>
        <p><strong>Fecha:</strong> {data.fecha || "-"}</p>
        <p><strong>Odontólogo:</strong> {data.odontologo || "-"}</p>
        <p><strong>Nº Matrícula:</strong> {data.matricula || "-"}</p>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-4 border-b pb-4">
        <p><strong>Paciente:</strong> {patient.lastName}, {patient.firstName}</p>
        <p><strong>DNI:</strong> {patient.dni || "-"}</p>
        <p><strong>Teléfono:</strong> {patient.phone}</p>
        <p><strong>Email:</strong> {patient.email || "-"}</p>
        <p><strong>Obra social:</strong> {data.obraSocial || "-"}</p>
        <p><strong>Fecha nac.:</strong> {data.fechaNacimiento || "-"}</p>
        <p><strong>Edad:</strong> {data.edad || "-"}</p>
        <p><strong>Estado civil:</strong> {data.estadoCivil || "-"}</p>
        <p><strong>Nacionalidad:</strong> {data.nacionalidad || "-"}</p>
        <p><strong>Domicilio:</strong> {data.domicilio || "-"}</p>
        <p><strong>Profesión:</strong> {data.profesion || "-"}</p>
        <p><strong>Sucursal:</strong> {patient.branch.name} — {patient.branch.address}</p>
      </section>

      <Section title="Antecedentes familiares">
        <Item label="Padre con vida" value={data.padreVida} />
        <Item label="Enfermedad del padre" value={data.padreEnfermedad} />
        <Item label="Madre con vida" value={data.madreVida} />
        <Item label="Enfermedad de la madre" value={data.madreEnfermedad} />
        <Item label="Hermanos" value={data.hermanos} />
        <Item label="Hermanos sanos" value={data.hermanosSanos} />
      </Section>

      <Section title="Antecedentes médicos">
        <Item label="Sufre enfermedad" value={data.enfermedad} />
        <Item label="Detalle enfermedad" value={data.enfermedadDetalle} />
        <Item label="Tratamiento médico" value={data.tratamientoMedico} />
        <Item label="Medicamentos habituales" value={data.medicamentosHabituales} />
        <Item label="Alergias" value={data.alergiaDetalle} />
        <Item label="Diabetes" value={data.diabetico} />
        <Item label="Problema cardíaco" value={data.problemaCardiacoDetalle} />
        <Item label="Presión alta" value={data.presionAlta} />
        <Item label="Chagas" value={data.chagas} />
        <Item label="Hepatitis" value={data.hepatitis} />
        <Item label="Convulsiones / epilepsia" value={data.medicacionEpilepsia} />
        <Item label="Cirugías" value={data.operadoDetalle} />
        <Item label="Problemas respiratorios" value={data.respiratorioDetalle} />
        <Item label="Fuma" value={data.fuma} />
        <Item label="Embarazo" value={data.embarazada} />
        <Item label="Médico clínico" value={data.medicoClinico} />
        <Item label="Clínica / derivación" value={data.clinicaDerivacion} />
      </Section>

      <Section title="Historia clínica odontológica">
        <Item label="Motivo de consulta" value={data.motivoConsulta} />
        <Item label="Consultó otro profesional" value={data.otroProfesional} />
        <Item label="Medicamentos" value={data.medicamentoConsultaNombre} />
        <Item label="Dolor" value={data.dolor} />
        <Item label="Golpe en dientes" value={data.golpeDetalle} />
        <Item label="Fractura dental" value={data.fracturaDetalle} />
        <Item label="Dificultad para hablar" value={data.dificultadHablar} />
        <Item label="Dificultad para masticar" value={data.dificultadMasticar} />
        <Item label="Dificultad para abrir la boca" value={data.dificultadAbrir} />
        <Item label="Dificultad para tragar" value={data.dificultadTragar} />
      </Section>

      <Section title="Examen bucal">
        <Item label="Labios" value={data.labios} />
        <Item label="Lengua" value={data.lengua} />
        <Item label="Paladar" value={data.paladar} />
        <Item label="Piso de boca" value={data.pisoBoca} />
        <Item label="Manchas" value={data.manchas} />
        <Item label="Ulceraciones" value={data.ulceraciones} />
        <Item label="Sangrado de encías" value={data.sangranEncias} />
        <Item label="Pus" value={data.pusDonde} />
        <Item label="Movilidad dental" value={data.movilidad} />
        <Item label="Higiene bucal" value={data.higiene} />
        <Item label="Presencia de sarro" value={data.sarro} />
        <Item label="Enfermedad periodontal" value={data.enfermedadPeriodontal} />
      </Section>

      <Section title="Diagnóstico y tratamiento">
        <Item label="Diagnóstico presuntivo" value={data.diagnostico || history?.diagnosis} />
        <Item label="Plan de tratamiento" value={data.planTratamiento || history?.treatment} />
        <Item label="Observaciones" value={data.observaciones} />
      </Section>

      <section className="mt-8 border p-4">
        <p>
          He comprendido todas las explicaciones que se me han facilitado en
          lenguaje claro y sencillo, he podido realizar todas las observaciones
          y se me han aclarado todas las dudas; por lo que estoy completamente
          de acuerdo con el tratamiento que se me va a realizar.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-8 text-center">
          <div className="border-t pt-2">Firma del paciente o tutor</div>
          <div className="border-t pt-2">Aclaración</div>
          <div className="border-t pt-2">DNI Nº</div>
        </div>
      </section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 border-b pb-4">
      <h2 className="mb-3 text-lg font-bold uppercase">{title}</h2>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </section>
  );
}

function Item({ label, value }: { label: string; value?: string | null }) {
  return (
    <p>
      <strong>{label}:</strong> {value || "-"}
    </p>
  );
}