"use client";

import { useState } from "react";

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

type ClinicalHistoryAnnexProps = {
  patientName?: string;
  affiliationNumber?: string;
  folioNumber?: string;
  readOnly?: boolean;
};

const EMPTY_ROWS = 20;

function createInitialRows(): AnnexRow[] {
  return Array.from({ length: EMPTY_ROWS }, (_, index) => ({
    id: index + 1,
    dateTime: "",
    treatment: "",
    debit: "",
    credit: "",
    balance: "",
    professional: "",
    nextAppointment: "",
    patientSignature: "",
  }));
}

export default function ClinicalHistoryAnnex({
  patientName = "",
  affiliationNumber = "",
  folioNumber = "",
  readOnly = false,
}: ClinicalHistoryAnnexProps) {
  const [rows, setRows] = useState<AnnexRow[]>(createInitialRows());

  function updateRow(
    rowId: number,
    field: keyof Omit<AnnexRow, "id">,
    value: string
  ) {
    if (readOnly) {
      return;
    }
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  }

  return (
    <section
      id="clinical-history-annex"
      className="clinical-history-annex"
    >
      <div className="annex-scroll overflow-x-auto">
        <article className="annex-page relative mx-auto rounded-xl border border-[#263F3B] bg-white text-[#263F3B] shadow-sm">
          <header className="annex-header">
            <div className="annex-header-top">
                <div className="annex-title">
                Anexo a Historia Clínica
                </div>

                <div className="annex-folio-boxes" aria-hidden="true">
                {Array.from({ length: 20 }, (_, index) => (
                    <span key={index} />
                ))}
                </div>
            </div>

            <div className="annex-header-fields">
                <label className="annex-patient">
                <span>PACIENTE</span>

                <input
                    type="text"
                    defaultValue={patientName}
                    aria-label="Nombre del paciente"
                    readOnly={readOnly}
                />
                </label>

                <label className="annex-affiliation">
                <span>Nº AFIL.</span>

                <input
                    type="text"
                    defaultValue={affiliationNumber}
                    aria-label="Número de afiliación"
                    readOnly={readOnly}
                />
                </label>

                <label className="annex-folio">
                <span>FOLIO Nº</span>

                <input
                    type="text"
                    defaultValue={folioNumber}
                    aria-label="Número de folio"
                    readOnly={readOnly}
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
                  <th>Fecha y hora</th>
                  <th>Tratamiento realizado e indicaciones</th>
                  <th>Debe</th>
                  <th>Haber</th>
                  <th>Saldo</th>
                  <th>Prof. actuante</th>
                  <th>Próximo turno</th>
                  <th>Firma del paciente</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="text"
                        value={row.dateTime}
                        readOnly={readOnly}
                        onChange={(event) =>
                          updateRow(
                            row.id,
                            "dateTime",
                            event.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        value={row.treatment}
                        readOnly={readOnly}
                        onChange={(e) =>
                            updateRow(row.id, "treatment", e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        value={row.debit}
                        readOnly={readOnly}
                        onChange={(event) =>
                          updateRow(
                            row.id,
                            "debit",
                            event.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        value={row.credit}
                        readOnly={readOnly}
                        onChange={(event) =>
                          updateRow(
                            row.id,
                            "credit",
                            event.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        value={row.balance}
                        readOnly={readOnly}
                        onChange={(event) =>
                          updateRow(
                            row.id,
                            "balance",
                            event.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        value={row.professional}
                        readOnly={readOnly}
                        onChange={(event) =>
                          updateRow(
                            row.id,
                            "professional",
                            event.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        value={row.nextAppointment}
                        readOnly={readOnly}
                        onChange={(event) =>
                          updateRow(
                            row.id,
                            "nextAppointment",
                            event.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        value={row.patientSignature}
                        readOnly={readOnly}
                        onChange={(event) =>
                          updateRow(
                            row.id,
                            "patientSignature",
                            event.target.value
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="annex-print-page-number">2-2</div>
        </article>
      </div>

      <style jsx>{`
        .clinical-history-annex {
          color: #263f3b;
        }

        .annex-page {
          box-sizing: border-box;
          position: relative;
          width: 1180px;
          height: 794px;
          padding: 34px 42px;
          font-family: Arial, Helvetica, sans-serif;
        }

        .annex-header {
          display: flex;
          min-height: 86px;
          flex-direction: column;
          gap: 18px;
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
          font-size: 28px;
          font-weight: 700;
          line-height: 1;
        }

        .annex-header-fields {
          display: grid;
          grid-template-columns: minmax(420px, 1fr) 220px 190px;
          align-items: end;
          gap: 20px;
        }

        .annex-patient,
        .annex-affiliation,
        .annex-folio {
          display: grid;
          min-width: 0;
          grid-template-columns: max-content minmax(0, 1fr);
          align-items: end;
          gap: 10px;
          white-space: nowrap;
          color: #263f3b;
          font-size: 12px;
          font-weight: 600;
        }

        .annex-patient input,
        .annex-affiliation input,
        .annex-folio input {
          width: 100%;
          min-width: 0;
          height: 30px;
          border: 0;
          border-bottom: 1px dotted #6b7774;
          border-radius: 0;
          background: transparent;
          padding: 3px 6px;
          color: #263f3b;
          font-size: 13px;
          outline: none;
        }

        .annex-folio {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .annex-folio-boxes {
          display: grid;
          width: 190px;
          height: 20px;
          flex-shrink: 0;
          grid-template-columns: repeat(20, 1fr);
          overflow: hidden;
          border: 1px solid #a2b38b;
          border-radius: 6px;
        }

        .annex-folio-boxes span {
          border-right: 1px solid #d7ddd2;
        }

        .annex-folio-boxes span:last-child {
          border-right: 0;
        }

        .annex-table-title {
          margin: 18px 0 12px;
          color: #263f3b;
          font-size: 24px;
          font-weight: 700;
          line-height: 1;
        }

        .annex-table-wrapper {
          height: 610px;
          overflow: hidden;
          border: 1px solid #6f7b78;
          border-radius: 10px;
        }

        .annex-table {
          width: 100%;
          height: 100%;
          table-layout: fixed;
          border-collapse: collapse;
        }

        .annex-table thead {
          height: 52px;
          background: #f1f3ed;
        }

        .annex-table th,
        .annex-table td {
          border-right: 1px solid #aab2af;
          border-bottom: 1px solid #aab2af;
        }

        .annex-table th:last-child,
        .annex-table td:last-child {
          border-right: 0;
        }

        .annex-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .annex-table th {
          padding: 7px 5px;
          overflow-wrap: anywhere;
          white-space: normal;
          text-align: center;
          vertical-align: middle;
          color: #263f3b;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.2;
        }

        .annex-table tbody tr {
          height: 30px;
        }

        .annex-table tbody tr:nth-child(even) {
          background: #fcfcfa;
        }

        .annex-table td {
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
          padding: 0 5px;
          color: #263f3b;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          font-weight: 500;
          text-align: center;
          outline: none;
        }

        .annex-table input:focus,
        .annex-header input:focus {
          background: #f6f8f2;
        }

        .col-date {
          width: 7%;
        }

        .col-treatment {
          width: 39%;
        }

        .col-money {
          width: 7%;
        }

        .col-professional {
          width: 14%;
        }

        .col-next {
          width: 12%;
        }

        .col-signature {
          width: 14%;
        }

        .annex-print-page-number {
          display: none;
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
            height: 210mm;
            margin: 0;
            padding: 8mm 10mm 10mm;
            border-radius: 0;
            box-shadow: none;
          }

          .annex-table-wrapper {
            height: 166mm;
            border-radius: 0;
          }

          .annex-print-page-number {
            position: absolute;
            right: 10mm;
            bottom: 4mm;
            display: block;
            font-size: 10px;
          }

          .annex-table input,
          .annex-header input {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </section>
  );
}