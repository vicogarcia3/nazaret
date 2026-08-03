"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarX,
  ChevronDown,
  ClipboardList,
  Clock3,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

type Doctor = {
  id: string;
  name: string | null;
  user: {
    name: string;
    email: string;
  } | null;
  specialty: string | null;
  active: boolean;
  branches: {
    branchId: string;
    branch: {
      id: string;
      name: string;
      city: string;
      address: string;
    };
  }[];
};

type Branch = {
  id: string;
  name: string;
  city: string;
  address: string;
};

type DoctorSchedule = {
  id: string;
  doctorId: string;
  branchId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  active: boolean;
  doctor: {
    name: string | null;
    user: {
      name: string | null;
    } | null;
  };
  branch: {
    id: string;
    name: string;
    city: string;
    address: string;
  };
};

type DoctorScheduleManagerProps = {
  branch: Branch;
  doctors: Doctor[];
};

type SpecificSchedule = {
  id: string;
  doctorId: string;
  branchId: string;
  date: string;
  startTime: string;
  endTime: string;
  doctor: {
    name: string | null;
    user: {
      name: string | null;
    } | null;
  };
  branch: {
    id: string;
    name: string;
    city: string;
  };
};

type ScheduleException = {
  id: string;
  doctorId: string;
  branchId: string;
  date: string;
  reason: string | null;
  doctor: {
    name: string | null;
    user: {
      name: string | null;
    } | null;
  };
  branch: {
    id: string;
    name: string;
    city: string;
  };
};

const WEEKDAYS = [
  {
    value: 1,
    short: "Lun",
    full: "Lunes",
  },
  {
    value: 2,
    short: "Mar",
    full: "Martes",
  },
  {
    value: 3,
    short: "Mié",
    full: "Miércoles",
  },
  {
    value: 4,
    short: "Jue",
    full: "Jueves",
  },
  {
    value: 5,
    short: "Vie",
    full: "Viernes",
  },
  {
    value: 6,
    short: "Sáb",
    full: "Sábado",
  },
  {
    value: 0,
    short: "Dom",
    full: "Domingo",
  },
];

const EMPTY_FORM = {
  doctorId: "",
  weekdays: [] as number[],
  startTime: "",
  endTime: "",
};

function addMinutes(time: string, minutes: number) {
  if (!time) return "";

  const [hours, currentMinutes] = time.split(":").map(Number);

  const totalMinutes = hours * 60 + currentMinutes + minutes;

  if (totalMinutes < 0) return "";

  const normalizedHours = Math.floor(totalMinutes / 60);
  const normalizedMinutes = totalMinutes % 60;

  return `${String(normalizedHours).padStart(2, "0")}:${String(
    normalizedMinutes
  ).padStart(2, "0")}`;
}

function getWeekdayName(weekday: number) {
  return (
    WEEKDAYS.find((day) => day.value === weekday)?.full ||
    "Día no identificado"
  );
}

export default function DoctorScheduleManager({
  branch,
  doctors,
}: DoctorScheduleManagerProps) {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [specificSchedules, setSpecificSchedules] = useState<
    SpecificSchedule[]
  >([]);

  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);

  const [specificForm, setSpecificForm] = useState({
    doctorId: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  const [exceptionForm, setExceptionForm] = useState({
    doctorId: "",
    date: "",
    reason: "",
  });

  const doctorsForBranch = useMemo(
    () =>
      doctors
        .filter(
          (doctor) =>
            doctor.active &&
            doctor.branches.some(
              (doctorBranch) => doctorBranch.branchId === branch.id
            )
        )
        .sort((firstDoctor, secondDoctor) =>
          (
            firstDoctor.name ||
            firstDoctor.user?.name ||
            ""
          ).localeCompare(
            secondDoctor.name ||
              secondDoctor.user?.name ||
              "",
            "es"
          )
        ),
    [branch.id, doctors]
  );

  const branchSchedules = useMemo(
    () =>
      schedules
        .filter((schedule) => schedule.branchId === branch.id)
        .sort((firstSchedule, secondSchedule) => {
          const doctorComparison = (
            firstSchedule.doctor.name ||
            firstSchedule.doctor.user?.name ||
            ""
          ).localeCompare(
            secondSchedule.doctor.name ||
              secondSchedule.doctor.user?.name ||
              "",
            "es"
          );

          if (doctorComparison !== 0) {
            return doctorComparison;
          }

          if (firstSchedule.weekday !== secondSchedule.weekday) {
            return firstSchedule.weekday - secondSchedule.weekday;
          }

          return firstSchedule.startTime.localeCompare(
            secondSchedule.startTime
          );
        }),
    [branch.id, schedules]
  );

  const selectedDoctorSchedules = useMemo(
    () =>
      form.doctorId
        ? schedules.filter(
            (schedule) =>
              schedule.doctorId === form.doctorId && schedule.active
          )
        : [],
    [form.doctorId, schedules]
  );

  const firstAppointment = form.startTime
    ? addMinutes(form.startTime, 30)
    : "";

  const lastAppointment = form.endTime
    ? addMinutes(form.endTime, -30)
    : "";

  async function loadSchedules() {
    try {
      setLoading(true);

      const response = await fetch("/api/doctor-schedules", {
        cache: "no-store",
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        console.error(
          data?.error || "No se pudo cargar la agenda semanal."
        );
        setSchedules([]);
        return;
      }

      setSchedules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar la agenda semanal:", error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadSpecificSchedules() {
    const response = await fetch("/api/doctor-specific-schedules", {
      cache: "no-store",
    });

    const data = await response.json();

    setSpecificSchedules(Array.isArray(data) ? data : []);
  }

  async function loadExceptions() {
    const response = await fetch("/api/doctor-schedule-exceptions", {
      cache: "no-store",
    });

    const data = await response.json();

    setExceptions(Array.isArray(data) ? data : []);
  }

  async function saveSpecificSchedule() {
    const response = await fetch("/api/doctor-specific-schedules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...specificForm,
        branchId: branch.id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error("No se pudo guardar la fecha.");
      return;
    }

    setSpecificForm({
      doctorId: "",
      date: "",
      startTime: "",
      endTime: "",
    });

    await loadSpecificSchedules();
  }

  async function saveException() {
    const response = await fetch("/api/doctor-schedule-exceptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...exceptionForm,
        branchId: branch.id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error("No se pudo bloquear la fecha.");
      return;
    }

    setExceptionForm({
      doctorId: "",
      date: "",
      reason: "",
    });

    await loadExceptions();
  }

  async function deleteSpecificSchedule(id: string) {
    if (!confirm("¿Eliminar esta fecha específica?")) return;

    await fetch(`/api/doctor-specific-schedules/${id}`, {
      method: "DELETE",
    });

    await loadSpecificSchedules();
  }

  async function deleteException(id: string) {
    if (!confirm("¿Eliminar este bloqueo?")) return;

    await fetch(`/api/doctor-schedule-exceptions/${id}`, {
      method: "DELETE",
    });

    await loadExceptions();
  }

  useEffect(() => {
    loadSchedules();
    loadSpecificSchedules();
    loadExceptions();
  }, []);

  function toggleWeekday(weekday: number) {
    setForm((current) => {
      const selected = current.weekdays.includes(weekday);

      return {
        ...current,
        weekdays: selected
          ? current.weekdays.filter((day) => day !== weekday)
          : [...current.weekdays, weekday],
      };
    });
  }

  function getConflictingBranch(weekday: number) {
    const conflictingSchedule = selectedDoctorSchedules.find(
      (schedule) =>
        schedule.weekday === weekday &&
        schedule.branchId !== branch.id
    );

    return conflictingSchedule?.branch || null;
  }

  async function saveSchedule() {
    if (!form.doctorId) {
      toast.warning("Seleccioná un especialista.");
      return;
    }

    if (form.weekdays.length === 0) {
      toast.warning("Seleccioná al menos un día de atención.");
      return;
    }

    if (!form.startTime || !form.endTime) {
      toast.warning("Completá el horario desde y hasta.");
      return;
    }

    if (form.startTime >= form.endTime) {
      toast.warning("La hora de inicio debe ser anterior a la hora de finalización.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/doctor-schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId: form.doctorId,
          branchId: branch.id,
          weekdays: form.weekdays,
          startTime: form.startTime,
          endTime: form.endTime,
        }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        toast.error("No se pudo guardar el horario.");
        return;
      }

      setForm(EMPTY_FORM);

      await loadSchedules();

      toast.success("Agenda semanal guardada.");
    } catch (error) {
      console.error("Error al guardar la agenda semanal:", error);
      toast.error("No se pudo guardar la agenda semanal.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSchedule(id: string) {
    if (!confirm("¿Eliminar este horario semanal?")) {
      return;
    }

    try {
      setDeletingId(id);

      const response = await fetch(`/api/doctor-schedules/${id}`, {
        method: "DELETE",
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        toast.error("No se pudo eliminar el horario.");
        return;
      }

      await loadSchedules();
    } catch (error) {
      console.error("Error al eliminar el horario:", error);
      toast.error("No se pudo eliminar el horario.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-10 w-full border-t border-[#DED9CD] pt-8">
      <div>
        <h4 className="font-[var(--font-cormorant)] text-2xl text-[#263F3B]">
          Programación de especialistas
        </h4>

        <p className="mt-1 text-sm leading-6 text-[#6B7774]">
          Configurá una sola vez los días y horarios habituales de cada
          especialista en esta sucursal.
        </p>
      </div>

      <details
        open
        className="group mt-6 border border-[#DED9CD] bg-[#FCFBF8]"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 [&::-webkit-details-marker]:hidden">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#D5DDCF] bg-[#F2F5EF]">
              <CalendarDays className="h-4 w-4 text-[#56705F]" />
            </div>

            <div>
              <h5 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#263F3B]">
                Agenda semanal habitual
              </h5>

              <p className="mt-1 text-sm text-[#6B7774]">
                Seleccioná uno o varios días para aplicarles el mismo horario.
              </p>
            </div>
          </div>

          <ChevronDown className="h-5 w-5 shrink-0 text-[#263F3B] transition-transform duration-200 group-open:rotate-180" />
        </summary>

        <div className="border-t border-[#DED9CD] px-6 pb-6">
          <div className="mt-6">
            <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Especialista
            </label>

            <select
              value={form.doctorId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  doctorId: event.target.value,
                  weekdays: [],
                }))
              }
              className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
            >
              <option value="">Seleccionar especialista</option>

              {doctorsForBranch.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name || doctor.user?.name || "Especialista"}
                </option>
              ))}
            </select>

            {doctorsForBranch.length === 0 && (
              <p className="mt-2 text-xs text-[#9A6868]">
                No hay especialistas activos asignados a esta sucursal.
              </p>
            )}
          </div>

          <div className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Días de atención
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {WEEKDAYS.map((day) => {
                const selected = form.weekdays.includes(day.value);
                const conflictingBranch = getConflictingBranch(day.value);
                const disabled = Boolean(conflictingBranch);

                return (
                  <button
                    key={day.value}
                    type="button"
                    disabled={!form.doctorId || disabled}
                    title={
                      conflictingBranch
                        ? `Ya tiene agenda en ${conflictingBranch.name}`
                        : day.full
                    }
                    onClick={() => toggleWeekday(day.value)}
                    className={`border px-3 py-3 text-sm font-semibold transition ${
                      selected
                        ? "border-[#263F3B] bg-[#263F3B] text-white"
                        : disabled
                        ? "cursor-not-allowed border-[#E1D6D6] bg-[#FAF3F3] text-[#B58B8B]"
                        : "border-[#DED9CD] bg-white text-[#263F3B] hover:border-[#A2B38B] hover:bg-[#F2F5EF]"
                    } disabled:opacity-60`}
                  >
                    <span className="block">{day.short}</span>

                    {disabled && (
                      <span className="mt-1 block text-[9px] font-normal uppercase tracking-wide">
                        Otra sucursal
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {form.doctorId &&
              selectedDoctorSchedules.some(
                (schedule) => schedule.branchId !== branch.id
              ) && (
                <div className="mt-4 border border-[#E1D6D6] bg-[#FAF3F3] px-4 py-3 text-sm text-[#9A6868]">
                  Los días marcados como “Otra sucursal” no pueden seleccionarse
                  porque el especialista ya tiene agenda en otra sede.
                </div>
              )}
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                Desde
              </label>

              <input
                type="time"
                step={1800}
                value={form.startTime}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startTime: event.target.value,
                  }))
                }
                className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                Hasta
              </label>

              <input
                type="time"
                step={1800}
                value={form.endTime}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    endTime: event.target.value,
                  }))
                }
                className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
              />
            </div>
          </div>

          {form.startTime &&
            form.endTime &&
            form.startTime < form.endTime && (
              <div className="mt-5 flex items-start gap-3 border border-[#D5DDCF] bg-[#F2F5EF] px-4 py-4">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#56705F]" />

                <div className="text-sm leading-6 text-[#56705F]">
                  <p>
                    Se generarán turnos automáticamente cada{" "}
                    <strong>30 minutos</strong>.
                  </p>

                  <p>
                    Primer turno: <strong>{firstAppointment}</strong>
                    {" · "}
                    Último turno: <strong>{lastAppointment}</strong>
                  </p>
                </div>
              </div>
            )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              disabled={
                saving ||
                doctorsForBranch.length === 0 ||
                !form.doctorId ||
                form.weekdays.length === 0 ||
                !form.startTime ||
                !form.endTime
              }
              onClick={saveSchedule}
              className="bg-[#263F3B] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1D302D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Agregar horario"}
            </button>
          </div>
        </div>
      </details>

      <details className="group mt-4 border border-[#DED9CD] bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#D5DDCF] bg-[#F2F5EF]">
              <ClipboardList className="h-4 w-4 text-[#56705F]" />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#263F3B]">
                Agenda semanal configurada
              </p>

              <p className="mt-1 text-sm text-[#6B7774]">
                {loading
                  ? "Cargando agenda..."
                  : branchSchedules.length === 0
                  ? "Todavía no hay horarios cargados."
                  : `${branchSchedules.length} ${
                      branchSchedules.length === 1
                        ? "horario cargado"
                        : "horarios cargados"
                    }`}
              </p>
            </div>
          </div>

          <ChevronDown className="h-5 w-5 shrink-0 text-[#263F3B] transition-transform duration-200 group-open:rotate-180" />
        </summary>

        <div className="border-t border-[#DED9CD] p-5">
          {loading && (
            <div className="border border-[#DED9CD] bg-[#FCFBF8] px-5 py-4 text-sm text-[#6B7774]">
              Cargando agenda...
            </div>
          )}

          {!loading && branchSchedules.length === 0 && (
            <div className="border border-[#DED9CD] bg-[#FCFBF8] px-5 py-4 text-sm text-[#6B7774]">
              Todavía no hay horarios semanales cargados para esta sucursal.
            </div>
          )}

          {!loading && branchSchedules.length > 0 && (
            <div className="overflow-x-auto border border-[#DED9CD]">
              <table className="w-full min-w-[760px] border-collapse bg-white text-left text-sm">
                <thead className="bg-[#F7F5EF]">
                  <tr>
                    <th className="border-b border-[#DED9CD] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A2B38B]">
                      Especialista
                    </th>

                    <th className="border-b border-[#DED9CD] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A2B38B]">
                      Día
                    </th>

                    <th className="border-b border-[#DED9CD] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A2B38B]">
                      Sucursal
                    </th>

                    <th className="border-b border-[#DED9CD] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A2B38B]">
                      Horario
                    </th>

                    <th className="border-b border-[#DED9CD] px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A2B38B]">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {branchSchedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td className="border-b border-[#EEEAE1] px-4 py-4 font-semibold text-[#263F3B]">
                        {schedule.doctor.name ||
                          schedule.doctor.user?.name ||
                          "Especialista"}
                      </td>

                      <td className="border-b border-[#EEEAE1] px-4 py-4 text-[#263F3B]">
                        {getWeekdayName(schedule.weekday)}
                      </td>

                      <td className="border-b border-[#EEEAE1] px-4 py-4 text-[#6B7774]">
                        {schedule.branch.name} · {schedule.branch.city}
                      </td>

                      <td className="border-b border-[#EEEAE1] px-4 py-4 text-[#263F3B]">
                        {schedule.startTime} a {schedule.endTime}
                      </td>

                      <td className="border-b border-[#EEEAE1] px-4 py-4 text-right">
                        <button
                          type="button"
                          disabled={deletingId === schedule.id}
                          onClick={() => deleteSchedule(schedule.id)}
                          className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D97A7A] hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />

                          {deletingId === schedule.id
                            ? "Eliminando..."
                            : "Eliminar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </details>

      <details className="group mt-4 border border-[#DED9CD] bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#D5DDCF] bg-[#F2F5EF]">
              <CalendarDays className="h-4 w-4 text-[#56705F]" />
            </div>

            <div>
              <h5 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#263F3B]">
                Fechas específicas
              </h5>

              <p className="mt-1 text-sm text-[#6B7774]">
                Agendá días puntuales en los que el especialista atenderá en
                esta sucursal.
              </p>
            </div>
          </div>

          <ChevronDown className="h-5 w-5 shrink-0 text-[#263F3B] transition-transform duration-200 group-open:rotate-180" />
        </summary>

        <div className="border-t border-[#DED9CD] p-5">
          <div className="grid gap-4 md:grid-cols-4">
            <select
              value={specificForm.doctorId}
              onChange={(event) =>
                setSpecificForm({
                  ...specificForm,
                  doctorId: event.target.value,
                })
              }
              className="border border-[#DED9CD] bg-white p-3"
            >
              <option value="">Especialista</option>

              {doctorsForBranch.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name || doctor.user?.name || "Especialista"}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={specificForm.date}
              onChange={(event) =>
                setSpecificForm({
                  ...specificForm,
                  date: event.target.value,
                })
              }
              className="border border-[#DED9CD] bg-white p-3"
            />

            <input
              type="time"
              step={1800}
              value={specificForm.startTime}
              onChange={(event) =>
                setSpecificForm({
                  ...specificForm,
                  startTime: event.target.value,
                })
              }
              className="border border-[#DED9CD] bg-white p-3"
            />

            <input
              type="time"
              step={1800}
              value={specificForm.endTime}
              onChange={(event) =>
                setSpecificForm({
                  ...specificForm,
                  endTime: event.target.value,
                })
              }
              className="border border-[#DED9CD] bg-white p-3"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={saveSpecificSchedule}
              className="bg-[#263F3B] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white"
            >
              Agregar fecha específica
            </button>
          </div>

          <div className="mt-5 space-y-2">
            {specificSchedules
              .filter((schedule) => schedule.branchId === branch.id)
              .map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex flex-col gap-3 border border-[#DED9CD] bg-white p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    <strong>
                      {schedule.doctor.name ||
                        schedule.doctor.user?.name ||
                        "Especialista"}
                    </strong>
                    {" · "}
                    {new Date(
                      `${schedule.date.split("T")[0]}T12:00:00`
                    ).toLocaleDateString("es-AR")}
                    {" · "}
                    {schedule.startTime} a {schedule.endTime}
                  </span>

                  <button
                    type="button"
                    onClick={() => deleteSpecificSchedule(schedule.id)}
                    className="text-left text-xs font-semibold uppercase text-red-500 sm:text-right"
                  >
                    Eliminar
                  </button>
                </div>
              ))}

            {specificSchedules.filter(
              (schedule) => schedule.branchId === branch.id
            ).length === 0 && (
              <p className="border border-[#DED9CD] bg-[#FCFBF8] px-5 py-4 text-sm text-[#6B7774]">
                Todavía no hay fechas específicas cargadas para esta sucursal.
              </p>
            )}
          </div>
        </div>
      </details>

      <details className="group mt-4 border border-[#DED9CD] bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#D5DDCF] bg-[#F2F5EF]">
              <CalendarX className="h-4 w-4 text-[#56705F]" />
            </div>

            <div>
              <h5 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#263F3B]">
                Días no disponibles
              </h5>

              <p className="mt-1 text-sm text-[#6B7774]">
                Bloqueá fechas puntuales en las que el especialista no estará disponible.
              </p>
            </div>
          </div>

          <ChevronDown className="h-5 w-5 shrink-0 text-[#263F3B] transition-transform duration-200 group-open:rotate-180" />
        </summary>

        <div className="border-t border-[#DED9CD] p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <select
              value={exceptionForm.doctorId}
              onChange={(event) =>
                setExceptionForm({
                  ...exceptionForm,
                  doctorId: event.target.value,
                })
              }
              className="border border-[#DED9CD] bg-white p-3"
            >
              <option value="">Especialista</option>

              {doctorsForBranch.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name || doctor.user?.name || "Especialista"}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={exceptionForm.date}
              onChange={(event) =>
                setExceptionForm({
                  ...exceptionForm,
                  date: event.target.value,
                })
              }
              className="border border-[#DED9CD] bg-white p-3"
            />

            <input
              value={exceptionForm.reason}
              onChange={(event) =>
                setExceptionForm({
                  ...exceptionForm,
                  reason: event.target.value,
                })
              }
              placeholder="Motivo opcional"
              className="border border-[#DED9CD] bg-white p-3"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={saveException}
              className="bg-[#263F3B] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white"
            >
              Bloquear fecha
            </button>
          </div>

          <div className="mt-5 space-y-2">
            {exceptions
              .filter((exception) => exception.branchId === branch.id)
              .map((exception) => (
                <div
                  key={exception.id}
                  className="flex flex-col gap-3 border border-[#E1D6D6] bg-[#FAF3F3] p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    <strong>
                      {exception.doctor.name ||
                        exception.doctor.user?.name ||
                        "Especialista"}
                    </strong>
                    {" · "}
                    {new Date(
                      `${exception.date.split("T")[0]}T12:00:00`
                    ).toLocaleDateString("es-AR")}
                    {" · "}
                    {exception.reason || "No disponible"}
                  </span>

                  <button
                    type="button"
                    onClick={() => deleteException(exception.id)}
                    className="text-left text-xs font-semibold uppercase text-red-500 sm:text-right"
                  >
                    Eliminar
                  </button>
                </div>
              ))}

            {exceptions.filter(
              (exception) => exception.branchId === branch.id
            ).length === 0 && (
              <p className="border border-[#DED9CD] bg-[#FCFBF8] px-5 py-4 text-sm text-[#6B7774]">
                Todavía no hay fechas bloqueadas para esta sucursal.
              </p>
            )}
          </div>
        </div>
      </details>

      <div className="mt-6 border border-[#D5DDCF] bg-[#F2F5EF] px-5 py-4 text-sm leading-6 text-[#56705F]">
        Un especialista no puede tener horarios el mismo día en dos sucursales.
        El sistema también impide guardar horarios superpuestos.
      </div>
    </div>
  );
}