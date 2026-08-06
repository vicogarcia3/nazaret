"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clipboard,
  Loader2,
  Share2,
  X,
} from "lucide-react";
import { toast } from "sonner";

type DoctorOption = {
  id: string;
  name: string;
  specialty: string | null;
  professionalLicense: string | null;
};

type Props = {
  clinicalHistoryId: string;
  doctors: DoctorOption[];
};

type FormState = {
  specialistId: string;
  reason: string;
  instructions: string;
  expiresInDays: number;
};

const INITIAL_FORM: FormState = {
  specialistId: "",
  reason: "",
  instructions: "",
  expiresInDays: 7,
};

export default function ClinicalReferralManager({
  clinicalHistoryId,
  doctors,
}: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [referralUrl, setReferralUrl] = useState("");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  function closeModal() {
    if (saving) return;

    setOpen(false);
    setError("");
    setCopied(false);
    setReferralUrl("");
    setForm(INITIAL_FORM);
  }

  async function createReferral() {
    setError("");

    if (!form.specialistId) {
      setError("Seleccioná un especialista.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/clinical-referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clinicalHistoryId,
          specialistId: form.specialistId,
          reason: form.reason.trim() || null,
          instructions: form.instructions.trim() || null,
          expiresInDays: form.expiresInDays,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudo crear la derivación."
        );
      }

      setReferralUrl(data.referralUrl);
      toast.success("Derivación creada correctamente.");
      router.refresh();
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "No se pudo crear la derivación.";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function copyReferralUrl() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success("Enlace copiado.");

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError(
        "No se pudo copiar el enlace. Seleccionalo y copialo manualmente."
      );
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 border border-[#263F3B] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] transition hover:bg-[#263F3B] hover:text-white"
      >
        <Share2 className="h-4 w-4" />
        Derivar a especialista
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto border border-[#DED9CD] bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-[#DED9CD] bg-white px-7 py-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#A2B38B]">
                  Historia clínica
                </p>

                <h2 className="mt-2 font-serif text-3xl text-[#12302A]">
                  Derivar a especialista
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#6B7774]">
                  Se generará un enlace privado para que el profesional complete
                  únicamente esta derivación.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Cerrar"
                className="text-[#6B7774] transition hover:text-[#263F3B] disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-6 p-7">
              {error && (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {referralUrl ? (
                <div>
                  <div className="border border-[#D7DFC9] bg-[#F0F4E9] p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#6F855F]">
                        <Check className="h-5 w-5" />
                      </span>

                      <div>
                        <h3 className="font-semibold text-[#263F3B]">
                          Derivación creada
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-[#6B7774]">
                          Copiá este enlace y envíaselo exclusivamente al
                          especialista seleccionado.
                        </p>
                      </div>
                    </div>
                  </div>

                  <label className="mt-6 block text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Enlace privado
                  </label>

                  <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={referralUrl}
                      readOnly
                      onFocus={(event) => event.currentTarget.select()}
                      className="min-w-0 flex-1 border border-[#DED9CD] bg-[#FAF9F5] p-3 text-sm outline-none"
                    />

                    <button
                      type="button"
                      onClick={copyReferralUrl}
                      className="inline-flex items-center justify-center gap-2 bg-[#263F3B] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1D302D]"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Clipboard className="h-4 w-4" />
                      )}
                      {copied ? "Copiado" : "Copiar enlace"}
                    </button>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-[#6B7774]">
                    Por seguridad, el sistema no puede reconstruir este enlace
                    más adelante: se guarda solamente su hash. Copialo antes de
                    cerrar esta ventana.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                      Especialista
                    </label>

                    <select
                      value={form.specialistId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          specialistId: event.target.value,
                        }))
                      }
                      className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none transition focus:border-[#263F3B]"
                    >
                      <option value="">Seleccionar especialista</option>

                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name}
                          {doctor.specialty ? ` — ${doctor.specialty}` : ""}
                          {doctor.professionalLicense
                            ? ` — MP ${doctor.professionalLicense}`
                            : ""}
                        </option>
                      ))}
                    </select>

                    {doctors.length === 0 && (
                      <p className="mt-2 text-sm text-[#6B7774]">
                        No hay especialistas activos disponibles.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                      Motivo de la derivación
                    </label>

                    <textarea
                      value={form.reason}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          reason: event.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Ejemplo: evaluación y tratamiento de implante."
                      className="mt-2 w-full resize-y border border-[#DED9CD] bg-white p-3 text-sm outline-none transition focus:border-[#263F3B]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                      Indicaciones para el especialista
                    </label>

                    <textarea
                      value={form.instructions}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          instructions: event.target.value,
                        }))
                      }
                      rows={4}
                      placeholder="Información o indicaciones relevantes para realizar el tratamiento."
                      className="mt-2 w-full resize-y border border-[#DED9CD] bg-white p-3 text-sm outline-none transition focus:border-[#263F3B]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                      Vigencia del enlace
                    </label>

                    <select
                      value={form.expiresInDays}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          expiresInDays: Number(event.target.value),
                        }))
                      }
                      className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none transition focus:border-[#263F3B]"
                    >
                      <option value={1}>1 día</option>
                      <option value={2}>2 días</option>
                      <option value={7}>7 días</option>
                      <option value={15}>15 días</option>
                      <option value={30}>30 días</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <footer className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-[#DED9CD] bg-white p-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="border border-[#DED9CD] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] transition hover:bg-[#F7F5EF] disabled:opacity-50"
              >
                {referralUrl ? "Cerrar" : "Cancelar"}
              </button>

              {!referralUrl && (
                <button
                  type="button"
                  onClick={createReferral}
                  disabled={
                    saving || !form.specialistId || doctors.length === 0
                  }
                  className="flex items-center justify-center gap-2 bg-[#263F3B] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1D302D] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Generando" : "Generar enlace"}
                </button>
              )}
            </footer>
          </div>
        </div>
      )}
    </>
  );
}