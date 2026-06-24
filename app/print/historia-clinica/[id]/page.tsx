import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function HistoriaClinicaPrintPage({ params }: Props) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      branch: true,
      histories: {
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!patient) notFound();

  const history = patient.histories[0];
  const data = (history?.data || {}) as Record<string, string>;

  return (
    <main className="min-h-screen bg-white p-6 text-[12px] text-black print:p-0">
      <div className="mx-auto mb-4 flex max-w-[900px] justify-end print:hidden">
        <PrintButton />
      </div>

      <section className="mx-auto max-w-[900px] border border-black p-6 print:border-0">
        <h1 className="mb-4 text-center text-xl font-bold uppercase">
          Historia Clínica General
        </h1>

        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          <Line label="Lugar" value={data.lugar} />
          <Line label="Fecha" value={data.fecha} />
          <Line label="Odontólogo" value={data.odontologo} />
          <Line label="Nº Matrícula" value={data.matricula} />
        </div>

        <div className="mt-4 border-t border-black pt-3">
          <p className="font-bold">
            Paciente: {patient.lastName}, {patient.firstName}
          </p>

          <div className="mt-2 grid grid-cols-3 gap-x-6 gap-y-2">
            <Line label="DNI" value={patient.dni || data.documento} />
            <Line label="Tel." value={patient.phone || data.telefono} />
            <Line label="Cel." value={data.celular} />
            <Line label="O. Social" value={data.obraSocial} />
            <Line label="F. Nac." value={data.fechaNacimiento} />
            <Line label="Edad" value={data.edad} />
            <Line label="Estado civil" value={data.estadoCivil} />
            <Line label="Nacionalidad" value={data.nacionalidad} />
            <Line label="Sucursal" value={`${patient.branch.name} - ${patient.branch.address}`} />
          </div>

          <LineFull label="Domicilio" value={data.domicilio} />
          <LineFull label="Profesión / Actividad" value={data.profesion} />
        </div>

        <p className="mt-4 font-semibold">
          Este cuestionario tiene el tenor de una “Declaración Jurada”
        </p>

        <div className="mt-3 grid grid-cols-2 gap-8">
          <div className="space-y-1">
            <YesNo label="Padre con vida" value={data.padreVida} />
            <LineFull label="Enfermedad que padece o padeció" value={data.padreEnfermedad} />
            <YesNo label="Madre con vida" value={data.madreVida} />
            <LineFull label="Enfermedad que padece o padeció" value={data.madreEnfermedad} />
            <YesNo label="Hermanos" value={data.hermanos} />
            <LineFull label="Sanos" value={data.hermanosSanos} />
            <YesNo label="Sufre de alguna enfermedad" value={data.enfermedad} />
            <LineFull label="De qué" value={data.enfermedadDetalle} />
            <YesNo label="Hace algún tratamiento médico" value={data.tratamientoMedico} />
            <LineFull label="Cuál" value={data.tratamientoMedicoDetalle} />
            <TextBlock label="Medicamentos habituales" value={data.medicamentosHabituales} />
            <TextBlock label="Medicamentos últimos 5 años" value={data.medicamentosUltimos5} />
            <YesNo label="Realiza algún deporte" value={data.deporte} />
            <YesNo label="Malestar al realizarlo" value={data.malestarDeporte} />
            <YesNo label="Es alérgico a alguna droga" value={data.alergia} />
            <LineFull label="Anestesia / penicilina / otros" value={data.alergiaDetalle} />
          </div>

          <div className="space-y-1">
            <LineFull label="Cicatriza bien / sangra mucho" value={`${data.cicatrizaBien || ""} ${data.sangraMucho || ""}`} />
            <YesNo label="Problema de colágeno" value={data.colageno} />
            <YesNo label="Fiebre reumática" value={data.fiebreReumatica} />
            <LineFull label="Medicación de protección" value={data.medicacionProteccion} />
            <YesNo label="Diabético" value={data.diabetico} />
            <LineFull label="Control diabetes" value={data.diabetesControl} />
            <YesNo label="Problema cardíaco" value={data.problemaCardiaco} />
            <LineFull label="Cuál" value={data.problemaCardiacoDetalle} />
            <YesNo label="Aspirina / anticoagulante" value={data.anticoagulante} />
            <LineFull label="Frecuencia" value={data.anticoagulanteFrecuencia} />
            <YesNo label="Presión alta" value={data.presionAlta} />
            <YesNo label="Chagas" value={data.chagas} />
            <LineFull label="Tratamiento" value={data.chagasTratamiento} />
            <YesNo label="Problemas renales" value={data.renal} />
            <YesNo label="Úlcera gástrica" value={data.ulcera} />
            <YesNo label="Hepatitis" value={data.hepatitis} />
            <LineFull label="Tipo" value={data.tipoHepatitis} />
            <YesNo label="Fuma" value={data.fuma} />
            <YesNo label="Embarazada" value={data.embarazada} />
          </div>
        </div>

        <h2 className="mt-5 font-bold">Historia Clínica Odontológica</h2>

        <TextBlock label="Motivo de consulta" value={data.motivoConsulta} />
        <YesNo label="Consultó antes con otro profesional" value={data.otroProfesional} />
        <YesNo label="Tomó algún medicamento" value={data.medicamentoConsulta} />
        <LineFull label="Nombre de medicamentos" value={data.medicamentoConsultaNombre} />
        <LineFull label="Desde cuándo" value={data.desdeCuando} />
        <YesNo label="Obtuvo resultados" value={data.obtuvoResultados} />
        <TextBlock label="Dolor" value={data.dolor} />
        <YesNo label="Golpe en los dientes" value={data.golpeDientes} />
        <TextBlock label="Detalle del golpe" value={data.golpeDetalle} />
        <YesNo label="Fractura dental" value={data.fracturaDiente} />
        <TextBlock label="Detalle fractura" value={data.fracturaDetalle} />

        <div className="mt-4 break-before-page">
          <h2 className="mb-3 text-center font-bold">02</h2>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <LineFull label="Labios" value={data.labios} />
              <LineFull label="Lengua" value={data.lengua} />
              <LineFull label="Paladar" value={data.paladar} />
              <LineFull label="Piso de boca" value={data.pisoBoca} />
              <YesNo label="Manchas" value={data.manchas} />
              <YesNo label="Abultamiento de tejidos" value={data.abultamiento} />
              <YesNo label="Ulceraciones" value={data.ulceraciones} />
              <YesNo label="Ampollas" value={data.ampollas} />
              <LineFull label="Otros" value={data.lesionesOtros} />
              <YesNo label="Sangran las encías" value={data.sangranEncias} />
              <LineFull label="Cuándo" value={data.sangranCuando} />
            </div>

            <div>
              <YesNo label="Sale pus" value={data.pus} />
              <LineFull label="De dónde" value={data.pusDonde} />
              <YesNo label="Movilidad dental" value={data.movilidad} />
              <LineFull label="Dientes altos al morder" value={data.dientesAltos} />
              <YesNo label="Cara hinchada" value={data.caraHinchada} />
              <LineFull label="Hielo / calor / otros" value={data.hieloCalorOtros} />
              <LineFull label="Momentos de azúcar diario" value={data.momentosAzucar} />
              <LineFull label="Índice de placa" value={data.indicePlaca} />
              <LineFull label="Estado de higiene bucal" value={data.higiene} />
            </div>
          </div>

          <div className="mt-4 border-y border-black py-3 italic">
            Declaro que he contestado todas las preguntas con honestidad y según mi conocimiento.
            Asimismo, he sido informado que los datos suministrados quedan reservados en la presente
            Historia Clínica y amparados en secreto profesional.
          </div>

          <OdontogramReadOnly data={data.odontogramData as any} />

          <div className="mt-4 flex gap-8">
            <YesNo label="Presencia de sarro" value={data.sarro} />
            <YesNo label="Enfermedad periodontal" value={data.enfermedadPeriodontal} />
          </div>

          <TextBlock label="Diagnóstico presuntivo" value={data.diagnostico || history?.diagnosis || ""} lines={4} />
          <LineFull label="Continúa en Anexo Nº" value={data.anexoDiagnostico} />

          <LineFull label="Plan de tratamiento - fecha" value={data.planFecha} />
          <TextBlock label="Plan de tratamiento" value={data.planTratamiento || history?.treatment || ""} lines={4} />
          <LineFull label="Continúa en Anexo Nº" value={data.anexoPlan} />

          <TextBlock label="Observaciones" value={data.observaciones} lines={4} />
          <LineFull label="Continúa en Anexo Nº" value={data.anexoObservaciones} />

          <div className="mt-5 text-[11px]">
            He comprendido todas las explicaciones que se me han facilitado en lenguaje claro y sencillo,
            he podido realizar todas las observaciones y se me han aclarado todas las dudas; por lo que estoy
            completamente de acuerdo con el tratamiento que se me va a realizar.
          </div>

          <div className="mt-3">
            <LineFull
              label="El/la que suscribe"
              value={`${data.consentimientoNombre || ""} DNI Nº ${data.consentimientoDni || ""} domicilio ${data.consentimientoDomicilio || ""}`}
            />
            <LineFull label="Tratamiento propuesto por Dr/a MP" value={data.doctorMp} />
          </div>

          <div className="mt-12 grid grid-cols-3 gap-8 text-center text-[11px]">
            <div className="border-t border-black pt-1">Firma del paciente o tutor</div>
            <div className="border-t border-black pt-1">Aclaración</div>
            <div className="border-t border-black pt-1">DNI Nº</div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Line({ label, value }: { label: string; value?: string | null }) {
  return (
    <p className="border-b border-dotted border-black pb-1">
      <strong>{label}:</strong> {value || ""}
    </p>
  );
}

function LineFull({ label, value }: { label: string; value?: string | null }) {
  return (
    <p className="mt-2 border-b border-dotted border-black pb-1">
      <strong>{label}:</strong> {value || ""}
    </p>
  );
}

function TextBlock({
  label,
  value,
  lines = 2,
}: {
  label: string;
  value?: string | null;
  lines?: number;
}) {
  return (
    <div className="mt-2">
      <p className="font-bold underline">{label}</p>
      <div className="whitespace-pre-wrap border-b border-dotted border-black pb-1 min-h-[40px]">
        {value || Array(lines).fill("................................................................................................").join("\n")}
      </div>
    </div>
  );
}

function YesNo({ label, value }: { label: string; value?: string | null }) {
  return (
    <p className="flex justify-between gap-4 border-b border-dotted border-black pb-1">
      <span>{label}</span>
      <span>
        SI {value === "SI" ? "☑" : "☐"} &nbsp; NO {value === "NO" ? "☑" : "☐"}
      </span>
    </p>
  );
}

function OdontogramReadOnly({
  data = {},
}: {
  data?: Record<string, any>;
}) {
  const upperRight = ["18", "17", "16", "15", "14", "13", "12", "11"];
  const upperLeft = ["21", "22", "23", "24", "25", "26", "27", "28"];
  const lowerRight = ["48", "47", "46", "45", "44", "43", "42", "41"];
  const lowerLeft = ["31", "32", "33", "34", "35", "36", "37", "38"];
  const tempUpperRight = ["55", "54", "53", "52", "51"];
  const tempUpperLeft = ["61", "62", "63", "64", "65"];
  const tempLowerRight = ["85", "84", "83", "82", "81"];
  const tempLowerLeft = ["71", "72", "73", "74", "75"];

  const symbols = [
    { value: "corona", icon: "○" },
    { value: "extraccion", icon: "X" },
    { value: "noErupcionado", icon: "=" },
    { value: "sellador", icon: "△" },
  ];

  function getColor(color?: string) {
    return color === "blue" ? "#2563EB" : "#EF4444";
  }

  function Tooth({ number, pos }: { number: string; pos: "top" | "bottom" }) {
    const tooth = data[number] || {};
    const faces = tooth.faces || {};
    const icon = symbols.find((s) => s.value === tooth.symbol)?.icon;

    return (
      <div className="flex flex-col items-center">
        {pos === "top" && <span className="text-[10px]">{number}</span>}

        <div className="relative h-6 w-6 border border-black bg-white">
          <div
            className="absolute left-[6px] top-[6px] h-[12px] w-[12px] border border-black"
            style={{
              backgroundColor: faces.center ? getColor(faces.center) : "white",
            }}
          />

          <div
            className="absolute left-[4px] top-0 h-[6px] w-[16px] border border-black"
            style={{
              backgroundColor: faces.top ? getColor(faces.top) : "white",
            }}
          />

          <div
            className="absolute bottom-0 left-[4px] h-[6px] w-[16px] border border-black"
            style={{
              backgroundColor: faces.bottom ? getColor(faces.bottom) : "white",
            }}
          />

          <div
            className="absolute left-0 top-[4px] h-[16px] w-[6px] border border-black"
            style={{
              backgroundColor: faces.left ? getColor(faces.left) : "white",
            }}
          />

          <div
            className="absolute right-0 top-[4px] h-[16px] w-[6px] border border-black"
            style={{
              backgroundColor: faces.right ? getColor(faces.right) : "white",
            }}
          />

          {icon && (
            <span
              className="absolute inset-0 flex items-center justify-center text-sm font-bold"
              style={{ color: getColor(tooth.symbolColor) }}
            >
              {icon}
            </span>
          )}
        </div>

        {pos === "bottom" && <span className="text-[10px]">{number}</span>}
      </div>
    );
  }

  function Row({ teeth, pos }: { teeth: string[]; pos: "top" | "bottom" }) {
    return (
      <div className="flex gap-1">
        {teeth.map((t) => (
          <Tooth key={t} number={t} pos={pos} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-5 grid grid-cols-[1fr_180px] gap-6">
      <div>
        <div className="mx-auto w-fit">
          <div className="flex gap-3">
            <Row teeth={upperRight} pos="top" />
            <div className="w-px bg-black" />
            <Row teeth={upperLeft} pos="top" />
          </div>

          <div className="my-1 h-px bg-black" />

          <div className="flex gap-3">
            <Row teeth={lowerRight} pos="bottom" />
            <div className="w-px bg-black" />
            <Row teeth={lowerLeft} pos="bottom" />
          </div>
        </div>

        <div className="mx-auto mt-2 flex w-[430px] justify-between text-xs italic">
          <span>Derecha</span>
          <span>Izquierda</span>
        </div>

        <div className="mx-auto mt-2 w-fit">
          <div className="flex gap-3">
            <Row teeth={tempUpperRight} pos="top" />
            <div className="w-px bg-black" />
            <Row teeth={tempUpperLeft} pos="top" />
          </div>

          <div className="my-1 h-px bg-black" />

          <div className="flex gap-3">
            <Row teeth={tempLowerRight} pos="bottom" />
            <div className="w-px bg-black" />
            <Row teeth={tempLowerLeft} pos="bottom" />
          </div>
        </div>
      </div>

      <div className="border border-black p-2 text-[10px]">
        <p className="font-bold underline">REFERENCIAS</p>
        <p>COLOR ROJO Prestaciones existentes</p>
        <p>COLOR AZUL Prestaciones requeridas</p>
        <p>X Diente ausente o a extraer</p>
        <div className="mt-2 flex items-center gap-2"><div className="h-3 w-8 border border-black" /> Prótesis fija</div>
        <div className="flex items-center gap-2"><div className="h-3 w-8 border border-black" /> Prótesis removible</div>
        <p>◯ Coronas</p>
        <p>Cantidad de dientes existentes ____</p>
      </div>
    </div>
  );
}