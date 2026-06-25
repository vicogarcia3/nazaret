"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  patientId: string;
};

type FormState = Record<string, string>;
type Color = "red" | "blue";
type Face = "center" | "top" | "bottom" | "left" | "right";
type SymbolType = "corona" | "extraccion" | "noErupcionado" | "sellador";

type ToothMark = {
  symbol?: SymbolType;
  symbolColor?: Color;
  faces?: Partial<Record<Face, Color>>;
};

const initialForm: FormState = {
  lugar: "",
  fecha: "",
  odontologo: "",
  matricula: "",
  obraSocial: "",
  fechaNacimiento: "",
  telefono: "",
  edad: "",
  estadoCivil: "",
  nacionalidad: "",
  documento: "",
  celular: "",
  domicilio: "",
  profesion: "",
  titular: "",
  lugarTrabajo: "",
  jerarquia: "",

  padreVida: "",
  padreEnfermedad: "",
  madreVida: "",
  madreEnfermedad: "",
  hermanos: "",
  hermanosSanos: "",

  enfermedad: "",
  enfermedadDetalle: "",
  tratamientoMedico: "",
  tratamientoMedicoDetalle: "",
  medicamentosHabituales: "",
  medicamentosUltimos5: "",
  deporte: "",
  malestarDeporte: "",
  alergia: "",
  alergiaDetalle: "",
  cicatrizaBien: "",
  sangraMucho: "",
  colageno: "",
  fiebreReumatica: "",
  medicacionProteccion: "",
  diabetico: "",
  diabetesControl: "",
  problemaCardiaco: "",
  problemaCardiacoDetalle: "",
  anticoagulante: "",
  anticoagulanteFrecuencia: "",
  presionAlta: "",
  chagas: "",
  chagasTratamiento: "",
  renal: "",
  ulcera: "",
  hepatitis: "",
  tipoHepatitis: "",
  hepatico: "",
  hepaticoDetalle: "",
  convulsiones: "",
  epileptico: "",
  medicacionEpilepsia: "",
  sifilisGonorrea: "",
  infectocontagiosa: "",
  transfusiones: "",
  operado: "",
  operadoDetalle: "",
  operadoCuando: "",
  respiratorio: "",
  respiratorioDetalle: "",
  fuma: "",
  embarazada: "",
  mesesEmbarazo: "",
  otraEnfermedad: "",
  otraEnfermedadDetalle: "",
  homeopatico: "",
  medicoClinico: "",
  clinicaDerivacion: "",

  motivoConsulta: "",
  otroProfesional: "",
  medicamentoConsulta: "",
  medicamentoConsultaNombre: "",
  desdeCuando: "",
  obtuvoResultados: "",
  dolor: "",
  dolorTipo: "",
  dolorFrio: "",
  dolorCalor: "",
  dolorLocalizado: "",
  dolorIrradiado: "",
  calmaDolor: "",
  golpeDientes: "",
  golpeDetalle: "",
  fracturaDiente: "",
  fracturaDetalle: "",
  dificultadHablar: "",
  dificultadMasticar: "",
  dificultadAbrir: "",
  dificultadTragar: "",

  labios: "",
  lengua: "",
  paladar: "",
  pisoBoca: "",
  carrillos: "",
  rebordes: "",
  trigono: "",
  manchas: "",
  abultamiento: "",
  ulceraciones: "",
  ampollas: "",
  lesionesOtros: "",
  sangranEncias: "",
  sangranCuando: "",
  pus: "",
  pusDonde: "",
  movilidad: "",
  dientesAltos: "",
  caraHinchada: "",
  hieloCalorOtros: "",
  momentosAzucar: "",
  indicePlaca: "",
  higiene: "",
  sarro: "",
  enfermedadPeriodontal: "",

  diagnostico: "",
  anexoDiagnostico: "",
  planFecha: "",
  planTratamiento: "",
  anexoPlan: "",
  observaciones: "",
  anexoObservaciones: "",
  consentimientoNombre: "",
  consentimientoDni: "",
  consentimientoDomicilio: "",
  doctorMp: "",
};

function YesNo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-dotted border-gray-300 py-1">
      <span>{label}</span>

      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={value === "SI"}
            onChange={() => onChange("SI")}
          />
          SI
        </label>

        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={value === "NO"}
            onChange={() => onChange("NO")}
          />
          NO
        </label>
      </div>
    </div>
  );
}

function LineInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        className="mt-1 w-full border-b border-dotted border-gray-500 bg-transparent p-1 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function LineTextarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold underline">{label}</span>
      <textarea
        rows={rows}
        className="mt-1 w-full rounded border border-gray-300 p-2 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}


function PrintableOdontogram({
  odontogramData,
  setOdontogramData,
}: {
  odontogramData: Record<string, ToothMark>;
  setOdontogramData: React.Dispatch<
    React.SetStateAction<Record<string, ToothMark>>
  >;
}) {
  type Color = "red" | "blue";
  type Face = "center" | "top" | "bottom" | "left" | "right";
  type SymbolType = "corona" | "extraccion" | "noErupcionado" | "sellador";

  type ToothMark = {
    symbol?: SymbolType;
    symbolColor?: Color;
    faces?: Partial<Record<Face, Color>>;
  };

  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<Color>("red");

  const upperRight = ["18", "17", "16", "15", "14", "13", "12", "11"];
  const upperLeft = ["21", "22", "23", "24", "25", "26", "27", "28"];
  const lowerRight = ["48", "47", "46", "45", "44", "43", "42", "41"];
  const lowerLeft = ["31", "32", "33", "34", "35", "36", "37", "38"];

  const tempUpperRight = ["55", "54", "53", "52", "51"];
  const tempUpperLeft = ["61", "62", "63", "64", "65"];
  const tempLowerRight = ["85", "84", "83", "82", "81"];
  const tempLowerLeft = ["71", "72", "73", "74", "75"];

  const symbols = [
    { value: "corona", label: "Corona", icon: "○" },
    { value: "extraccion", label: "Extracción", icon: "X" },
    { value: "noErupcionado", label: "No erupcionado", icon: "=" },
    { value: "sellador", label: "Selladores", icon: "△" },
  ] as const;

  function getColor(color?: Color) {
    return color === "blue" ? "#2563EB" : "#EF4444";
  }

  function applySymbol(symbol: SymbolType) {
    if (!selectedTooth) {
      alert("Seleccioná una pieza primero.");
      return;
    }

    setOdontogramData((prev) => ({
      ...prev,
      [selectedTooth]: {
        ...(prev[selectedTooth] || {}),
        symbol,
        symbolColor: selectedColor,
      },
    }));
  }

  function toggleFace(face: Face) {
    if (!selectedTooth) {
      alert("Seleccioná una pieza primero.");
      return;
    }

    setOdontogramData((prev) => {
      const currentTooth = prev[selectedTooth] || {};
      const currentFaces = currentTooth.faces || {};

      return {
        ...prev,
        [selectedTooth]: {
          ...currentTooth,
          faces: {
            ...currentFaces,
            [face]: currentFaces[face] === selectedColor ? undefined : selectedColor,
          },
        },
      };
    });
  }

  function clearTooth() {
    if (!selectedTooth) return;

    setOdontogramData((prev) => {
      const copy = { ...prev };
      delete copy[selectedTooth];
      return copy;
    });
  }

  function ToothBox({
    number,
    position,
  }: {
    number: string;
    position: "top" | "bottom";
  }) {
    const tooth = odontogramData[number];
    const faces = tooth?.faces || {};
    const icon = symbols.find((s) => s.value === tooth?.symbol)?.icon;

    return (
      <button
        type="button"
        onClick={() => setSelectedTooth(number)}
        className={`flex flex-col items-center ${
          selectedTooth === number ? "scale-110" : ""
        }`}
      >
        {position === "top" && (
          <span className="mb-1 text-[11px] leading-none">{number}</span>
        )}

        <div className="relative h-7 w-7 border border-black bg-white">
          <div
            className="absolute left-[7px] top-[7px] h-[12px] w-[12px] border border-black"
            style={{
              backgroundColor: faces.center ? getColor(faces.center) : "white",
            }}
          />

          <div
            className="absolute left-[5px] top-0 h-[7px] w-[16px] border border-black"
            style={{
              backgroundColor: faces.top ? getColor(faces.top) : "white",
            }}
          />

          <div
            className="absolute bottom-0 left-[5px] h-[7px] w-[16px] border border-black"
            style={{
              backgroundColor: faces.bottom ? getColor(faces.bottom) : "white",
            }}
          />

          <div
            className="absolute left-0 top-[5px] h-[16px] w-[7px] border border-black"
            style={{
              backgroundColor: faces.left ? getColor(faces.left) : "white",
            }}
          />

          <div
            className="absolute right-0 top-[5px] h-[16px] w-[7px] border border-black"
            style={{
              backgroundColor: faces.right ? getColor(faces.right) : "white",
            }}
          />

          {icon && (
            <span
              className="absolute inset-0 flex items-center justify-center text-base font-bold"
              style={{ color: getColor(tooth?.symbolColor) }}
            >
              {icon}
            </span>
          )}
        </div>

        {position === "bottom" && (
          <span className="mt-1 text-[11px] leading-none">{number}</span>
        )}
      </button>
    );
  }

  function Row({
    teeth,
    position,
  }: {
    teeth: string[];
    position: "top" | "bottom";
  }) {
    return (
      <div className="flex gap-1">
        {teeth.map((tooth) => (
          <ToothBox key={tooth} number={tooth} position={position} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded border border-gray-300 p-4">
      <div className="flex justify-center">
        <div>
          <div className="mx-auto w-fit">
            <div className="flex items-end justify-center gap-4">
              <Row teeth={upperRight} position="top" />
              <div className="h-12 w-px bg-black" />
              <Row teeth={upperLeft} position="top" />
            </div>

            <div className="my-2 h-px w-full bg-black" />

            <div className="flex items-start justify-center gap-4">
              <Row teeth={lowerRight} position="bottom" />
              <div className="h-12 w-px bg-black" />
              <Row teeth={lowerLeft} position="bottom" />
            </div>
          </div>

          <div className="mx-auto mt-3 flex w-[520px] max-w-full justify-between px-8 text-sm italic">
            <span>Derecha</span>
            <span>Izquierda</span>
          </div>

          <div className="mx-auto mt-2 w-fit">
            <div className="flex items-end justify-center gap-4">
              <Row teeth={tempUpperRight} position="top" />
              <div className="h-12 w-px bg-black" />
              <Row teeth={tempUpperLeft} position="top" />
            </div>

            <div className="my-2 h-px w-full bg-black" />

            <div className="flex items-start justify-center gap-4">
              <Row teeth={tempLowerRight} position="bottom" />
              <div className="h-12 w-px bg-black" />
              <Row teeth={tempLowerLeft} position="bottom" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded border p-4 text-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <h4 className="mb-2 font-bold">Color</h4>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedColor("red")}
                className={`rounded px-3 py-1 text-white ${
                  selectedColor === "red" ? "bg-red-600" : "bg-red-300"
                }`}
              >
                Rojo
              </button>

              <button
                type="button"
                onClick={() => setSelectedColor("blue")}
                className={`rounded px-3 py-1 text-white ${
                  selectedColor === "blue" ? "bg-blue-600" : "bg-blue-300"
                }`}
              >
                Azul
              </button>
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-bold">
              Pieza: {selectedTooth || "ninguna"}
            </h4>

            <button
              type="button"
              onClick={clearTooth}
              className="rounded border border-red-400 px-3 py-1 text-red-600"
            >
              Limpiar pieza
            </button>
          </div>

          <div>
            <h4 className="mb-2 font-bold">Símbolos</h4>

            <div className="grid grid-cols-2 gap-2">
              {symbols.map((symbol) => (
                <button
                  key={symbol.value}
                  type="button"
                  onClick={() => applySymbol(symbol.value)}
                  className="rounded border px-2 py-1 hover:bg-gray-50"
                >
                  {symbol.icon} {symbol.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-bold">Operatoria</h4>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => toggleFace("top")} className="rounded border px-2 py-1">
                Arriba
              </button>

              <button type="button" onClick={() => toggleFace("bottom")} className="rounded border px-2 py-1">
                Abajo
              </button>

              <button type="button" onClick={() => toggleFace("left")} className="rounded border px-2 py-1">
                Izquierda
              </button>

              <button type="button" onClick={() => toggleFace("right")} className="rounded border px-2 py-1">
                Derecha
              </button>

              <button type="button" onClick={() => toggleFace("center")} className="col-span-2 rounded border px-2 py-1">
                Centro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClinicalHistoryEditor({ patientId }: Props) {
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [odontogramData, setOdontogramData] = useState<Record<string, ToothMark>>({});

  useEffect(() => {
    fetch(`/api/clinical-history?patientId=${patientId}`)
      .then((res) => res.json())
      .then((history) => {
        if (history) {
          setHistoryId(history.id);
          const savedData = (history.data || {}) as any;
          setForm ({
            ...initialForm,
            ...savedData,
            diagnostico: history.diagnosis || "",
            planTratamiento: history.treatment || "",
          });

          setOdontogramData(savedData.odontogramData || {});
        }
      });
  }, [patientId]);

  function update(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function saveHistory() {
    console.log("ODONTOGRAMA A GUARDAR", odontogramData);
    const res = await fetch("/api/clinical-history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: historyId,
        patientId,
        diagnosis: form.diagnostico,
        treatment: form.planTratamiento,
        data: {
          ...form,
          odontogramData,
        },
      }),
    });

    if (!res.ok) {
      alert("No se pudo guardar la historia clínica.");
      return;
    }

    const saved = await res.json();
    setHistoryId(saved.id);
    alert("Historia clínica guardada.");
  }

  return (
    <section className="space-y-8 rounded-xl border bg-white p-8 shadow-sm print:shadow-none">
      <div className="flex items-center justify-between gap-4 print:hidden">

        <div className="flex gap-3">
          <Link
            href={`/print/historia-clinica/${patientId}`}
            target="_blank"
            className="rounded bg-gray-700 px-5 py-3 text-white"
          >
            Ver PDF
          </Link>

          <button
            type="button"
            onClick={saveHistory}
            className="rounded bg-[#A2B38B] px-5 py-3 text-white hover:bg-[#8FA178]"
          >
            Guardar
          </button>
        </div>
      </div>

      <div className="text-center print:block">
        <h1 className="text-2xl font-bold uppercase">Historia clínica general</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <LineInput label="Lugar" value={form.lugar} onChange={(v) => update("lugar", v)} />
        <LineInput label="Fecha" value={form.fecha} onChange={(v) => update("fecha", v)} />
        <LineInput label="Odontólogo" value={form.odontologo} onChange={(v) => update("odontologo", v)} />
        <LineInput label="Nº Matrícula" value={form.matricula} onChange={(v) => update("matricula", v)} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <LineInput label="Obra social" value={form.obraSocial} onChange={(v) => update("obraSocial", v)} />
        <LineInput label="F. Nac." value={form.fechaNacimiento} onChange={(v) => update("fechaNacimiento", v)} />
        <LineInput label="Tel." value={form.telefono} onChange={(v) => update("telefono", v)} />
        <LineInput label="Edad" value={form.edad} onChange={(v) => update("edad", v)} />
        <LineInput label="Estado civil" value={form.estadoCivil} onChange={(v) => update("estadoCivil", v)} />
        <LineInput label="Nacionalidad" value={form.nacionalidad} onChange={(v) => update("nacionalidad", v)} />
        <LineInput label="Nº Doc." value={form.documento} onChange={(v) => update("documento", v)} />
        <LineInput label="Cel." value={form.celular} onChange={(v) => update("celular", v)} />
      </div>

      <LineInput label="Domicilio" value={form.domicilio} onChange={(v) => update("domicilio", v)} />

      <div className="grid gap-4 md:grid-cols-4">
        <LineInput label="Profesión / Actividad" value={form.profesion} onChange={(v) => update("profesion", v)} />
        <LineInput label="Titular" value={form.titular} onChange={(v) => update("titular", v)} />
        <LineInput label="Lugar de trabajo" value={form.lugarTrabajo} onChange={(v) => update("lugarTrabajo", v)} />
        <LineInput label="Jerarquía" value={form.jerarquia} onChange={(v) => update("jerarquia", v)} />
      </div>

      <p className="font-semibold">
        Este cuestionario tiene el tenor de una “Declaración Jurada”
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-2">
          <YesNo label="Padre con vida?" value={form.padreVida} onChange={(v) => update("padreVida", v)} />
          <LineInput label="Enfermedad que padece o padeció" value={form.padreEnfermedad} onChange={(v) => update("padreEnfermedad", v)} />

          <YesNo label="Madre con vida?" value={form.madreVida} onChange={(v) => update("madreVida", v)} />
          <LineInput label="Enfermedad que padece o padeció" value={form.madreEnfermedad} onChange={(v) => update("madreEnfermedad", v)} />

          <YesNo label="Hermanos?" value={form.hermanos} onChange={(v) => update("hermanos", v)} />
          <LineInput label="Sanos?" value={form.hermanosSanos} onChange={(v) => update("hermanosSanos", v)} />

          <YesNo label="Sufre de alguna enfermedad?" value={form.enfermedad} onChange={(v) => update("enfermedad", v)} />
          <LineInput label="¿De qué?" value={form.enfermedadDetalle} onChange={(v) => update("enfermedadDetalle", v)} />

          <YesNo label="Hace algún tratamiento médico?" value={form.tratamientoMedico} onChange={(v) => update("tratamientoMedico", v)} />
          <LineInput label="¿Cuál?" value={form.tratamientoMedicoDetalle} onChange={(v) => update("tratamientoMedicoDetalle", v)} />

          <LineTextarea label="Medicamentos que consume habitualmente" value={form.medicamentosHabituales} onChange={(v) => update("medicamentosHabituales", v)} />
          <LineTextarea label="Medicamentos consumidos en los últimos 5 años" value={form.medicamentosUltimos5} onChange={(v) => update("medicamentosUltimos5", v)} />

          <YesNo label="Realiza algún deporte?" value={form.deporte} onChange={(v) => update("deporte", v)} />
          <YesNo label="Nota algún malestar al realizarlo?" value={form.malestarDeporte} onChange={(v) => update("malestarDeporte", v)} />

          <YesNo label="Es alérgico a alguna droga?" value={form.alergia} onChange={(v) => update("alergia", v)} />
          <LineInput label="Anestesia / penicilina / otros" value={form.alergiaDetalle} onChange={(v) => update("alergiaDetalle", v)} />
        </div>

        <div className="space-y-2">
          <LineInput label="Cuando le sacan una muela o se lastima, ¿cicatriza bien?" value={form.cicatrizaBien} onChange={(v) => update("cicatrizaBien", v)} />
          <LineInput label="¿Sangra mucho?" value={form.sangraMucho} onChange={(v) => update("sangraMucho", v)} />

          <YesNo label="Tiene problema de colágeno?" value={form.colageno} onChange={(v) => update("colageno", v)} />
          <YesNo label="Antecedentes de fiebre reumática?" value={form.fiebreReumatica} onChange={(v) => update("fiebreReumatica", v)} />
          <LineInput label="¿Se protege con alguna medicación?" value={form.medicacionProteccion} onChange={(v) => update("medicacionProteccion", v)} />

          <YesNo label="Es diabético?" value={form.diabetico} onChange={(v) => update("diabetico", v)} />
          <LineInput label="¿Está controlado? ¿Con qué?" value={form.diabetesControl} onChange={(v) => update("diabetesControl", v)} />

          <YesNo label="Tiene algún problema cardíaco?" value={form.problemaCardiaco} onChange={(v) => update("problemaCardiaco", v)} />
          <LineInput label="¿Cuál?" value={form.problemaCardiacoDetalle} onChange={(v) => update("problemaCardiacoDetalle", v)} />

          <YesNo label="Toma aspirina y/o anticoagulante?" value={form.anticoagulante} onChange={(v) => update("anticoagulante", v)} />
          <LineInput label="¿Con qué frecuencia?" value={form.anticoagulanteFrecuencia} onChange={(v) => update("anticoagulanteFrecuencia", v)} />

          <YesNo label="Tiene presión alta?" value={form.presionAlta} onChange={(v) => update("presionAlta", v)} />
          <YesNo label="Chagas?" value={form.chagas} onChange={(v) => update("chagas", v)} />
          <LineInput label="¿Está en tratamiento?" value={form.chagasTratamiento} onChange={(v) => update("chagasTratamiento", v)} />

          <YesNo label="Problemas renales?" value={form.renal} onChange={(v) => update("renal", v)} />
          <YesNo label="Úlcera gástrica?" value={form.ulcera} onChange={(v) => update("ulcera", v)} />
          <YesNo label="Hepatitis?" value={form.hepatitis} onChange={(v) => update("hepatitis", v)} />
          <LineInput label="Tipo A / B / C" value={form.tipoHepatitis} onChange={(v) => update("tipoHepatitis", v)} />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-2">
          <YesNo label="Problema hepático?" value={form.hepatico} onChange={(v) => update("hepatico", v)} />
          <LineInput label="¿Cuál?" value={form.hepaticoDetalle} onChange={(v) => update("hepaticoDetalle", v)} />

          <YesNo label="Tuvo convulsiones?" value={form.convulsiones} onChange={(v) => update("convulsiones", v)} />
          <YesNo label="Es epiléptico?" value={form.epileptico} onChange={(v) => update("epileptico", v)} />
          <LineInput label="Medicación que toma" value={form.medicacionEpilepsia} onChange={(v) => update("medicacionEpilepsia", v)} />

          <YesNo label="Ha tenido Sífilis o Gonorrea?" value={form.sifilisGonorrea} onChange={(v) => update("sifilisGonorrea", v)} />
          <YesNo label="Otra enfermedad infecto-contagiosa?" value={form.infectocontagiosa} onChange={(v) => update("infectocontagiosa", v)} />
          <YesNo label="Tuvo transfusiones?" value={form.transfusiones} onChange={(v) => update("transfusiones", v)} />

          <YesNo label="Fue operado alguna vez?" value={form.operado} onChange={(v) => update("operado", v)} />
          <LineInput label="¿De qué?" value={form.operadoDetalle} onChange={(v) => update("operadoDetalle", v)} />
          <LineInput label="¿Cuándo?" value={form.operadoCuando} onChange={(v) => update("operadoCuando", v)} />
        </div>

        <div className="space-y-2">
          <YesNo label="Problema respiratorio?" value={form.respiratorio} onChange={(v) => update("respiratorio", v)} />
          <LineInput label="¿Cuál?" value={form.respiratorioDetalle} onChange={(v) => update("respiratorioDetalle", v)} />

          <YesNo label="Fuma?" value={form.fuma} onChange={(v) => update("fuma", v)} />
          <YesNo label="Está embarazada?" value={form.embarazada} onChange={(v) => update("embarazada", v)} />
          <LineInput label="¿De cuántos meses?" value={form.mesesEmbarazo} onChange={(v) => update("mesesEmbarazo", v)} />

          <YesNo label="Otra enfermedad o recomendación médica?" value={form.otraEnfermedad} onChange={(v) => update("otraEnfermedad", v)} />
          <LineTextarea label="¿Cuál?" value={form.otraEnfermedadDetalle} onChange={(v) => update("otraEnfermedadDetalle", v)} />

          <LineInput label="Tratamiento homeopático / acupuntura / otros" value={form.homeopatico} onChange={(v) => update("homeopatico", v)} />
          <LineInput label="Médico clínico" value={form.medicoClinico} onChange={(v) => update("medicoClinico", v)} />
          <LineInput label="Clínica/Hospital en caso de derivación" value={form.clinicaDerivacion} onChange={(v) => update("clinicaDerivacion", v)} />
        </div>
      </div>

      <h2 className="text-xl font-bold">Historia Clínica Odontológica</h2>

      <LineTextarea label="¿Por qué asistió a la consulta?" value={form.motivoConsulta} onChange={(v) => update("motivoConsulta", v)} />
      <YesNo label="¿Consultó antes con otro profesional?" value={form.otroProfesional} onChange={(v) => update("otroProfesional", v)} />
      <YesNo label="¿Tomó algún medicamento?" value={form.medicamentoConsulta} onChange={(v) => update("medicamentoConsulta", v)} />
      <LineInput label="Nombre de los medicamentos" value={form.medicamentoConsultaNombre} onChange={(v) => update("medicamentoConsultaNombre", v)} />
      <LineInput label="¿Desde cuándo?" value={form.desdeCuando} onChange={(v) => update("desdeCuando", v)} />
      <YesNo label="¿Obtuvo resultados?" value={form.obtuvoResultados} onChange={(v) => update("obtuvoResultados", v)} />

      <LineTextarea label="Dolor: tipo, intensidad, frío, calor, localizado, irradiado, cómo calma" value={form.dolor} onChange={(v) => update("dolor", v)} />

      <YesNo label="¿Sufrió algún golpe en los dientes?" value={form.golpeDientes} onChange={(v) => update("golpeDientes", v)} />
      <LineTextarea label="¿Cuándo y cómo se produjo?" value={form.golpeDetalle} onChange={(v) => update("golpeDetalle", v)} />

      <YesNo label="¿Se le fracturó algún diente?" value={form.fracturaDiente} onChange={(v) => update("fracturaDiente", v)} />
      <LineTextarea label="¿Cuál? ¿Recibió tratamiento?" value={form.fracturaDetalle} onChange={(v) => update("fracturaDetalle", v)} />

      <div className="grid gap-4 md:grid-cols-4">
        <LineInput label="Dificultad para hablar" value={form.dificultadHablar} onChange={(v) => update("dificultadHablar", v)} />
        <LineInput label="Para masticar" value={form.dificultadMasticar} onChange={(v) => update("dificultadMasticar", v)} />
        <LineInput label="Para abrir la boca" value={form.dificultadAbrir} onChange={(v) => update("dificultadAbrir", v)} />
        <LineInput label="Para tragar" value={form.dificultadTragar} onChange={(v) => update("dificultadTragar", v)} />
      </div>

      <h2 className="text-xl font-bold">Examen bucal</h2>

      <div className="grid gap-4 md:grid-cols-4">
        <LineInput label="Labios" value={form.labios} onChange={(v) => update("labios", v)} />
        <LineInput label="Lengua" value={form.lengua} onChange={(v) => update("lengua", v)} />
        <LineInput label="Paladar" value={form.paladar} onChange={(v) => update("paladar", v)} />
        <LineInput label="Piso de boca" value={form.pisoBoca} onChange={(v) => update("pisoBoca", v)} />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <YesNo label="Manchas" value={form.manchas} onChange={(v) => update("manchas", v)} />
          <YesNo label="Abultamiento de los tejidos" value={form.abultamiento} onChange={(v) => update("abultamiento", v)} />
          <YesNo label="Ulceraciones" value={form.ulceraciones} onChange={(v) => update("ulceraciones", v)} />
          <YesNo label="Ampollas" value={form.ampollas} onChange={(v) => update("ampollas", v)} />
          <LineInput label="Otros" value={form.lesionesOtros} onChange={(v) => update("lesionesOtros", v)} />
          <YesNo label="Le sangran las encías" value={form.sangranEncias} onChange={(v) => update("sangranEncias", v)} />
          <LineInput label="¿Cuándo?" value={form.sangranCuando} onChange={(v) => update("sangranCuando", v)} />
        </div>

        <div>
          <YesNo label="Sale pus de algún lugar de su boca" value={form.pus} onChange={(v) => update("pus", v)} />
          <LineInput label="¿De dónde?" value={form.pusDonde} onChange={(v) => update("pusDonde", v)} />
          <YesNo label="Tiene movilidad en sus dientes" value={form.movilidad} onChange={(v) => update("movilidad", v)} />
          <LineInput label="Al morder siente altos los dientes" value={form.dientesAltos} onChange={(v) => update("dientesAltos", v)} />
          <YesNo label="Ha tenido la cara hinchada" value={form.caraHinchada} onChange={(v) => update("caraHinchada", v)} />
          <LineInput label="Hielo / calor / otros" value={form.hieloCalorOtros} onChange={(v) => update("hieloCalorOtros", v)} />
          <LineInput label="Momentos de azúcar diario" value={form.momentosAzucar} onChange={(v) => update("momentosAzucar", v)} />
          <LineInput label="Índice de placa" value={form.indicePlaca} onChange={(v) => update("indicePlaca", v)} />
        </div>
      </div>

      <div>
        <span className="font-bold">Estado de la higiene bucal: </span>
        {["Muy bueno", "Bueno", "Deficiente", "Malo"].map((option) => (
          <label key={option} className="ml-4">
            <input
              type="radio"
              checked={form.higiene === option}
              onChange={() => update("higiene", option)}
            />{" "}
            {option}
          </label>
        ))}
      </div>

      <div className="rounded border p-4">
        <p className="mb-3 font-bold">
          Declaro que he contestado todas las preguntas con honestidad y según mi conocimiento.
        </p>
        <p>
          Asimismo, he sido informado que los datos suministrados quedan reservados
          en la presente Historia Clínica y amparados en secreto profesional.
        </p>
      </div>

      <PrintableOdontogram
        odontogramData={odontogramData}
        setOdontogramData={setOdontogramData}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <YesNo label="Presencia de sarro" value={form.sarro} onChange={(v) => update("sarro", v)} />
        <YesNo label="Enfermedad periodontal" value={form.enfermedadPeriodontal} onChange={(v) => update("enfermedadPeriodontal", v)} />
      </div>

      <LineTextarea label="Diagnóstico presuntivo" value={form.diagnostico} onChange={(v) => update("diagnostico", v)} rows={4} />
      <LineInput label="Continúa en Anexo Nº" value={form.anexoDiagnostico} onChange={(v) => update("anexoDiagnostico", v)} />

      <LineInput label="Plan de tratamiento - fecha" value={form.planFecha} onChange={(v) => update("planFecha", v)} />
      <LineTextarea label="Plan de tratamiento" value={form.planTratamiento} onChange={(v) => update("planTratamiento", v)} rows={4} />
      <LineInput label="Continúa en Anexo Nº" value={form.anexoPlan} onChange={(v) => update("anexoPlan", v)} />

      <LineTextarea label="Observaciones" value={form.observaciones} onChange={(v) => update("observaciones", v)} rows={4} />
      <LineInput label="Continúa en Anexo Nº" value={form.anexoObservaciones} onChange={(v) => update("anexoObservaciones", v)} />

      <div className="rounded border p-4 text-sm">
        <p>
          He comprendido todas las explicaciones que se me han facilitado en lenguaje claro y sencillo,
          he podido realizar todas las observaciones y se me han aclarado todas las dudas; por lo que estoy
          completamente de acuerdo con el tratamiento que se me va a realizar.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <LineInput label="El/la que suscribe" value={form.consentimientoNombre} onChange={(v) => update("consentimientoNombre", v)} />
          <LineInput label="DNI Nº" value={form.consentimientoDni} onChange={(v) => update("consentimientoDni", v)} />
          <LineInput label="Domicilio" value={form.consentimientoDomicilio} onChange={(v) => update("consentimientoDomicilio", v)} />
        </div>

        <LineInput label="Tratamiento propuesto por Dr/a MP" value={form.doctorMp} onChange={(v) => update("doctorMp", v)} />

        <div className="mt-10 grid gap-8 text-center md:grid-cols-3">
          <div className="border-t pt-2">Firma del paciente o tutor</div>
          <div className="border-t pt-2">Aclaración</div>
          <div className="border-t pt-2">DNI Nº</div>
        </div>
      </div>
    </section>
  );
}