"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";

import { useConfirm } from "@/components/ui/ConfirmProvider";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELED";

type CalendarView = "mes" | "semana" | "dia";

type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
};

type PatientOption = {
  id: string;
  firstName: string;
  lastName: string;
  dni: string | null;
  phone: string;
  branchId: string;
};

type Appointment = {
  id: string;
  date: string;
  status: AppointmentStatus;
  reminderSent: boolean;
  notes?: string | null;

  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    dni: string | null;
  };

  doctor: {
    user: {
      name: string | null;
    };
  };

  branch: Branch;
};

type ApiResponse = {
  appointments: Appointment[];
  branches: Branch[];
  patients: PatientOption[];
};

type AppointmentForm = {
  patientId: string;
  branchId: string;
  date: string;
  time: string;
  notes: string;
};

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const offset = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + offset);
  result.setHours(0, 0, 0, 0);

  return result;
}

function isSameDay(
  firstDate: Date,
  secondDate: Date
) {
  return (
    firstDate.getFullYear() ===
      secondDate.getFullYear() &&
    firstDate.getMonth() ===
      secondDate.getMonth() &&
    firstDate.getDate() ===
      secondDate.getDate()
  );
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString(
    "es-AR",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatFullDate(date: Date) {
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getLocalDateInputValue(
  date = new Date()
) {
  const formatter = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "America/Argentina/Cordoba",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  );

  return formatter.format(date);
}

function getStatusLabel(
  status: AppointmentStatus
) {
  const labels: Record<
    AppointmentStatus,
    string
  > = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    COMPLETED: "Completado",
    CANCELED: "Cancelado",
  };

  return labels[status];
}

function getStatusClasses(
  status: AppointmentStatus
) {
  const classes: Record<
    AppointmentStatus,
    string
  > = {
    PENDING:
      "bg-[#FFF4D8] text-[#8A6D1D]",
    CONFIRMED:
      "bg-[#E8F0E3] text-[#5F7653]",
    COMPLETED:
      "bg-[#E8ECEB] text-[#455B57]",
    CANCELED:
      "bg-[#F8E6E6] text-[#A45858]",
  };

  return classes[status];
}

function getStatusBorder(
  status: AppointmentStatus
) {
  const classes: Record<
    AppointmentStatus,
    string
  > = {
    PENDING:
      "border-l-[#D8B74B]",
    CONFIRMED:
      "border-l-[#7B9A6C]",
    COMPLETED:
      "border-l-[#62736F]",
    CANCELED:
      "border-l-[#C77777]",
  };

  return classes[status];
}

function getStatusDot(
  status: AppointmentStatus
) {
  const classes: Record<
    AppointmentStatus,
    string
  > = {
    PENDING: "bg-[#D8B74B]",
    CONFIRMED: "bg-[#7B9A6C]",
    COMPLETED: "bg-[#62736F]",
    CANCELED: "bg-[#C77777]",
  };

  return classes[status];
}

export default function DoctorAgendaPage() {
  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [patients, setPatients] =
    useState<PatientOption[]>([]);

  const [selectedBranchId, setSelectedBranchId] =
    useState("all");

  const [currentDate, setCurrentDate] =
    useState(new Date());

  const [view, setView] =
    useState<CalendarView>("semana");

  const [
    selectedAppointment,
    setSelectedAppointment,
  ] = useState<Appointment | null>(null);

  const [search, setSearch] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [createModalOpen, setCreateModalOpen] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [appointmentForm, setAppointmentForm] =
    useState<AppointmentForm>({
      patientId: "",
      branchId: "",
      date: "",
      time: "",
      notes: "",
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * Paciente recibido desde la ficha:
   *
   * /dashboard/doctor/agenda?patientId=XXXX
   */
  const [patientIdFromUrl, setPatientIdFromUrl] =
    useState<string | null>(null);

  useEffect(() => {
    const searchParams =
      new URLSearchParams(
        window.location.search
      );

    setPatientIdFromUrl(
      searchParams.get("patientId")
    );
  }, []);

  const loadAppointments =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/doctor/appointments",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "No se pudo cargar la agenda."
          );
        }

        const parsedData =
          data as ApiResponse;

        setAppointments(
          Array.isArray(
            parsedData.appointments
          )
            ? parsedData.appointments
            : []
        );

        setBranches(
          Array.isArray(
            parsedData.branches
          )
            ? parsedData.branches
            : []
        );

        setPatients(
          Array.isArray(
            parsedData.patients
          )
            ? parsedData.patients
            : []
        );
      } catch (loadError) {
        console.error(loadError);

        setAppointments([]);
        setBranches([]);
        setPatients([]);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar la agenda."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    setNotes(
      selectedAppointment?.notes || ""
    );
  }, [selectedAppointment]);

  /*
   * =====================================================
   * FILTRADO
   * =====================================================
   *
   * Agenda general:
   * patientIdFromUrl === null
   *
   * Agenda desde ficha:
   * patientIdFromUrl === paciente seleccionado
   */
  const filteredAppointments =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return appointments.filter(
        (appointment) => {
          const matchesBranch =
            selectedBranchId === "all" ||
            appointment.branch.id ===
              selectedBranchId;

          const matchesPatient =
            !patientIdFromUrl ||
            appointment.patient.id ===
              patientIdFromUrl;

          const patientName =
            `${appointment.patient.firstName} ${appointment.patient.lastName}`.toLowerCase();

          const invertedPatientName =
            `${appointment.patient.lastName} ${appointment.patient.firstName}`.toLowerCase();

          const matchesSearch =
            !normalizedSearch ||
            patientName.includes(
              normalizedSearch
            ) ||
            invertedPatientName.includes(
              normalizedSearch
            ) ||
            appointment.patient.dni
              ?.toLowerCase()
              .includes(normalizedSearch) ||
            appointment.notes
              ?.toLowerCase()
              .includes(
                normalizedSearch
              );

          return (
            matchesBranch &&
            matchesPatient &&
            matchesSearch
          );
        }
      );
    }, [
      appointments,
      selectedBranchId,
      search,
      patientIdFromUrl,
    ]);

  /*
   * Paciente seleccionado desde la URL.
   */
  const selectedPatientFromUrl =
    useMemo(() => {
      if (!patientIdFromUrl) {
        return null;
      }

      return (
        patients.find(
          (patient) =>
            patient.id ===
            patientIdFromUrl
        ) || null
      );
    }, [
      patients,
      patientIdFromUrl,
    ]);

  const calendarDays = useMemo(() => {
    const year =
      currentDate.getFullYear();

    const month =
      currentDate.getMonth();

    const firstDay = new Date(
      year,
      month,
      1
    );

    const lastDay = new Date(
      year,
      month + 1,
      0
    );

    const firstWeekDay =
      firstDay.getDay();

    const startOffset =
      firstWeekDay === 0
        ? 6
        : firstWeekDay - 1;

    const days: (Date | null)[] = [];

    for (
      let index = 0;
      index < startOffset;
      index++
    ) {
      days.push(null);
    }

    for (
      let day = 1;
      day <= lastDay.getDate();
      day++
    ) {
      days.push(
        new Date(
          year,
          month,
          day
        )
      );
    }

    while (
      days.length % 7 !== 0
    ) {
      days.push(null);
    }

    return days;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const firstDay =
      startOfWeek(currentDate);

    return Array.from(
      { length: 7 },
      (_, index) => {
        const date = new Date(
          firstDay
        );

        date.setDate(
          firstDay.getDate() +
            index
        );

        return date;
      }
    );
  }, [currentDate]);

  function getAppointmentsForDay(
    day: Date
  ) {
    return filteredAppointments
      .filter((appointment) =>
        isSameDay(
          new Date(
            appointment.date
          ),
          day
        )
      )
      .sort(
        (
          firstAppointment,
          secondAppointment
        ) =>
          new Date(
            firstAppointment.date
          ).getTime() -
          new Date(
            secondAppointment.date
          ).getTime()
      );
  }

  function navigate(
    direction: "previous" | "next"
  ) {
    setCurrentDate(
      (previousDate) => {
        const result =
          new Date(previousDate);

        const amount =
          direction === "next"
            ? 1
            : -1;

        if (view === "mes") {
          result.setMonth(
            result.getMonth() +
              amount
          );
        }

        if (view === "semana") {
          result.setDate(
            result.getDate() +
              amount * 7
          );
        }

        if (view === "dia") {
          result.setDate(
            result.getDate() +
              amount
          );
        }

        return result;
      }
    );
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function getCurrentPeriodTitle() {
    if (view === "mes") {
      return currentDate.toLocaleDateString(
        "es-AR",
        {
          month: "long",
          year: "numeric",
        }
      );
    }

    if (view === "dia") {
      return formatFullDate(
        currentDate
      );
    }

    const start = weekDays[0];
    const end = weekDays[6];

    return `${start.toLocaleDateString(
      "es-AR",
      {
        day: "numeric",
        month: "short",
      }
    )} al ${end.toLocaleDateString(
      "es-AR",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    )}`;
  }

  function openCreateModal() {
    setAppointmentForm({
      /*
       * Si venimos desde una ficha,
       * el paciente queda automáticamente
       * seleccionado.
       */
      patientId:
        patientIdFromUrl || "",

      branchId:
        selectedPatientFromUrl?.branchId &&
        branches.some(
          (branch) =>
            branch.id ===
            selectedPatientFromUrl.branchId
        )
          ? selectedPatientFromUrl.branchId
          : selectedBranchId !== "all"
            ? selectedBranchId
            : branches[0]?.id || "",

      date:
        getLocalDateInputValue(
          currentDate
        ),

      time: "",

      notes: "",
    });

    setError("");
    setCreateModalOpen(true);
  }

  function closeCreateModal() {
    if (creating) return;

    setCreateModalOpen(false);
  }

  async function createAppointment() {
    if (
      !appointmentForm.patientId ||
      !appointmentForm.branchId ||
      !appointmentForm.date ||
      !appointmentForm.time ||
      !appointmentForm.notes.trim()
    ) {
      setError(
        "Completá paciente, sucursal, fecha, hora y concepto."
      );
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await fetch(
        "/api/doctor/appointments",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            appointmentForm
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo crear el turno."
        );
      }

      const createdAppointment =
        data.appointment as Appointment;

      setAppointments(
        (previousAppointments) =>
          [
            ...previousAppointments,
            createdAppointment,
          ].sort(
            (
              firstAppointment,
              secondAppointment
            ) =>
              new Date(
                firstAppointment.date
              ).getTime() -
              new Date(
                secondAppointment.date
              ).getTime()
          )
      );

      setCurrentDate(
        new Date(
          createdAppointment.date
        )
      );

      setView("dia");

      setCreateModalOpen(false);

      setAppointmentForm({
        patientId:
          patientIdFromUrl || "",
        branchId: "",
        date: "",
        time: "",
        notes: "",
      });
    } catch (createError) {
      console.error(
        createError
      );

      setError(
        createError instanceof Error
          ? createError.message
          : "No se pudo crear el turno."
      );
    } finally {
      setCreating(false);
    }
  }

  async function updateAppointment(
    appointmentId: string,
    values: {
      status?: AppointmentStatus;
      notes?: string;
    }
  ) {
    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/doctor/appointments/${appointmentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            values
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo actualizar el turno."
        );
      }

      const updatedAppointment =
        data.appointment as Appointment;

      setAppointments(
        (previousAppointments) =>
          previousAppointments.map(
            (appointment) =>
              appointment.id ===
              updatedAppointment.id
                ? updatedAppointment
                : appointment
          )
      );

      setSelectedAppointment(
        updatedAppointment
      );

      setNotes(
        updatedAppointment.notes ||
          ""
      );
    } catch (updateError) {
      console.error(
        updateError
      );

      setError(
        updateError instanceof Error
          ? updateError.message
          : "No se pudo actualizar el turno."
      );
    } finally {
      setSaving(false);
    }
  }

  const currentDayAppointments =
    getAppointmentsForDay(
      currentDate
    );

  return (
    <main className="min-h-screen bg-[#F7F5EF] px-4 py-6 text-[#263F3B] sm:px-6 md:px-10 md:py-8">
      <div className="mx-auto max-w-[1500px] space-y-6">

        <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#8FA07F]">
              Portal profesional
            </p>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
              Agenda
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#6B7774]">
              Consultá tus turnos, administrá cada atención y
              accedé rápidamente a la ficha de tus pacientes.
            </p>
          </div>

          <div className="flex flex-wrap items-stretch gap-3">
            <div className="flex min-h-[65px] min-w-[140px] flex-col justify-center border border-[#DED9CD] bg-white px-4 py-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                Turnos visibles
              </p>

              <p className="mt-1 text-xl font-semibold tracking-tight">
                {filteredAppointments.length}
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex min-h-[65px] items-center justify-center gap-2 bg-[#A2B38B] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#6F855F]"
            >
              <Plus className="h-4 w-4" />
              Nuevo turno
            </button>
          </div>
        </header>

        {patientIdFromUrl && (
          <section className="flex flex-col justify-between gap-3 border border-[#C8D2BE] bg-[#EEF2E9] px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#6F855F]">
                Agenda del paciente
              </p>

              <p className="mt-1 text-sm font-semibold text-[#263F3B]">
                {selectedPatientFromUrl
                  ? `${selectedPatientFromUrl.lastName}, ${selectedPatientFromUrl.firstName}`
                  : "Paciente seleccionado"}
              </p>
            </div>

            <Link
              href={
                patientIdFromUrl
                  ? `/dashboard/doctor/pacientes/${patientIdFromUrl}`
                  : "/dashboard/doctor/pacientes"
              }
              className="inline-flex items-center justify-center border border-[#6F855F] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5F7653] transition hover:bg-white"
            >
              Ver ficha del paciente
            </Link>
          </section>
        )}

        <section className="border border-[#DED9CD] bg-white p-4 md:p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(280px,1fr)_310px_auto]">

            <label className="relative block">
              <span className="sr-only">
                Buscar turnos
              </span>

              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8FA07F]" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Buscar por paciente, DNI u observación"
                className="w-full border border-[#DED9CD] bg-[#FFFCF7] py-2 pl-11 pr-4 text-sm outline-none transition placeholder:text-[#9AA09E] focus:border-[#6F855F]"
              />
            </label>

            <select
              value={selectedBranchId}
              onChange={(event) =>
                setSelectedBranchId(
                  event.target.value
                )
              }
              className="w-full border border-[#DED9CD] bg-[#FFFCF7] px-4 py-2 text-sm outline-none transition focus:border-[#6F855F]"
            >
              <option value="all">
                Todas mis sucursales
              </option>

              {branches.map(
                (branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.name} —{" "}
                    {branch.address} -{" "}
                    {branch.city}
                  </option>
                )
              )}
            </select>

            <div className="grid grid-cols-3 border border-[#DED9CD]">
              {(
                [
                  "mes",
                  "semana",
                  "dia",
                ] as const
              ).map(
                (viewOption) => (
                  <button
                    key={viewOption}
                    type="button"
                    onClick={() =>
                      setView(
                        viewOption
                      )
                    }
                    className={`min-w-[82px] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
                      view === viewOption
                        ? "bg-[#A2B38B] text-white"
                        : "bg-[#FFFCF7] text-[#5F6F6B] hover:bg-[#F0EDE6]"
                    }`}
                  >
                    {viewOption ===
                    "dia"
                      ? "Día"
                      : viewOption}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className="border border-[#E4BABA] bg-[#FBEFEF] px-5 py-4 text-sm text-[#9C5252]">
            <div className="flex items-start justify-between gap-4">
              <p>{error}</p>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                aria-label="Cerrar mensaje"
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <section className="overflow-hidden border border-[#DED9CD] bg-white">

          <div className="flex flex-col justify-between gap-5 border-b border-[#DED9CD] px-5 py-5 md:flex-row md:items-center md:px-7">

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8FA07F]">
                {view === "mes"
                  ? "Vista mensual"
                  : view === "semana"
                    ? "Vista semanal"
                    : "Vista diaria"}
              </p>

              <h2 className="mt-2 text-2xl font-semibold capitalize tracking-tight md:text-2xl">
                {getCurrentPeriodTitle()}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={
                  goToToday
                }
                className="border border-[#DED9CD] bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5F6F6B] transition hover:border-[#6F855F] hover:text-[#263F3B]"
              >
                Hoy
              </button>

              <div className="flex border border-[#DED9CD]">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "previous"
                    )
                  }
                  aria-label="Periodo anterior"
                  className="flex h-11 w-10 items-center justify-center border-r border-[#DED9CD] transition hover:bg-[#F0EDE6]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("next")
                  }
                  aria-label="Periodo siguiente"
                  className="flex h-11 w-10 items-center justify-center transition hover:bg-[#F0EDE6]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[480px] flex-col items-center justify-center gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-[#6F855F]" />

              <p className="text-sm text-[#6B7774]">
                Cargando agenda...
              </p>
            </div>
          ) : (
            <>
              {view ===
                "mes" && (
                <MonthView
                  days={
                    calendarDays
                  }
                  appointmentsForDay={
                    getAppointmentsForDay
                  }
                  onSelect={
                    setSelectedAppointment
                  }
                />
              )}

              {view ===
                "semana" && (
                <WeekView
                  days={
                    weekDays
                  }
                  appointmentsForDay={
                    getAppointmentsForDay
                  }
                  onSelect={
                    setSelectedAppointment
                  }
                />
              )}

              {view ===
                "dia" && (
                <DayView
                  appointments={
                    currentDayAppointments
                  }
                  onSelect={
                    setSelectedAppointment
                  }
                  onCreate={
                    openCreateModal
                  }
                />
              )}
            </>
          )}
        </section>
      </div>

      {selectedAppointment && (
        <AppointmentDrawer
          appointment={
            selectedAppointment
          }
          notes={notes}
          saving={saving}
          onNotesChange={
            setNotes
          }
          onClose={() =>
            setSelectedAppointment(
              null
            )
          }
          onUpdateStatus={(
            status
          ) =>
            updateAppointment(
              selectedAppointment.id,
              {
                status,
              }
            )
          }
          onSaveNotes={() =>
            updateAppointment(
              selectedAppointment.id,
              {
                notes,
              }
            )
          }
        />
      )}

      {createModalOpen && (
        <CreateAppointmentModal
          patients={patients}
          branches={branches}
          form={appointmentForm}
          creating={creating}
          onChange={
            setAppointmentForm
          }
          onClose={
            closeCreateModal
          }
          onCreate={
            createAppointment
          }
          lockedPatientId={
            patientIdFromUrl
          }
        />
      )}
    </main>
  );
}

function MonthView({
  days,
  appointmentsForDay,
  onSelect,
}: {
  days: (Date | null)[];
  appointmentsForDay: (
    day: Date
  ) => Appointment[];
  onSelect: (
    appointment: Appointment
  ) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[980px]">

        <div className="grid grid-cols-7 border-b border-[#DED9CD] bg-[#FAF9F5]">
          {[
            "Lun",
            "Mar",
            "Mié",
            "Jue",
            "Vie",
            "Sáb",
            "Dom",
          ].map((day) => (
            <div
              key={day}
              className="border-r border-[#DED9CD] py-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6B7774] last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map(
            (day, index) => {
              const dayAppointments =
                day
                  ? appointmentsForDay(
                      day
                    )
                  : [];

              const isToday =
                day &&
                isSameDay(
                  day,
                  new Date()
                );

              return (
                <div
                  key={`${
                    day?.toISOString() ||
                    "empty"
                  }-${index}`}
                  className={`min-h-[175px] border-b border-r border-[#DED9CD] p-3 [&:nth-child(7n)]:border-r-0 ${
                    !day
                      ? "bg-[#FAF9F5]"
                      : "bg-white"
                  }`}
                >
                  {day && (
                    <>
                      <div className="mb-4 flex items-center justify-between">

                        <span
                          className={`flex h-8 w-8 items-center justify-center text-sm font-semibold ${
                            isToday
                              ? "rounded-full bg-[#6F855F] text-white"
                              : "text-[#263F3B]"
                          }`}
                        >
                          {day.getDate()}
                        </span>

                        {dayAppointments.length >
                          0 && (
                          <span className="text-[10px] font-medium text-[#8FA07F]">
                            {
                              dayAppointments.length
                            }{" "}
                            {dayAppointments.length ===
                            1
                              ? "turno"
                              : "turnos"}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {dayAppointments
                          .slice(
                            0,
                            3
                          )
                          .map(
                            (
                              appointment
                            ) => (
                              <CompactAppointment
                                key={
                                  appointment.id
                                }
                                appointment={
                                  appointment
                                }
                                onClick={() =>
                                  onSelect(
                                    appointment
                                  )
                                }
                              />
                            )
                          )}

                        {dayAppointments.length >
                          3 && (
                          <p className="px-1 text-xs font-medium text-[#6F855F]">
                            +
                            {dayAppointments.length -
                              3}{" "}
                            más
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}

function WeekView({
  days,
  appointmentsForDay,
  onSelect,
}: {
  days: Date[];
  appointmentsForDay: (
    day: Date
  ) => Appointment[];
  onSelect: (
    appointment: Appointment
  ) => void;
}) {
  return (
    <div className="w-full overflow-hidden">
      <div className="grid w-full grid-cols-7">

        {days.map((day) => {
          const appointments =
            appointmentsForDay(
              day
            );

          const isToday =
            isSameDay(
              day,
              new Date()
            );

          return (
            <div
              key={day.toISOString()}
              className={`min-w-0 border-r border-[#DED9CD] last:border-r-0 ${
                isToday
                  ? "bg-[#FBFCF8]"
                  : "bg-white"
              }`}
            >
              <div
                className={`border-b px-2 py-3 text-center ${
                  isToday
                    ? "border-[#A2B38B] bg-[#EEF2E9]"
                    : "border-[#DED9CD] bg-[#FAF9F5]"
                }`}
              >
                <p
                  className={`text-[9px] font-semibold uppercase tracking-[0.16em] ${
                    isToday
                      ? "text-[#6F855F]"
                      : "text-[#6B7774]"
                  }`}
                >
                  {day.toLocaleDateString(
                    "es-AR",
                    {
                      weekday:
                        "short",
                    }
                  )}
                </p>

                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {day.getDate()}
                </p>

                {isToday && (
                  <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-[#6F855F]">
                    Hoy
                  </p>
                )}
              </div>

              <div className="space-y-2 p-2">
                {appointments.map(
                  (appointment) => (
                    <WeekAppointment
                      key={
                        appointment.id
                      }
                      appointment={
                        appointment
                      }
                      onClick={() =>
                        onSelect(
                          appointment
                        )
                      }
                    />
                  )
                )}

                {appointments.length ===
                  0 && (
                  <div className="flex min-h-[110px] flex-col items-center justify-center text-center">
                    <Clock3 className="h-4 w-4 text-[#C0C5C2]" />

                    <p className="mt-2 text-[10px] text-[#9A9F9D]">
                      Sin turnos
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({
  appointments,
  onSelect,
  onCreate,
}: {
  appointments: Appointment[];
  onSelect: (
    appointment: Appointment
  ) => void;
  onCreate: () => void;
}) {
  return (
    <div className="p-5 md:p-7">

      <div className="flex items-center justify-between gap-4 border-b border-[#EEEAE1] pb-5">

        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8FA07F]">
          Atenciones programadas
        </p>

        <p className="text-sm text-[#6B7774]">
          {appointments.length}{" "}
          {appointments.length ===
          1
            ? "turno"
            : "turnos"}
        </p>
      </div>

      <div className="mt-6 space-y-3">

        {appointments.map(
          (appointment) => (
            <button
              key={appointment.id}
              type="button"
              onClick={() =>
                onSelect(
                  appointment
                )
              }
              className={`grid w-full gap-4 border border-l-4 border-[#DED9CD] bg-[#FFFCF7] p-5 text-left transition hover:border-[#A2B38B] md:grid-cols-[100px_1fr_auto] md:items-center ${getStatusBorder(
                appointment.status
              )}`}
            >
              <div>
                <p className="text-2xl font-semibold tracking-tight">
                  {formatTime(
                    appointment.date
                  )}
                </p>

                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A2B38B]">
                  Horario
                </p>
              </div>

              <div>
                <p className="font-semibold">
                  {
                    appointment.patient
                      .lastName
                  }
                  ,{" "}
                  {
                    appointment.patient
                      .firstName
                  }
                </p>

                <p className="mt-1 text-sm leading-6 text-[#6B7774]">
                  {appointment.notes ||
                    "Consulta sin especificar"}
                </p>

                <p className="mt-1 text-xs text-[#8B9491]">
                  {
                    appointment.branch
                      .name
                  }
                </p>
              </div>

              <StatusBadge
                status={
                  appointment.status
                }
              />
            </button>
          )
        )}

        {appointments.length ===
          0 && (
          <div className="flex min-h-[280px] flex-col items-center justify-center border border-dashed border-[#DED9CD] px-5 py-14 text-center">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F0EDE6] text-[#6F855F]">
              <CalendarDays className="h-6 w-6" />
            </div>

            <p className="mt-5 text-2xl font-semibold tracking-tight">
              No hay turnos para este día
            </p>

            <p className="mt-2 text-sm text-[#6B7774]">
              Podés agregar una nueva atención
              desde el botón Nuevo turno.
            </p>

            <button
              type="button"
              onClick={onCreate}
              className="mt-6 inline-flex items-center gap-2 border border-[#263F3B] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#263F3B] transition hover:bg-[#263F3B] hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Agregar turno
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CompactAppointment({
  appointment,
  onClick,
}: {
  appointment: Appointment;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full border border-l-4 border-[#E4E0D7] bg-[#FFFCF7] px-3 py-2.5 text-left transition hover:border-[#A2B38B] hover:bg-[#F7F8F3] ${getStatusBorder(
        appointment.status
      )}`}
    >
      <div className="flex items-center justify-between gap-2">

        <p className="text-xs font-semibold text-[#263F3B]">
          {formatTime(
            appointment.date
          )}
        </p>

        <span
          className={`h-2 w-2 rounded-full ${getStatusDot(
            appointment.status
          )}`}
        />
      </div>

      <p className="mt-1 truncate text-xs font-medium text-[#5F6F6B]">
        {
          appointment.patient
            .lastName
        }
        ,{" "}
        {
          appointment.patient
            .firstName
        }
      </p>
    </button>
  );
}

function WeekAppointment({
  appointment,
  onClick,
}: {
  appointment: Appointment;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full min-w-0 border border-l-4 border-[#DED9CD] bg-[#FFFCF7] p-3 text-left transition hover:border-[#A2B38B] ${getStatusBorder(
        appointment.status
      )}`}
    >
      <div className="flex items-center justify-between gap-2">

        <p className="min-w-0 text-sm font-semibold leading-5 tracking-tight">
          {formatTime(
            appointment.date
          )}
        </p>

        <span
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${getStatusDot(
            appointment.status
          )}`}
        />
      </div>

      <p className="mt-2 truncate text-xs font-semibold">
        {
          appointment.patient
            .lastName
        }
        ,{" "}
        {
          appointment.patient
            .firstName
        }
      </p>

      <p className="mt-1 line-clamp-2 break-words text-[10px] leading-4 text-[#6B7774]">
        {appointment.notes ||
          "Consulta sin especificar"}
      </p>

      <p className="mt-2 truncate text-[8px] font-semibold uppercase tracking-[0.12em] text-[#8FA07F]">
        {getStatusLabel(
          appointment.status
        )}
      </p>
    </button>
  );
}

function StatusBadge({
  status,
}: {
  status: AppointmentStatus;
}) {
  return (
    <span
      className={`w-fit px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] ${getStatusClasses(
        status
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function AppointmentDrawer({
  appointment,
  notes,
  saving,
  onNotesChange,
  onClose,
  onUpdateStatus,
  onSaveNotes,
}: {
  appointment: Appointment;
  notes: string;
  saving: boolean;
  onNotesChange: (
    value: string
  ) => void;
  onClose: () => void;
  onUpdateStatus: (
    status: AppointmentStatus
  ) => void;
  onSaveNotes: () => void;
}) {
  const confirmDialog =
    useConfirm();

  return (
    <div className="fixed inset-0 z-50">

      <button
        type="button"
        aria-label="Cerrar detalle"
        onClick={onClose}
        className="absolute inset-0 bg-[#263F3B]/35"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[470px] flex-col bg-[#F7F5EF] shadow-2xl">

        <header className="border-b border-[#DED9CD] bg-white p-6">

          <div className="flex items-start justify-between gap-5">

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8FA07F]">
                Detalle del turno
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                {
                  appointment
                    .patient
                    .firstName
                }{" "}
                {
                  appointment
                    .patient
                    .lastName
                }
              </h2>

              <p className="mt-2 text-sm capitalize leading-6 text-[#6B7774]">
                {new Date(
                  appointment.date
                ).toLocaleDateString(
                  "es-AR",
                  {
                    weekday:
                      "long",
                    day: "numeric",
                    month:
                      "long",
                    year: "numeric",
                  }
                )}
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-tight text-[#263F3B]">
                {formatTime(
                  appointment.date
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#DED9CD] text-[#6B7774] transition hover:bg-[#F7F5EF]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5">
            <StatusBadge
              status={
                appointment.status
              }
            />
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">

          <section className="border border-[#DED9CD] bg-white">
            <InfoRow
              icon={
                <MapPin className="h-4 w-4" />
              }
              label="Sucursal"
              value={`${appointment.branch.name} · ${appointment.branch.address}`}
            />

            <InfoRow
              icon={
                <Phone className="h-4 w-4" />
              }
              label="Teléfono"
              value={
                appointment
                  .patient
                  .phone ||
                "Sin teléfono"
              }
            />

            <InfoRow
              icon={
                <UserRound className="h-4 w-4" />
              }
              label="DNI"
              value={
                appointment
                  .patient
                  .dni ||
                "Sin DNI"
              }
            />

            <InfoRow
              icon={
                <Clock3 className="h-4 w-4" />
              }
              label="Horario"
              value={formatTime(
                appointment.date
              )}
              last
            />
          </section>

          <section>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6B7774]">
                Concepto u observaciones
              </p>

              <p className="mt-1 text-xs text-[#8B9491]">
                Registrá información relevante
                de esta atención.
              </p>
            </div>

            <textarea
              value={notes}
              onChange={(event) =>
                onNotesChange(
                  event.target.value
                )
              }
              rows={5}
              className="mt-4 w-full resize-none border border-[#DED9CD] bg-white p-4 text-sm leading-6 outline-none transition focus:border-[#6F855F]"
              placeholder="Agregá una observación sobre el turno..."
            />

            <button
              type="button"
              disabled={saving}
              onClick={
                onSaveNotes
              }
              className="mt-3 w-full border border-[#6F855F] bg-white px-5 py-3 text-sm font-semibold text-[#5F7653] transition hover:bg-[#EEF2E9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Guardando..."
                : "Guardar observaciones"}
            </button>
          </section>

          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6B7774]">
              Estado de la atención
            </p>

            <div className="mt-4 grid gap-3">

              {appointment.status ===
                "PENDING" && (
                <ActionButton
                  icon={
                    <Check className="h-4 w-4" />
                  }
                  label="Confirmar turno"
                  disabled={saving}
                  onClick={() =>
                    onUpdateStatus(
                      "CONFIRMED"
                    )
                  }
                />
              )}

              {(appointment.status ===
                "PENDING" ||
                appointment.status ===
                  "CONFIRMED") && (
                <ActionButton
                  icon={
                    <CircleCheck className="h-4 w-4" />
                  }
                  label="Marcar como completado"
                  disabled={saving}
                  onClick={() =>
                    onUpdateStatus(
                      "COMPLETED"
                    )
                  }
                />
              )}

              {appointment.status !==
                "CANCELED" &&
                appointment.status !==
                  "COMPLETED" && (
                  <ActionButton
                    icon={
                      <X className="h-4 w-4" />
                    }
                    label="Cancelar turno"
                    danger
                    disabled={saving}
                    onClick={async () => {
                      const confirmed =
                        await confirmDialog(
                          {
                            title:
                              "Cancelar turno",

                            description:
                              "¿Seguro que querés cancelar este turno?",

                            confirmText:
                              "Cancelar turno",
                          }
                        );

                      if (!confirmed) {
                        return;
                      }

                      onUpdateStatus(
                        "CANCELED"
                      );
                    }}
                  />
                )}
            </div>
          </section>

          <Link
            href={`/dashboard/doctor/pacientes/${appointment.patient.id}`}
            className="flex items-center justify-between border border-[#263F3B] bg-[#263F3B] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#1D302D]"
          >
            Ver ficha del paciente

            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </aside>
    </div>
  );
}

function CreateAppointmentModal({
  patients,
  branches,
  form,
  creating,
  onChange,
  onClose,
  onCreate,
  lockedPatientId,
}: {
  patients: PatientOption[];
  branches: Branch[];
  form: AppointmentForm;
  creating: boolean;
  onChange: React.Dispatch<
    React.SetStateAction<AppointmentForm>
  >;
  onClose: () => void;
  onCreate: () => void;
  lockedPatientId:
    | string
    | null;
}) {
  const selectedPatient =
    patients.find(
      (patient) =>
        patient.id ===
        form.patientId
    );

  const availableBranches =
    selectedPatient?.branchId
      ? branches.filter(
          (branch) =>
            branch.id ===
            selectedPatient.branchId
        )
      : branches;

  function handlePatientChange(
    patientId: string
  ) {
    const patient =
      patients.find(
        (item) =>
          item.id ===
          patientId
      );

    onChange((current) => ({
      ...current,

      patientId,

      branchId:
        patient?.branchId &&
        branches.some(
          (branch) =>
            branch.id ===
            patient.branchId
        )
          ? patient.branchId
          : current.branchId,
    }));
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">

      <button
        type="button"
        aria-label="Cerrar formulario"
        onClick={onClose}
        className="absolute inset-0 bg-[#263F3B]/45"
      />

      <section className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto border border-[#DED9CD] bg-[#F7F5EF] shadow-2xl">

        <header className="flex items-start justify-between gap-5 border-b border-[#DED9CD] bg-white px-6 py-5">

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8FA07F]">
              Agenda profesional
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#263F3B]">
              Nuevo turno
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#6B7774]">
              Registrá una nueva atención
              para uno de tus pacientes.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            aria-label="Cerrar"
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#DED9CD] text-[#6B7774] transition hover:bg-[#F7F5EF] disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-5 p-6">

          <div>
            <label
              htmlFor="new-appointment-patient"
              className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7774]"
            >
              Paciente
            </label>

            <select
              id="new-appointment-patient"
              value={form.patientId}
              disabled={
                Boolean(
                  lockedPatientId
                )
              }
              onChange={(event) =>
                handlePatientChange(
                  event.target.value
                )
              }
              className={`mt-2 w-full border border-[#DED9CD] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#6F855F] ${
                lockedPatientId
                  ? "cursor-not-allowed bg-[#F7F5EF] text-[#6B7774]"
                  : ""
              }`}
            >
              <option value="">
                Seleccionar paciente
              </option>

              {patients.map(
                (patient) => (
                  <option
                    key={
                      patient.id
                    }
                    value={
                      patient.id
                    }
                  >
                    {
                      patient.lastName
                    }
                    ,{" "}
                    {
                      patient.firstName
                    }

                    {patient.dni
                      ? ` — DNI ${patient.dni}`
                      : ""}
                  </option>
                )
              )}
            </select>

            {lockedPatientId && (
              <p className="mt-2 text-xs text-[#6B7774]">
                El paciente está seleccionado desde su ficha.
              </p>
            )}

            {patients.length ===
              0 && (
              <p className="mt-2 text-xs text-[#A45858]">
                No tenés pacientes asociados
                disponibles.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="new-appointment-branch"
              className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7774]"
            >
              Sucursal
            </label>

            <select
              id="new-appointment-branch"
              value={
                form.branchId
              }
              onChange={(event) =>
                onChange(
                  (current) => ({
                    ...current,
                    branchId:
                      event.target
                        .value,
                  })
                )
              }
              className="mt-2 w-full border border-[#DED9CD] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#6F855F]"
            >
              <option value="">
                Seleccionar sucursal
              </option>

              {availableBranches.map(
                (branch) => (
                  <option
                    key={
                      branch.id
                    }
                    value={
                      branch.id
                    }
                  >
                    {branch.name} —{" "}
                    {
                      branch.address
                    }
                    ,{" "}
                    {branch.city}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">

            <div>
              <label
                htmlFor="new-appointment-date"
                className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7774]"
              >
                Fecha
              </label>

              <div className="mt-2 flex w-full min-w-0 border border-[#DED9CD] bg-white px-4 py-3">
                <input
                  id="new-appointment-date"
                  type="date"
                  min={getLocalDateInputValue()}
                  value={form.date}
                  onChange={(event) =>
                    onChange(
                      (current) => ({
                        ...current,
                        date:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="block w-full min-w-0 border-0 bg-transparent p-0 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="new-appointment-time"
                className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7774]"
              >
                Hora
              </label>

              <div className="mt-2 flex w-full min-w-0 border border-[#DED9CD] bg-white px-4 py-3">
                <input
                  id="new-appointment-time"
                  type="time"
                  value={form.time}
                  onChange={(event) =>
                    onChange(
                      (current) => ({
                        ...current,
                        time:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="block w-full min-w-0 border-0 bg-transparent p-0 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="new-appointment-notes"
              className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7774]"
            >
              Concepto
            </label>

            <textarea
              id="new-appointment-notes"
              value={form.notes}
              onChange={(event) =>
                onChange(
                  (current) => ({
                    ...current,
                    notes:
                      event.target
                        .value,
                  })
                )
              }
              rows={4}
              placeholder="Ejemplo: consulta, control, limpieza o tratamiento..."
              className="mt-2 w-full resize-none border border-[#DED9CD] bg-white p-4 text-sm leading-6 outline-none transition focus:border-[#6F855F]"
            />
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-[#DED9CD] bg-white px-6 py-5 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="border border-[#DED9CD] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#5F6F6B] transition hover:bg-[#F7F5EF] disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onCreate}
            disabled={
              creating ||
              patients.length ===
                0 ||
              !form.patientId ||
              !form.branchId ||
              !form.date ||
              !form.time ||
              !form.notes.trim()
            }
            className="inline-flex items-center justify-center gap-2 bg-[#263F3B] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#1D302D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando
              </>
            ) : (
              <>
                <CalendarDays className="h-4 w-4" />
                Crear turno
              </>
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex gap-4 px-5 py-4 ${
        last
          ? ""
          : "border-b border-[#EEEAE1]"
      }`}
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0EDE6] text-[#6F855F]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B9491]">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium leading-6">
          {value}
        </p>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  danger = false,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 border px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        danger
          ? "border-[#D9A5A5] bg-white text-[#A45858] hover:bg-[#F8E6E6]"
          : "border-[#6F855F] bg-[#6F855F] text-white hover:bg-[#5F7653]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}