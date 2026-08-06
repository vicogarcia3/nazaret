"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Save,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

type HistoryEntry = {
  id: string;
  professionalName: string;
  professionalLicense: string | null;
  diagnosis: string | null;
  treatment: string | null;
  evolution: string | null;
  indications: string | null;
  notes: string | null;
  createdAt: string;
};

type ReferralData = {
  id: string;
  status: string;
  reason: string | null;
  instructions: string | null;
  expiresAt: string;
  createdAt: string;

  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dni: string | null;
    birthDate: string | null;
  };

  referredBy: {
    id: string;
    name: string | null;
    specialty: string | null;
    professionalLicense: string | null;
  };

  specialist: {
    id: string;
    name: string | null;
    specialty: string | null;
    professionalLicense: string | null;
  };

  clinicalHistory: {
    id: string;
    diagnosis: string | null;
    treatment: string | null;
    data: unknown;
    entries: HistoryEntry[];
  };

  draft: {
    diagnosis: string | null;
    treatment: string | null;
    evolution: string | null;
    indications: string | null;
    notes: string | null;
  } | null;
};

type FormState = {
  diagnosis: string;
  treatment: string;
  evolution: string;
  indications: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  diagnosis: "",
  treatment: "",
  evolution: "",
  indications: "",
  notes: "",
};

type Props = {
  token: string;
};

export default function ReferralClient({
  token,
}: Props) {
  const [referral, setReferral] =
    useState<ReferralData | null>(null);

  const [form, setForm] =
    useState<FormState>(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] =
    useState(false);
  const [completing, setCompleting] =
    useState(false);

  const [error, setError] = useState("");
  const [completed, setCompleted] =
    useState(false);

  useEffect(() => {
    async function loadReferral() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/public/clinical-referrals/${token}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          if (data.completed) {
            setCompleted(true);
          }

          throw new Error(
            data.error ||
              "No se pudo cargar la derivación."
          );
        }

        const referralData =
          data as ReferralData;

        setReferral(referralData);

        setForm({
          diagnosis:
            referralData.draft?.diagnosis || "",
          treatment:
            referralData.draft?.treatment || "",
          evolution:
            referralData.draft?.evolution || "",
          indications:
            referralData.draft?.indications || "",
          notes:
            referralData.draft?.notes || "",
        });
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar la derivación."
        );
      } finally {
        setLoading(false);
      }
    }

    loadReferral();
  }, [token]);

  function updateField(
    field: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveDraft() {
    try {
      setSavingDraft(true);
      setError("");

      const response = await fetch(
        `/api/public/clinical-referrals/${token}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo guardar el borrador."
        );
      }

      toast.success(
        "Borrador guardado correctamente."
      );
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar el borrador.";

      setError(message);
      toast.error(message);
    } finally {
      setSavingDraft(false);
    }
  }

  async function completeReferral() {
    const hasContent = Object.values(form).some(
      (value) => value.trim().length > 0
    );

    if (!hasContent) {
      setError(
        "Completá al menos un campo antes de finalizar."
      );

      return;
    }

    const confirmed = window.confirm(
      "¿Querés guardar y finalizar la derivación? Después de finalizar, el enlace dejará de estar disponible."
    );

    if (!confirmed) {
      return;
    }

    try {
      setCompleting(true);
      setError("");

      const response = await fetch(
        `/api/public/clinical-referrals/${token}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo finalizar la derivación."
        );
      }

      setCompleted(true);

      toast.success(
        "Derivación finalizada correctamente."
      );
    } catch (completeError) {
      const message =
        completeError instanceof Error
          ? completeError.message
          : "No se pudo finalizar la derivación.";

      setError(message);
      toast.error(message);
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F5EF] px-4 py-10">
        <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center border border-[#DED9CD] bg-white">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#6F855F]" />

            <p className="mt-4 text-sm text-[#6B7774]">
              Cargando derivación clínica...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (completed) {
    return (
      <main className="min-h-screen bg-[#F7F5EF] px-4 py-10">
        <div className="mx-auto max-w-2xl border border-[#D7DFC9] bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF0E4] text-[#6F855F]">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <h1 className="mt-6 font-serif text-3xl text-[#263F3B]">
            Derivación finalizada
          </h1>

          <p className="mt-4 leading-7 text-[#6B7774]">
            La intervención fue guardada correctamente
            dentro de la historia clínica original. El
            profesional que realizó la derivación ya
            puede consultar la actualización.
          </p>

          <div className="mt-8 border border-[#D7DFC9] bg-[#F0F4E9] p-4 text-sm text-[#536847]">
            Este enlace ya no permite realizar nuevas
            modificaciones.
          </div>
        </div>
      </main>
    );
  }

  if (error && !referral) {
    return (
      <main className="min-h-screen bg-[#F7F5EF] px-4 py-10">
        <div className="mx-auto max-w-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle className="h-8 w-8" />
          </div>

          <h1 className="mt-6 font-serif text-3xl text-[#263F3B]">
            No se puede abrir la derivación
          </h1>

          <p className="mt-4 leading-7 text-[#6B7774]">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!referral) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#F7F5EF] px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="border border-[#DED9CD] bg-white p-6 md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7B916A]">
                Consultorios Nazaret
              </p>

              <h1 className="mt-3 font-serif text-4xl text-[#263F3B]">
                Derivación clínica
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B7774]">
                Acceso privado para registrar una
                intervención profesional sobre la
                historia clínica del paciente derivado.
              </p>
            </div>

            <div className="border border-[#D7DFC9] bg-[#F0F4E9] px-5 py-4 text-sm text-[#536847]">
              <p className="font-semibold">
                Acceso limitado
              </p>

              <p className="mt-1">
                Vence el{" "}
                {new Date(
                  referral.expiresAt
                ).toLocaleDateString("es-AR")}
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div className="flex items-start gap-3 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <article className="border border-[#DED9CD] bg-white p-6 md:p-8">
              <SectionTitle
                icon={<UserRound />}
                eyebrow="Paciente"
                title={`${referral.patient.firstName} ${referral.patient.lastName}`}
              />

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoBox
                  label="DNI"
                  value={
                    referral.patient.dni ||
                    "No informado"
                  }
                />

                <InfoBox
                  label="Fecha de nacimiento"
                  value={
                    referral.patient.birthDate
                      ? new Date(
                          referral.patient.birthDate
                        ).toLocaleDateString("es-AR")
                      : "No informada"
                  }
                />
              </div>
            </article>

            <article className="border border-[#DED9CD] bg-white p-6 md:p-8">
              <SectionTitle
                icon={<Stethoscope />}
                eyebrow="Derivación"
                title="Información enviada por el profesional"
              />

              <div className="mt-6 space-y-4">
                <InfoBox
                  label="Profesional que deriva"
                  value={
                    referral.referredBy.name ||
                    "Profesional"
                  }
                />

                <InfoBox
                  label="Motivo"
                  value={
                    referral.reason ||
                    "Sin motivo especificado"
                  }
                />

                <InfoBox
                  label="Indicaciones"
                  value={
                    referral.instructions ||
                    "Sin indicaciones adicionales"
                  }
                />
              </div>
            </article>

            <article className="border border-[#DED9CD] bg-white p-6 md:p-8">
              <SectionTitle
                icon={<FileText />}
                eyebrow="Antecedentes"
                title="Historia clínica compartida"
              />

              <div className="mt-6 grid gap-4">
                <InfoBox
                  label="Diagnóstico general"
                  value={
                    referral.clinicalHistory
                      .diagnosis ||
                    "Sin diagnóstico general cargado"
                  }
                />

                <InfoBox
                  label="Tratamiento general"
                  value={
                    referral.clinicalHistory
                      .treatment ||
                    "Sin tratamiento general cargado"
                  }
                />
              </div>

              {referral.clinicalHistory.entries
                .length > 0 && (
                <div className="mt-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7B916A]">
                    Evoluciones anteriores
                  </p>

                  <div className="mt-4 space-y-4">
                    {referral.clinicalHistory.entries.map(
                      (entry) => (
                        <HistoryEntryCard
                          key={entry.id}
                          entry={entry}
                        />
                      )
                    )}
                  </div>
                </div>
              )}
            </article>

            <article className="border border-[#DED9CD] bg-white p-6 md:p-8">
              <SectionTitle
                icon={<FileText />}
                eyebrow="Intervención"
                title="Registro del especialista"
              />

              <p className="mt-3 text-sm leading-6 text-[#6B7774]">
                Esta información se incorporará como
                una nueva evolución dentro de la
                historia clínica original.
              </p>

              <div className="mt-7 space-y-5">
                <TextAreaField
                  label="Diagnóstico"
                  value={form.diagnosis}
                  placeholder="Diagnóstico o evaluación realizada..."
                  onChange={(value) =>
                    updateField(
                      "diagnosis",
                      value
                    )
                  }
                />

                <TextAreaField
                  label="Tratamiento realizado"
                  value={form.treatment}
                  placeholder="Procedimiento, práctica o tratamiento efectuado..."
                  onChange={(value) =>
                    updateField(
                      "treatment",
                      value
                    )
                  }
                />

                <TextAreaField
                  label="Evolución"
                  value={form.evolution}
                  placeholder="Evolución clínica, respuesta al tratamiento o estado actual..."
                  onChange={(value) =>
                    updateField(
                      "evolution",
                      value
                    )
                  }
                />

                <TextAreaField
                  label="Indicaciones"
                  value={form.indications}
                  placeholder="Medicaciones, cuidados o pasos siguientes..."
                  onChange={(value) =>
                    updateField(
                      "indications",
                      value
                    )
                  }
                />

                <TextAreaField
                  label="Observaciones"
                  value={form.notes}
                  placeholder="Información adicional relevante..."
                  onChange={(value) =>
                    updateField("notes", value)
                  }
                />
              </div>

              <div className="mt-8 flex flex-col gap-3 border-t border-[#DED9CD] pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={
                    savingDraft || completing
                  }
                  className="flex items-center justify-center gap-2 border border-[#A2B38B] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#263F3B] transition hover:bg-[#F0F4E9] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingDraft ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}

                  Guardar borrador
                </button>

                <button
                  type="button"
                  onClick={completeReferral}
                  disabled={
                    savingDraft || completing
                  }
                  className="flex items-center justify-center gap-2 bg-[#263F3B] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1D302D] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {completing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}

                  Guardar y finalizar
                </button>
              </div>
            </article>
          </div>

          <aside className="space-y-6">
            <article className="border border-[#DED9CD] bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7B916A]">
                Especialista asignado
              </p>

              <h2 className="mt-3 text-xl font-semibold text-[#263F3B]">
                {referral.specialist.name ||
                  "Especialista"}
              </h2>

              <p className="mt-2 text-sm text-[#6B7774]">
                {referral.specialist.specialty ||
                  "Especialidad no informada"}
              </p>

              {referral.specialist
                .professionalLicense && (
                <p className="mt-1 text-sm text-[#6B7774]">
                  MP{" "}
                  {
                    referral.specialist
                      .professionalLicense
                  }
                </p>
              )}
            </article>

            <article className="border border-[#D7DFC9] bg-[#F0F4E9] p-6">
              <ShieldCheck className="h-7 w-7 text-[#6F855F]" />

              <h2 className="mt-4 font-semibold text-[#263F3B]">
                Acceso protegido
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6B7774]">
                Este enlace permite acceder solamente a
                esta derivación. No brinda acceso a otros
                pacientes ni a información administrativa.
              </p>
            </article>

            <article className="border border-[#DED9CD] bg-white p-6">
              <Clock3 className="h-6 w-6 text-[#6F855F]" />

              <h2 className="mt-4 font-semibold text-[#263F3B]">
                Guardado
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6B7774]">
                Podés guardar un borrador y continuar
                más tarde mientras el enlace siga
                vigente.
              </p>

              <p className="mt-3 text-sm leading-6 text-[#6B7774]">
                Al seleccionar “Guardar y finalizar”,
                la evolución se incorporará a la historia
                clínica y el enlace quedará bloqueado.
              </p>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({
  icon,
  eyebrow,
  title,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F0F2EA] text-[#6F855F] [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7B916A]">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-xl font-semibold text-[#263F3B]">
          {title}
        </h2>
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-[#E1DED5] bg-[#FAF9F5] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7B916A]">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#263F3B]">
        {value}
      </p>
    </div>
  );
}

function TextAreaField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7B916A]">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={4}
        className="mt-2 w-full resize-y border border-[#DED9CD] bg-white p-4 text-sm leading-6 text-[#263F3B] outline-none transition focus:border-[#6F855F]"
      />
    </div>
  );
}

function HistoryEntryCard({
  entry,
}: {
  entry: HistoryEntry;
}) {
  return (
    <div className="border border-[#E1DED5] bg-[#FAF9F5] p-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div>
          <p className="font-semibold text-[#263F3B]">
            {entry.professionalName}
          </p>

          {entry.professionalLicense && (
            <p className="mt-1 text-xs text-[#6B7774]">
              MP {entry.professionalLicense}
            </p>
          )}
        </div>

        <p className="text-xs text-[#6B7774]">
          {new Date(
            entry.createdAt
          ).toLocaleDateString("es-AR")}
        </p>
      </div>

      <div className="mt-4 space-y-3 text-sm leading-6 text-[#6B7774]">
        {entry.diagnosis && (
          <p>
            <strong className="text-[#263F3B]">
              Diagnóstico:
            </strong>{" "}
            {entry.diagnosis}
          </p>
        )}

        {entry.treatment && (
          <p>
            <strong className="text-[#263F3B]">
              Tratamiento:
            </strong>{" "}
            {entry.treatment}
          </p>
        )}

        {entry.evolution && (
          <p>
            <strong className="text-[#263F3B]">
              Evolución:
            </strong>{" "}
            {entry.evolution}
          </p>
        )}

        {entry.indications && (
          <p>
            <strong className="text-[#263F3B]">
              Indicaciones:
            </strong>{" "}
            {entry.indications}
          </p>
        )}

        {entry.notes && (
          <p>
            <strong className="text-[#263F3B]">
              Observaciones:
            </strong>{" "}
            {entry.notes}
          </p>
        )}
      </div>
    </div>
  );
}