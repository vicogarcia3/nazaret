"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import SignaturePad from "./SignaturePad";
import { toast } from "sonner";

type AnnexRow = {
  id: number;
  dateTime: string;
  treatment: string;
  debit: string;
  credit: string;
  balance: string;
  professional: string;
  nextAppointment: string;
  patientSignature: string;
};

export type PersistedAnnexEntry = {
  id: string;
  professionalName: string;
  treatment: string;
  indications: string | null;

  debit: number | null;
  credit: number | null;
  balance: number | null;

  performedAt: string;

  nextAppointment: string | null;
  patientSignature: string | null;

  createdAt: string;
  updatedAt: string;

  isOwn: boolean;
};

type ClinicalHistoryAnnexProps = {
  patientName?: string;
  affiliationNumber?: string;
  folioNumber?: string;
  readOnly?: boolean;

  clinicalHistoryId?: string;
  entries?: PersistedAnnexEntry[];
  allowCreate?: boolean;
};

type EntryForm = {
  professionalName: string;
  treatment: string;
  indications: string;

  debit: string;
  credit: string;
  balance: string;

  performedDateTime: string;

  nextAppointment: string;
  patientSignature: string;
};

const EMPTY_ROWS = 20;

function createEmptyEntryForm(): EntryForm {
  return {
    professionalName: "",
    treatment: "",
    indications: "",

    debit: "",
    credit: "",
    balance: "",

    performedDateTime: "",

    nextAppointment: "",
    patientSignature: "",
  };
}

function createInitialRows(): AnnexRow[] {
  return Array.from(
    {
      length: EMPTY_ROWS,
    },
    (_, index) => ({
      id: index + 1,
      dateTime: "",
      treatment: "",
      debit: "",
      credit: "",
      balance: "",
      professional: "",
      nextAppointment: "",
      patientSignature: "",
    })
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleString(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatDateOnly(value: string) {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const year =
    date.getFullYear();

  return `${day}/${month}/${year}`;
}

function formatTimeOnly(value: string) {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const hours = String(
    date.getHours()
  ).padStart(2, "0");

  const minutes = String(
    date.getMinutes()
  ).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function formatNextAppointment(
  value: string | null
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "es-AR"
  );
}

function toManualDateTimeValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function parseManualDateTime(value: string) {
  const match = value
    .trim()
    .match(
      /^(\\d{2})\/(\\d{2})\/(\\d{4})\\s+(\\d{2}):(\\d{2})$/
    );

  if (!match) {
    return "";
  }

  const [, day, month, year, hours, minutes] = match;

  const dayNumber = Number(day);
  const monthNumber = Number(month);
  const yearNumber = Number(year);
  const hoursNumber = Number(hours);
  const minutesNumber = Number(minutes);

  if (
    dayNumber < 1 ||
    dayNumber > 31 ||
    monthNumber < 1 ||
    monthNumber > 12 ||
    hoursNumber < 0 ||
    hoursNumber > 23 ||
    minutesNumber < 0 ||
    minutesNumber > 59
  ) {
    return "";
  }

  const date = new Date(
    yearNumber,
    monthNumber - 1,
    dayNumber,
    hoursNumber,
    minutesNumber
  );

  if (
    date.getFullYear() !== yearNumber ||
    date.getMonth() !== monthNumber - 1 ||
    date.getDate() !== dayNumber ||
    date.getHours() !== hoursNumber ||
    date.getMinutes() !== minutesNumber
  ) {
    return "";
  }

  return date.toISOString();
}

function toManualDateValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function parseManualDate(value: string) {
  const match = value
    .trim()
    .match(/^(\\d{2})\/(\\d{2})\/(\\d{4})$/);

  if (!match) {
    return "";
  }

  const [, day, month, year] = match;

  const dayNumber = Number(day);
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  const date = new Date(
    yearNumber,
    monthNumber - 1,
    dayNumber
  );

  if (
    date.getFullYear() !== yearNumber ||
    date.getMonth() !== monthNumber - 1 ||
    date.getDate() !== dayNumber
  ) {
    return "";
  }

  return `${year}-${month}-${day}`;
}


export default function ClinicalHistoryAnnex({
  patientName = "",
  affiliationNumber = "",
  folioNumber = "",
  readOnly = false,

  clinicalHistoryId,
  entries = [],
  allowCreate = false,
}: ClinicalHistoryAnnexProps) {
  const router = useRouter();

  const persistentMode =
    Boolean(
      clinicalHistoryId
    );

  const [
    localRows,
    setLocalRows,
  ] = useState<AnnexRow[]>(
    createInitialRows()
  );

  const [
    activeRowId,
    setActiveRowId,
  ] = useState<
    string | "new" | null
  >(null);

  const [
    editingEntryId,
    setEditingEntryId,
  ] = useState<
    string | null
  >(null);

  const [
    entryForm,
    setEntryForm,
  ] = useState<EntryForm>(
    createEmptyEntryForm()
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<
    string | null
  >(null);

  const [
    signatureOpen,
    setSignatureOpen,
  ] = useState(false);

  function updateLocalRow(
    rowId: number,
    field: keyof Omit<
      AnnexRow,
      "id"
    >,
    value: string
  ) {
    if (
      readOnly ||
      persistentMode
    ) {
      return;
    }

    setLocalRows(
      (currentRows) =>
        currentRows.map(
          (row) =>
            row.id === rowId
              ? {
                  ...row,
                  [field]:
                    value,
                }
              : row
        )
    );
  }

  function updateEntryForm(
    field: keyof EntryForm,
    value: string
  ) {
    setEntryForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function openNewEntry() {
    if (
      !allowCreate ||
      readOnly
    ) {
      return;
    }

    setEditingEntryId(
      null
    );

    setEntryForm(
      createEmptyEntryForm()
    );

    setActiveRowId(
      "new"
    );
  }

  function openEditEntry(
    entry: PersistedAnnexEntry
  ) {
    if (
      !entry.isOwn ||
      readOnly
    ) {
      return;
    }

    setEditingEntryId(
      entry.id
    );

    setActiveRowId(
      entry.id
    );

    setEntryForm({
      professionalName:
        entry.professionalName,

      treatment:
        entry.treatment,

      indications:
        entry.indications ||
        "",

      debit:
        entry.debit !== null
          ? String(
              entry.debit
            )
          : "",

      credit:
        entry.credit !== null
          ? String(
              entry.credit
            )
          : "",

      balance:
        entry.balance !== null
          ? String(
              entry.balance
            )
          : "",

      performedDateTime:
        toManualDateTimeValue(
          entry.performedAt
        ),

      nextAppointment:
        toManualDateValue(
          entry.nextAppointment
        ),

      patientSignature:
        entry.patientSignature ||
        "",
    });
  }

  function cancelActiveRow() {
    if (saving) {
      return;
    }

    setActiveRowId(
      null
    );

    setEditingEntryId(
      null
    );

    setEntryForm(
      createEmptyEntryForm()
    );
  }

  function focusNextField(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    const inputs = Array.from(
      document.querySelectorAll(
        ".annex-table input:not([readonly]), .annex-table textarea:not([readonly])"
      )
    ) as HTMLInputElement[];

    const current = event.currentTarget;
    const index = inputs.indexOf(current);

    if (index >= 0) {
      inputs[index + 1]?.focus();
    }
  }

  async function saveEntry() {
    if (!clinicalHistoryId) {
      return;
    }

    if (!entryForm.performedDateTime.trim()) {
      toast.error(
        "Ingresá la fecha y hora de la prestación. Ejemplo: 21/08/2026 13:00."
      );
      return;
    }

    const performedAt = parseManualDateTime(
      entryForm.performedDateTime
    );

    if (!performedAt) {
      toast.error(
        "La fecha y hora no son válidas. Usá DD/MM/AAAA HH:MM."
      );
      return;
    }

    if (!entryForm.professionalName.trim()) {
      toast.error(
        "Ingresá el profesional actuante."
      );
      return;
    }

    if (!entryForm.treatment.trim()) {
      toast.error(
        "Ingresá el tratamiento realizado."
      );
      return;
    }

    const normalizedNextAppointment =
      entryForm.nextAppointment.trim()
        ? parseManualDate(entryForm.nextAppointment)
        : "";

    if (
      entryForm.nextAppointment.trim() &&
      !normalizedNextAppointment
    ) {
      toast.error(
        "Ingresá el próximo turno con formato DD/MM/AAAA."
      );
      return;
    }

    try {
      setSaving(true);

      const url = editingEntryId
        ? `/api/clinical-history-annex/${editingEntryId}`
        : "/api/clinical-history-annex";

      const method = editingEntryId
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clinicalHistoryId,
          professionalName:
            entryForm.professionalName,
          treatment: entryForm.treatment,
          indications: entryForm.indications,
          debit: entryForm.debit,
          credit: entryForm.credit,
          balance: entryForm.balance,
          performedAt,
          nextAppointment:
            normalizedNextAppointment,
          patientSignature:
            entryForm.patientSignature,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.error ||
            "No se pudo guardar el registro."
        );
        return;
      }

      toast.success(
        editingEntryId
          ? "Registro actualizado."
          : "Prestación agregada al anexo."
      );

      setActiveRowId(null);
      setEditingEntryId(null);
      setEntryForm(createEmptyEntryForm());

      router.refresh();
    } catch (error) {
      console.error(
        "Error guardando anexo:",
        error
      );

      toast.error(
        "No se pudo guardar el registro."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(
    entry: PersistedAnnexEntry
  ) {
    if (
      !entry.isOwn ||
      readOnly
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "¿Querés eliminar este registro del anexo?"
      );

    if (
      !confirmed
    ) {
      return;
    }

    try {
      setDeletingId(
        entry.id
      );

      const response =
        await fetch(
          `/api/clinical-history-annex/${entry.id}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        toast.error(
          data.error ||
            "No se pudo eliminar el registro."
        );

        return;
      }

      if (
        activeRowId ===
        entry.id
      ) {
        cancelActiveRow();
      }

      toast.success(
        "Registro eliminado correctamente."
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Error eliminando registro:",
        error
      );

      toast.error(
        "No se pudo eliminar el registro."
      );
    } finally {
      setDeletingId(
        null
      );
    }
  }

  const newRowVisible =
    persistentMode &&
    activeRowId ===
      "new";

  const usedRows =
    entries.length +
    (newRowVisible
      ? 1
      : 0);

  const emptyRowsCount =
    Math.max(
      EMPTY_ROWS -
        usedRows,
      0
    );

  return (
    <section
      id="clinical-history-annex"
      className="clinical-history-annex"
    >
      {/* AGREGAR PRESTACIÓN */}

      {persistentMode &&
        allowCreate &&
        !readOnly &&
        activeRowId ===
          null && (
          <div className="mx-auto -mt-11 mb-2 flex w-full max-w-[1180px] justify-end print:hidden">
            <button
              type="button"
              onClick={
                openNewEntry
              }
              className="inline-flex items-center gap-2 bg-[#263F3B] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1D302D]"
            >
              <Plus className="h-4 w-4" />
              Agregar prestación
            </button>
          </div>
        )}

      {/* ANEXO */}

      <div className="annex-scroll w-full overflow-visible">
        <article className="annex-page relative mx-auto rounded-xl border border-[#263F3B] bg-white text-[#263F3B] shadow-sm">
          <header className="annex-header">
            <div className="annex-header-top">
              <div className="annex-title">
                Anexo a Historia
                Clínica
              </div>

              <div
                className="annex-folio-boxes"
                aria-hidden="true"
              >
                {Array.from(
                  {
                    length: 20,
                  },
                  (
                    _,
                    index
                  ) => (
                    <span
                      key={
                        index
                      }
                    />
                  )
                )}
              </div>
            </div>

            <div className="annex-header-fields">
              <label className="annex-patient">
                <span>
                  PACIENTE
                </span>

                <input
                  type="text"
                  value={
                    patientName
                  }
                  aria-label="Nombre del paciente"
                  readOnly
                />
              </label>

              <label className="annex-affiliation">
                <span>
                  Nº AFIL.
                </span>

                <input
                  type="text"
                  value={
                    affiliationNumber
                  }
                  aria-label="Número de afiliación"
                  readOnly
                />
              </label>

              <label className="annex-folio">
                <span>
                  FOLIO Nº
                </span>

                <input
                  type="text"
                  value={
                    folioNumber
                  }
                  aria-label="Número de folio"
                  readOnly
                />
              </label>
            </div>
          </header>

          <h3 className="annex-table-title">
            Registro de Prestaciones
          </h3>

          <div className="annex-table-wrapper">
            <table className="annex-table">
              <colgroup>
                <col className="col-date" />
                <col className="col-treatment" />
                <col className="col-money" />
                <col className="col-money" />
                <col className="col-money" />
                <col className="col-professional" />
                <col className="col-next" />
                <col className="col-signature" />
              </colgroup>

              <thead>
                <tr>
                  <th>
                    Fecha y hora
                  </th>

                  <th>
                    Tratamiento
                    realizado e
                    indicaciones
                  </th>

                  <th>
                    Debe
                  </th>

                  <th>
                    Haber
                  </th>

                  <th>
                    Saldo
                  </th>

                  <th>
                    Prof.
                    actuante
                  </th>

                  <th>
                    Próximo
                    turno
                  </th>

                  <th>
                    Firma del
                    paciente
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* REGISTROS GUARDADOS */}

                {persistentMode &&
                  entries.map(
                    (
                      entry
                    ) => {
                      const editing =
                        activeRowId ===
                        entry.id;

                      const combinedTreatment =
                        [
                          entry.treatment,
                          entry.indications,
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            " — "
                          );

                      return (
                        <tr
                          key={
                            entry.id
                          }
                          className={
                            editing
                              ? "editing-row"
                              : entry.isOwn
                              ? "own-row"
                              : ""
                          }
                        >
                          {/* FECHA Y HORA */}

                          <td className="p-0 text-center align-middle">
                            {editing ? (
                              <input
                                className="annex-datetime-input"
                                type="text"
                                inputMode="numeric"
                                value={
                                  entryForm.performedDateTime
                                }
                                onChange={(event) =>
                                  updateEntryForm(
                                    "performedDateTime",
                                    event.target.value
                                  )
                                }
                                onKeyDown={focusNextField}
                                spellCheck={false}
                                aria-label="Fecha y hora de la prestación"
                              />
                            ) : (
                              <div className="flex h-full min-h-[34px] w-full items-center justify-center px-1 text-center text-[8px] font-normal leading-none text-[#263F3B]">
                                {toManualDateTimeValue(
                                  entry.performedAt
                                )}
                              </div>
                            )}
                          </td>

                          <td>
                            <input
                              value={
                                editing
                                  ? entryForm.treatment
                                  : combinedTreatment
                              }
                              readOnly={
                                !editing
                              }
                              onChange={(
                                event
                              ) =>
                                updateEntryForm(
                                  "treatment",
                                  event
                                    .target
                                    .value
                                )
                              }
                              title={
                                combinedTreatment
                              }
                            />
                          </td>

                          <td>
                            <input
                              type={
                                editing
                                  ? "number"
                                  : "text"
                              }
                              step="0.01"
                              value={
                                editing
                                  ? entryForm.debit
                                  : entry.debit ??
                                    ""
                              }
                              readOnly={
                                !editing
                              }
                              onChange={(
                                event
                              ) =>
                                updateEntryForm(
                                  "debit",
                                  event
                                    .target
                                    .value
                                )
                              }
                            />
                          </td>

                          <td>
                            <input
                              type={
                                editing
                                  ? "number"
                                  : "text"
                              }
                              step="0.01"
                              value={
                                editing
                                  ? entryForm.credit
                                  : entry.credit ??
                                    ""
                              }
                              readOnly={
                                !editing
                              }
                              onChange={(
                                event
                              ) =>
                                updateEntryForm(
                                  "credit",
                                  event
                                    .target
                                    .value
                                )
                              }
                            />
                          </td>

                          <td>
                            <input
                              type={
                                editing
                                  ? "number"
                                  : "text"
                              }
                              step="0.01"
                              value={
                                editing
                                  ? entryForm.balance
                                  : entry.balance ??
                                    ""
                              }
                              readOnly={
                                !editing
                              }
                              onChange={(
                                event
                              ) =>
                                updateEntryForm(
                                  "balance",
                                  event
                                    .target
                                    .value
                                )
                              }
                            />
                          </td>

                          <td>
                            <input
                              value={
                                editing
                                  ? entryForm.professionalName
                                  : entry.professionalName
                              }
                              readOnly={
                                !editing
                              }
                              onChange={(
                                event
                              ) =>
                                updateEntryForm(
                                  "professionalName",
                                  event
                                    .target
                                    .value
                                )
                              }
                            />
                          </td>

                          <td>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={
                                editing
                                  ? entryForm.nextAppointment
                                  : formatNextAppointment(
                                      entry.nextAppointment
                                    )
                              }
                              readOnly={
                                !editing
                              }
                              onChange={(
                                event
                              ) =>
                                updateEntryForm(
                                  "nextAppointment",
                                  event
                                    .target
                                    .value
                                )
                              }
                              onKeyDown={focusNextField}
                            />
                          </td>

                          <td className="signature-cell">
                            {editing ? (
                              entryForm.patientSignature ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSignatureOpen(
                                      true
                                    )
                                  }
                                  className="signature-button"
                                >
                                  <img
                                    src={
                                      entryForm.patientSignature
                                    }
                                    alt="Firma del paciente"
                                    className="signature-image"
                                  />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSignatureOpen(true)
                                  }
                                  className="signature-add-button"
                                  aria-label="Firmar"
                                  title="Firmar"
                                />
                              )
                            ) : entry.patientSignature ? (
                              <img
                                src={
                                  entry.patientSignature
                                }
                                alt="Firma del paciente"
                                className="signature-image"
                              />
                            ) : null}
                          </td>
                        </tr>
                      );
                    }
                  )}

                {/* NUEVA PRESTACIÓN */}

                {newRowVisible && (
                  <tr className="editing-row">
                    {/* FECHA Y HORA EDITABLE */}

                    <td className="p-0 text-center align-middle">
                      <input
                        autoFocus
                        className="annex-datetime-input"
                        type="text"
                        inputMode="numeric"
                        value={
                          entryForm.performedDateTime
                        }
                        onChange={(event) =>
                          updateEntryForm(
                            "performedDateTime",
                            event.target.value
                          )
                        }
                        onKeyDown={focusNextField}
                        spellCheck={false}
                        aria-label="Fecha y hora de la prestación"
                      />
                    </td>

                    <td>
                      <input
                        value={
                          entryForm.treatment
                        }
                        onChange={(
                          event
                        ) =>
                          updateEntryForm(
                            "treatment",
                            event
                              .target
                              .value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={
                          entryForm.debit
                        }
                        onChange={(
                          event
                        ) =>
                          updateEntryForm(
                            "debit",
                            event
                              .target
                              .value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={
                          entryForm.credit
                        }
                        onChange={(
                          event
                        ) =>
                          updateEntryForm(
                            "credit",
                            event
                              .target
                              .value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={
                          entryForm.balance
                        }
                        onChange={(
                          event
                        ) =>
                          updateEntryForm(
                            "balance",
                            event
                              .target
                              .value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        value={
                          entryForm.professionalName
                        }
                        onChange={(
                          event
                        ) =>
                          updateEntryForm(
                            "professionalName",
                            event
                              .target
                              .value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={
                          entryForm.nextAppointment
                        }
                        onChange={(event) =>
                          updateEntryForm(
                            "nextAppointment",
                            event.target.value
                          )
                        }
                        onKeyDown={focusNextField}
                        aria-label="Próximo turno"
                      />
                    </td>

                    <td className="signature-cell">
                      {entryForm.patientSignature ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSignatureOpen(
                              true
                            )
                          }
                          className="signature-button"
                        >
                          <img
                            src={
                              entryForm.patientSignature
                            }
                            alt="Firma del paciente"
                            className="signature-image"
                          />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setSignatureOpen(true)
                          }
                          className="signature-add-button"
                          aria-label="Firmar"
                          title="Firmar"
                        />
                      )}
                    </td>
                  </tr>
                )}

                {/* FILAS VACÍAS */}

                {persistentMode &&
                  Array.from(
                    {
                      length:
                        emptyRowsCount,
                    },
                    (
                      _,
                      index
                    ) => (
                      <tr
                        key={`empty-${index}`}
                      >
                        <td>
                          <input
                            readOnly
                          />
                        </td>

                        <td>
                          <input
                            readOnly
                          />
                        </td>

                        <td>
                          <input
                            readOnly
                          />
                        </td>

                        <td>
                          <input
                            readOnly
                          />
                        </td>

                        <td>
                          <input
                            readOnly
                          />
                        </td>

                        <td>
                          <input
                            readOnly
                          />
                        </td>

                        <td>
                          <input
                            readOnly
                          />
                        </td>

                        <td />
                      </tr>
                    )
                  )}

                {/* MODO ORIGINAL ADMIN */}

                {!persistentMode &&
                  localRows.map(
                    (row) => (
                      <tr
                        key={
                          row.id
                        }
                      >
                        <td>
                          <input
                            value={
                              row.dateTime
                            }
                            readOnly={
                              readOnly
                            }
                            onChange={(
                              event
                            ) =>
                              updateLocalRow(
                                row.id,
                                "dateTime",
                                event
                                  .target
                                  .value
                              )
                            }
                          />
                        </td>

                        <td>
                          <input
                            value={
                              row.treatment
                            }
                            readOnly={
                              readOnly
                            }
                            onChange={(
                              event
                            ) =>
                              updateLocalRow(
                                row.id,
                                "treatment",
                                event
                                  .target
                                  .value
                              )
                            }
                          />
                        </td>

                        <td>
                          <input
                            value={
                              row.debit
                            }
                            readOnly={
                              readOnly
                            }
                            onChange={(
                              event
                            ) =>
                              updateLocalRow(
                                row.id,
                                "debit",
                                event
                                  .target
                                  .value
                              )
                            }
                          />
                        </td>

                        <td>
                          <input
                            value={
                              row.credit
                            }
                            readOnly={
                              readOnly
                            }
                            onChange={(
                              event
                            ) =>
                              updateLocalRow(
                                row.id,
                                "credit",
                                event
                                  .target
                                  .value
                              )
                            }
                          />
                        </td>

                        <td>
                          <input
                            value={
                              row.balance
                            }
                            readOnly={
                              readOnly
                            }
                            onChange={(
                              event
                            ) =>
                              updateLocalRow(
                                row.id,
                                "balance",
                                event
                                  .target
                                  .value
                              )
                            }
                          />
                        </td>

                        <td>
                          <input
                            value={
                              row.professional
                            }
                            readOnly={
                              readOnly
                            }
                            onChange={(
                              event
                            ) =>
                              updateLocalRow(
                                row.id,
                                "professional",
                                event
                                  .target
                                  .value
                              )
                            }
                          />
                        </td>

                        <td>
                          <input
                            value={
                              row.nextAppointment
                            }
                            readOnly={
                              readOnly
                            }
                            onChange={(
                              event
                            ) =>
                              updateLocalRow(
                                row.id,
                                "nextAppointment",
                                event
                                  .target
                                  .value
                              )
                            }
                          />
                        </td>

                        <td>
                          <input
                            value={
                              row.patientSignature
                            }
                            readOnly={
                              readOnly
                            }
                            onChange={(
                              event
                            ) =>
                              updateLocalRow(
                                row.id,
                                "patientSignature",
                                event
                                  .target
                                  .value
                              )
                            }
                          />
                        </td>
                      </tr>
                    )
                  )}
              </tbody>
            </table>
          </div>

          <div className="annex-print-page-number">
            2-2
          </div>
        </article>
      </div>

      {/* GUARDAR / CANCELAR */}

      {persistentMode &&
        activeRowId !==
          null && (
          <div className="mx-auto mt-4 flex w-full max-w-[1180px] justify-end gap-3 print:hidden">
            <button
              type="button"
              onClick={
                cancelActiveRow
              }
              disabled={
                saving
              }
              className="inline-flex items-center gap-2 border border-[#DED9CD] bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#263F3B] transition hover:bg-[#F7F5EF] disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>

            <button
              type="button"
              onClick={
                saveEntry
              }
              disabled={
                saving
              }
              className="inline-flex items-center gap-2 bg-[#263F3B] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-white transition hover:bg-[#1D302D] disabled:opacity-50"
            >
              <Check className="h-4 w-4" />

              {saving
                ? "Guardando..."
                : editingEntryId
                ? "Guardar cambios"
                : "Guardar prestación"}
            </button>
          </div>
        )}

      {/* MIS PRESTACIONES */}

      {persistentMode &&
        activeRowId ===
          null &&
        entries.some(
          (entry) =>
            entry.isOwn
        ) && (
          <div className="mx-auto mt-5 w-full max-w-[1180px] border border-[#DED9CD] bg-white p-5 print:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
              Mis prestaciones
            </p>

            <p className="mt-1 text-xs text-[#6B7774]">
              Podés editar o
              eliminar únicamente
              los registros creados
              por vos.
            </p>

            <div className="mt-4 space-y-2">
              {entries
                .filter(
                  (entry) =>
                    entry.isOwn
                )
                .map(
                  (
                    entry,
                    index
                  ) => (
                    <div
                      key={
                        entry.id
                      }
                      className="flex flex-col justify-between gap-3 border border-[#DED9CD] px-4 py-3 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          Prestación #
                          {index +
                            1}{" "}
                          —{" "}
                          {
                            entry.treatment
                          }
                        </p>

                        <p className="mt-1 text-xs text-[#6B7774]">
                          {formatDateTime(
                            entry.performedAt
                          )}{" "}
                          ·{" "}
                          {
                            entry.professionalName
                          }
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditEntry(
                              entry
                            )
                          }
                          className="inline-flex items-center gap-2 border border-[#DED9CD] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#263F3B] hover:bg-[#F7F5EF]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>

                        <button
                          type="button"
                          disabled={
                            deletingId ===
                            entry.id
                          }
                          onClick={() =>
                            deleteEntry(
                              entry
                            )
                          }
                          className="inline-flex items-center gap-2 border border-[#E1BABA] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#B45F5F] hover:bg-[#FFF7F7] disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />

                          {deletingId ===
                          entry.id
                            ? "Eliminando..."
                            : "Eliminar"}
                        </button>
                      </div>
                    </div>
                  )
                )}
            </div>
          </div>
        )}

      {/* MODAL FIRMA DIGITAL */}

      {signatureOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 print:hidden">
          <div className="w-full max-w-xl border border-[#DED9CD] bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                  Firma digital
                </p>

                <h3 className="mt-2 font-serif text-2xl text-[#263F3B]">
                  Firma del paciente
                </h3>

                <p className="mt-1 text-sm leading-6 text-[#6B7774]">
                  Firmá dentro del
                  recuadro usando el
                  mouse o una tableta
                  gráfica.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSignatureOpen(
                    false
                  )
                }
                className="text-[#6B7774] hover:text-[#263F3B]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <SignaturePad
              title=""
              value={
                entryForm.patientSignature
              }
              onChange={(
                value
              ) =>
                updateEntryForm(
                  "patientSignature",
                  value
                )
              }
            />

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setSignatureOpen(
                    false
                  )
                }
                className="bg-[#263F3B] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-[#1D302D]"
              >
                Guardar firma
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .clinical-history-annex {
          width: 100%;
          color: #263f3b;
        }

        .annex-page {
          box-sizing: border-box;
          position: relative;
          width: 100%;
          max-width: 1180px;
          min-height: 720px;
          padding: 30px 32px;
          font-family: Arial,
            Helvetica,
            sans-serif;
        }

        .annex-header {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .annex-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .annex-title {
          min-width: 0;
          flex: 1;
          white-space: nowrap;
          color: #263f3b;
          font-size: clamp(
            20px,
            2vw,
            28px
          );
          font-weight: 700;
          line-height: 1;
        }

        .annex-header-fields {
          display: grid;
          grid-template-columns:
            minmax(300px, 1fr)
            minmax(150px, 220px)
            minmax(130px, 190px);
          align-items: end;
          gap: 16px;
        }

        .annex-patient,
        .annex-affiliation,
        .annex-folio {
          display: grid;
          min-width: 0;
          grid-template-columns:
            max-content
            minmax(0, 1fr);
          align-items: end;
          gap: 8px;
          white-space: nowrap;
          color: #263f3b;
          font-size: 10px;
          font-weight: 600;
        }

        .annex-patient input,
        .annex-affiliation input,
        .annex-folio input {
          width: 100%;
          min-width: 0;
          height: 26px;
          border: 0;
          border-bottom: 1px dotted
            #6b7774;
          border-radius: 0;
          background: transparent;
          padding: 2px 4px;
          color: #263f3b;
          font-size: 11px;
          outline: none;
        }

        .annex-folio {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .annex-folio-boxes {
          display: grid;
          width: 150px;
          max-width: 100%;
          height: 18px;
          flex-shrink: 0;
          grid-template-columns:
            repeat(20, 1fr);
          overflow: hidden;
          border: 1px solid
            #a2b38b;
          border-radius: 5px;
        }

        .annex-folio-boxes span {
          border-right: 1px solid
            #d7ddd2;
        }

        .annex-folio-boxes
          span:last-child {
          border-right: 0;
        }

        .annex-table-title {
          margin: 15px 0 10px;
          color: #263f3b;
          font-size: clamp(
            18px,
            1.7vw,
            24px
          );
          font-weight: 700;
          line-height: 1;
        }

        .annex-table-wrapper {
          width: 100%;
          overflow: visible;
          border: 1px solid
            #6f7b78;
          border-radius: 8px;
        }

        .annex-table {
          width: 100%;
          min-width: 0;
          table-layout: fixed;
          border-collapse: collapse;
        }

        .annex-table thead {
          height: 45px;
          background: #f1f3ed;
        }

        .annex-table th,
        .annex-table td {
          border-right: 1px solid
            #aab2af;
          border-bottom: 1px solid
            #aab2af;
        }

        .annex-table th:last-child,
        .annex-table td:last-child {
          border-right: 0;
        }

        .annex-table
          tbody
          tr:last-child
          td {
          border-bottom: 0;
        }

        .annex-table th {
          padding: 5px 3px;
          overflow-wrap: anywhere;
          white-space: normal;
          text-align: center;
          vertical-align: middle;
          color: #263f3b;
          font-size: clamp(
            7px,
            0.8vw,
            10px
          );
          font-weight: 700;
          line-height: 1.15;
        }

        .annex-table tbody tr {
          height: 34px;
        }

        .annex-table
          tbody
          tr:nth-child(even) {
          background: #fcfcfa;
        }

        .annex-table td {
          height: 34px;
          padding: 0;
          vertical-align: middle;
        }

        .annex-table input {
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          border: 0;
          border-radius: 0;
          background: transparent;
          padding: 0 3px;
          color: #263f3b;
          font-family: Arial,
            Helvetica,
            sans-serif;
          font-size: clamp(
            8px,
            0.85vw,
            11px
          );
          font-weight: 500;
          text-align: center;
          outline: none;
        }

        .annex-table
          input:not([readonly]):focus {
          background: #f2f6ed;
          box-shadow: inset
            0 0 0 1px
            #a2b38b;
        }

        .annex-datetime-input {
          box-sizing: border-box;
          display: block;
          width: 100%;
          height: 100%;
          min-height: 34px;
          margin: 0;
          padding: 0 2px;
          border: 0;
          border-radius: 0;
          outline: none;
          background: transparent;
          color: #263f3b;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8px;
          font-weight: 500;
          line-height: 1;
          text-align: center;
        }

        .annex-datetime-input:focus {
          background: #f2f6ed;
          box-shadow: inset 0 0 0 1px #a2b38b;
        }

        .editing-row {
          background: #f6f8f2 !important;
        }

        .own-row {
          background: #fdfdf9;
        }

        .signature-cell {
          height: 27px;
          padding: 0;
          text-align: center;
        }

        .signature-button {
          display: flex;
          width: 100%;
          height: 100%;
          align-items: center;
          justify-content: center;
          border: 0;
          background: transparent;
          padding: 1px 3px;
          cursor: pointer;
        }

        .signature-image {
          display: block;
          width: auto;
          max-width: 100%;
          height: auto;
          max-height: 24px;
          margin: 0 auto;
          object-fit: contain;
        }

        .signature-add-button {
          width: 100%;
          height: 100%;
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .signature-add-button:hover {
          background: #f6f8f2;
        }

        .signature-add-button:hover {
          background: #f6f8f2;
        }

        .col-date {
          width: 9%;
        }

        .col-treatment {
          width: 34%;
        }

        .col-money {
          width: 6.5%;
        }

        .col-professional {
          width: 13%;
        }

        .col-next {
          width: 11%;
        }

        .col-signature {
          width: 13.5%;
        }

        .annex-print-page-number {
          display: none;
        }

        @media (max-width: 900px) {
          .annex-page {
            padding: 20px 16px;
          }

          .annex-header-fields {
            grid-template-columns:
              minmax(220px, 1fr)
              minmax(100px, 150px)
              minmax(90px, 130px);
            gap: 8px;
          }

          .annex-title {
            font-size: 18px;
          }

          .annex-table th {
            font-size: 7px;
          }

          .annex-table input {
            font-size: 8px;
          }

          .annex-date-edit input {
            font-size: 6px;
          }
        }

        @media print {
          .annex-scroll {
            overflow: visible;
          }

          .clinical-history-annex {
            margin: 0;
            break-before: page;
            page-break-before: always;
          }

          .annex-page {
            width: 297mm;
            max-width: none;
            min-height: 210mm;
            margin: 0;
            padding: 8mm 10mm 10mm;
            border-radius: 0;
            box-shadow: none;
          }

          .annex-table-wrapper {
            overflow: visible;
            border-radius: 0;
          }

          .annex-print-page-number {
            position: absolute;
            right: 10mm;
            bottom: 4mm;
            display: block;
            font-size: 10px;
          }
        }
      `}</style>
    </section>
  );
}