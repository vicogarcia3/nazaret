"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Clock,
  UserRound,
} from "lucide-react";

type Treatment = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
};

type Doctor = {
  id: string;
  name: string;
  specialty: string | null;
  imageUrl?: string | null;
};

type AvailableTime = string;

type AppointmentToReschedule = {
  id: string;
  date: string;
  notes: string | null;
  status: string;
  doctorId: string;
  doctor: {
    id: string;
    user: {
      name: string | null;
    };
  };
  branch: {
    name: string;
    address: string;
  };
};

type Props = {
  treatments: Treatment[];
};

function formatDateForInput(dateValue: string | Date) {
  const date = new Date(dateValue);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0"
  );
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTimeForInput(dateValue: string | Date) {
  const date = new Date(dateValue);

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(
    2,
    "0"
  );

  return `${hours}:${minutes}`;
}

export default function ReservarTurnoClient({
  treatments,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const appointmentId =
    searchParams.get("reprogramar");

  const isRescheduling = Boolean(appointmentId);

  const [step, setStep] = useState(1);

  const [selectedTreatment, setSelectedTreatment] =
    useState("");
  const [selectedDoctorId, setSelectedDoctorId] =
    useState("");
  const [selectedDate, setSelectedDate] =
    useState("");
  const [selectedTime, setSelectedTime] =
    useState("");

  const [availableDates, setAvailableDates] =
    useState<string[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableTimes, setAvailableTimes] =
    useState<AvailableTime[]>([]);

  const [currentMonth, setCurrentMonth] =
    useState(new Date());

  const [loadingDoctors, setLoadingDoctors] =
    useState(true);
  const [loadingAppointment, setLoadingAppointment] =
    useState(Boolean(appointmentId));
  const [loadingTimes, setLoadingTimes] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const steps = [
    "Tratamiento",
    "Especialista",
    "Fecha",
    "Horario",
  ];

  useEffect(() => {
    async function loadDoctors() {
      try {
        setLoadingDoctors(true);

        const response = await fetch(
          "/api/patient/doctors"
        );

        const data = await response.json();

        if (!response.ok || !Array.isArray(data)) {
          console.error(
            "Error cargando doctores:",
            data
          );

          setDoctors([]);
          return;
        }

        setDoctors(data);
      } catch (error) {
        console.error(
          "Error cargando doctores:",
          error
        );

        setDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    }

    loadDoctors();
  }, []);

  useEffect(() => {
    async function loadAppointment() {
      if (!appointmentId) {
        setLoadingAppointment(false);
        return;
      }

      try {
        setLoadingAppointment(true);
        setErrorMessage("");

        const response = await fetch(
          `/api/appointments/${appointmentId}`
        );

        const data: AppointmentToReschedule =
          await response.json();

        if (!response.ok) {
          throw new Error(
            (data as unknown as { error?: string })
              .error ||
              "No se pudo cargar el turno."
          );
        }

        const originalDate = new Date(data.date);

        setSelectedTreatment(
          data.notes || "Turno odontológico"
        );

        setSelectedDoctorId(data.doctorId);
        setSelectedDate(
          formatDateForInput(originalDate)
        );
        setSelectedTime(
          formatTimeForInput(originalDate)
        );

        setCurrentMonth(
          new Date(
            originalDate.getFullYear(),
            originalDate.getMonth(),
            1
          )
        );

        setStep(3);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el turno."
        );
      } finally {
        setLoadingAppointment(false);
      }
    }

    loadAppointment();
  }, [appointmentId]);

  useEffect(() => {
    async function loadTimes() {
      if (!selectedDoctorId || !selectedDate) {
        setAvailableTimes([]);
        return;
      }

      try {
        setLoadingTimes(true);

        const response = await fetch(
          `/api/patient/available-times?doctorId=${selectedDoctorId}&date=${selectedDate}`
        );

        const data = await response.json();

        if (!response.ok || !Array.isArray(data)) {
          setAvailableTimes([]);
          return;
        }

        const times = Array.isArray(data)
          ? (data as string[])
          : [];

        if (
          isRescheduling &&
          selectedTime &&
          !times.includes(selectedTime)
        ) {
          times.push(selectedTime);

          times.sort();
        }

        setAvailableTimes(times);

        setAvailableTimes(times);
      } catch {
        setAvailableTimes([]);
      } finally {
        setLoadingTimes(false);
      }
    }

    loadTimes();
  }, [
    selectedDoctorId,
    selectedDate,
    isRescheduling,
    selectedTime,
  ]);

  useEffect(() => {
    async function loadAvailableDates() {
      if (!selectedDoctorId) {
        setAvailableDates([]);
        return;
      }

      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      try {
        const response = await fetch(
          `/api/patient/available-dates?doctorId=${selectedDoctorId}&year=${year}&month=${month}`
        );

        const data = await response.json();

        const dates = Array.isArray(data)
          ? data
          : [];

        if (
          isRescheduling &&
          selectedDate &&
          selectedDate.startsWith(
            `${year}-${String(month).padStart(2, "0")}`
          ) &&
          !dates.includes(selectedDate)
        ) {
          dates.push(selectedDate);
        }

        setAvailableDates(dates);
      } catch {
        setAvailableDates([]);
      }
    }

    loadAvailableDates();
  }, [
    selectedDoctorId,
    currentMonth,
    isRescheduling,
    selectedDate,
  ]);

  const selectedDoctor = doctors.find(
    (doctor) => doctor.id === selectedDoctorId
  );

  const sortedTreatments = useMemo(() => {
    return [...treatments].sort((a, b) => {
      const priceA =
        a.price ?? Number.MAX_SAFE_INTEGER;

      const priceB =
        b.price ?? Number.MAX_SAFE_INTEGER;

      return priceA - priceB;
    });
  }, [treatments]);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthName =
    currentMonth.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });

  function formatDate(day: number) {
    const year = currentMonth.getFullYear();

    const month = String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0");

    const formattedDay = String(day).padStart(
      2,
      "0"
    );

    return `${year}-${month}-${formattedDay}`;
  }

  function isPastDate(day: number) {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return date < today;
  }

  function previousMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      )
    );
  }

  function nextMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      )
    );
  }

  async function confirmAppointment() {
    if (!selectedTreatment) {
      setErrorMessage(
        "Tenés que seleccionar un tratamiento."
      );
      return;
    }

    if (!selectedDoctorId) {
      setErrorMessage(
        "Tenés que seleccionar un especialista."
      );
      return;
    }

    if (!selectedDate || !selectedTime) {
      setErrorMessage(
        "Tenés que seleccionar una fecha y un horario."
      );
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const endpoint =
        isRescheduling && appointmentId
          ? `/api/appointments/${appointmentId}`
          : "/api/patient/appointments";

      const method = isRescheduling
        ? "PUT"
        : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          date: selectedDate,
          time: selectedTime,
          treatmentName: selectedTreatment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo guardar el turno."
        );
      }

      router.push(
        isRescheduling
          ? "/dashboard/patient/turnos?reprogramado=1"
          : "/dashboard/patient/turnos?reservado=1"
      );

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el turno."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadingAppointment || loadingDoctors) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="border border-[#D8D2C4] bg-white p-8 text-[#6C7B72]">
          {isRescheduling
            ? "Cargando turno..."
            : "Cargando información..."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-[#6C7B72]"
      >
        <ArrowLeft size={16} />
        Volver
      </button>

      <div className="mb-8">
        <h1 className="font-serif text-4xl text-[#173B33]">
          {isRescheduling
            ? "Reprogramar turno"
            : "Reservar turno"}
        </h1>

        <p className="mt-2 text-[#6C7B72]">
          {isRescheduling
            ? "Elegí una nueva fecha u horario para tu atención."
            : "Elegí el tratamiento, especialista, fecha y horario para tu atención."}
        </p>
      </div>

      {isRescheduling && (
        <div className="mb-6 flex items-start gap-3 border border-[#D7DFC9] bg-[#F0F4E9] px-5 py-4 text-sm text-[#536847]">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-semibold">
              Estás reprogramando un turno
              existente.
            </p>

            <p className="mt-1 leading-6">
              El turno anterior será actualizado
              cuando confirmes los cambios. No se
              creará una reserva nueva.
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 flex items-start gap-3 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="border border-[#D8D2C4] bg-white p-5 md:p-8">
        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {steps.map((item, index) => {
            const number = index + 1;
            const active = step === number;
            const completed = step > number;

            return (
              <div
                key={item}
                className="flex items-center gap-3"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    active || completed
                      ? "bg-[#6F855F] text-white"
                      : "bg-[#EEF0E8] text-[#6C7B72]"
                  }`}
                >
                  {number}
                </div>

                <span
                  className={`text-sm font-medium ${
                    active
                      ? "text-[#263F3B]"
                      : "text-[#6C7B72]"
                  }`}
                >
                  {item}
                </span>
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <div>
            <h2 className="mb-6 font-serif text-2xl text-[#173B33]">
              Elegí el tratamiento
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {sortedTreatments.map(
                (treatment) => (
                  <button
                    key={treatment.id}
                    type="button"
                    onClick={() => {
                      setSelectedTreatment(
                        treatment.name
                      );
                      setSelectedDoctorId("");
                      setSelectedDate("");
                      setSelectedTime("");
                      setStep(2);
                    }}
                    className={`border p-5 text-left transition ${
                      selectedTreatment ===
                      treatment.name
                        ? "border-[#6F855F] bg-[#6F855F] text-white"
                        : "border-[#D8D2C4] bg-white text-[#173B33] hover:border-[#6F855F]"
                    }`}
                  >
                    <h3 className="font-semibold">
                      {treatment.name}
                    </h3>

                    {treatment.description && (
                      <p className="mt-1 text-sm opacity-70">
                        {treatment.description}
                      </p>
                    )}

                    <p className="mt-3 text-sm font-medium">
                      {treatment.price
                        ? `$${treatment.price.toLocaleString(
                            "es-AR"
                          )}`
                        : "Consultar precio"}
                    </p>
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedTreatment(
                    "Otro servicio"
                  );
                  setSelectedDoctorId("");
                  setSelectedDate("");
                  setSelectedTime("");
                  setStep(2);
                }}
                className={`border p-5 text-left transition ${
                  selectedTreatment ===
                  "Otro servicio"
                    ? "border-[#6F855F] bg-[#6F855F] text-white"
                    : "border-[#D8D2C4] bg-white text-[#173B33] hover:border-[#6F855F]"
                }`}
              >
                <h3 className="font-semibold">
                  Otro servicio
                </h3>

                <p className="mt-1 text-sm opacity-70">
                  No encontré el tratamiento que
                  necesito.
                </p>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="mb-6 font-serif text-2xl text-[#173B33]">
              Elegí el especialista
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  type="button"
                  onClick={() => {
                    setSelectedDoctorId(doctor.id);
                    setSelectedDate("");
                    setSelectedTime("");
                    setAvailableTimes([]);
                    setStep(3);
                  }}
                  className={`border p-5 text-left transition ${
                    selectedDoctorId === doctor.id
                      ? "border-[#6F855F] bg-[#6F855F] text-white"
                      : "border-[#D8D2C4] bg-white text-[#173B33] hover:border-[#6F855F]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#EEF0E8]">
                      {doctor.imageUrl ? (
                        <img
                          src={doctor.imageUrl}
                          alt={doctor.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound size={24} />
                      )}
                    </div>

                    <div>
                      <p className="font-semibold">
                        {doctor.name}
                      </p>

                      <p className="text-sm opacity-70">
                        {doctor.specialty ||
                          "Especialista"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {doctors.length === 0 && (
              <p className="text-sm text-[#6C7B72]">
                No hay especialistas disponibles
                para tu sucursal.
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="mb-6 font-serif text-2xl text-[#173B33]">
              Elegí la fecha
            </h2>

            {selectedDoctor && (
              <div className="mb-5 text-sm text-[#6C7B72]">
                Especialista seleccionado:{" "}
                <span className="font-semibold text-[#173B33]">
                  {selectedDoctor.name}
                </span>
              </div>
            )}

            <div className="border border-[#D8D2C4] p-4 md:p-6">
              <div className="mb-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={previousMonth}
                  className="border border-[#D8D2C4] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] md:px-4 md:text-xs"
                >
                  Anterior
                </button>

                <h3 className="text-center font-serif text-lg capitalize text-[#173B33] md:text-xl">
                  {monthName}
                </h3>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="border border-[#D8D2C4] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] md:px-4 md:text-xs"
                >
                  Siguiente
                </button>
              </div>

              <div className="mb-3 grid grid-cols-7 text-center text-[10px] uppercase tracking-[0.1em] text-[#7B916A] md:text-xs md:tracking-[0.2em]">
                <div>Dom</div>
                <div>Lun</div>
                <div>Mar</div>
                <div>Mié</div>
                <div>Jue</div>
                <div>Vie</div>
                <div>Sáb</div>
              </div>

              <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                {Array.from({
                  length: firstDayOfMonth,
                }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                  />
                ))}

                {Array.from({
                  length: daysInMonth,
                }).map((_, index) => {
                  const day = index + 1;
                  const date = formatDate(day);

                  const hasAvailability =
                    availableDates.includes(date);

                  const disabled =
                    isPastDate(day) ||
                    !hasAvailability;

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedTime("");
                        setStep(4);
                      }}
                      className={`h-10 border text-xs transition md:h-12 md:text-sm ${
                        selectedDate === date
                          ? "border-[#6F855F] bg-[#6F855F] text-white"
                          : disabled
                          ? "cursor-not-allowed border-gray-100 bg-gray-100 text-gray-300"
                          : "border-[#D8D2C4] bg-white text-[#173B33] hover:border-[#6F855F]"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="mb-6 font-serif text-2xl text-[#173B33]">
              Elegí el horario
            </h2>

            <div className="mb-5 grid gap-4 text-sm text-[#6C7B72] md:grid-cols-3">
              <SummaryCard
                icon={<CalendarDays size={18} />}
                title="Fecha"
                value={selectedDate}
              />

              <SummaryCard
                icon={<UserRound size={18} />}
                title="Especialista"
                value={
                  selectedDoctor?.name ||
                  "Especialista"
                }
              />

              <SummaryCard
                icon={<Clock size={18} />}
                title="Tratamiento"
                value={selectedTreatment}
              />
            </div>

            <div className="border border-[#D8D2C4] p-6">
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-[#7B916A]">
                Horarios disponibles
              </p>

              {loadingTimes ? (
                <p className="text-sm text-[#6C7B72]">
                  Cargando horarios...
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`border py-3 font-semibold transition ${
                        selectedTime === time
                          ? "border-[#6F855F] bg-[#6F855F] text-white"
                          : "border-[#D8D2C4] bg-white text-[#173B33] hover:border-[#6F855F]"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}

              {!loadingTimes &&
                availableTimes.length === 0 && (
                  <p className="text-sm text-[#6C7B72]">
                    No hay horarios cargados para
                    este especialista en esta fecha.
                  </p>
                )}
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-between gap-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                setStep(step - 1);
              }}
              className="border border-[#D8D2C4] px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#173B33] md:px-8"
            >
              Volver
            </button>
          ) : (
            <div />
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={confirmAppointment}
              disabled={!selectedTime || saving}
              className="bg-[#6F855F] px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#5F7450] disabled:cursor-not-allowed disabled:opacity-50 md:px-8"
            >
              {saving
                ? isRescheduling
                  ? "Guardando..."
                  : "Confirmando..."
                : isRescheduling
                ? "Guardar cambios"
                : "Confirmar turno"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="border border-[#D8D2C4] p-4">
      <div className="mb-2 text-[#7B916A]">
        {icon}
      </div>

      <p className="font-semibold text-[#173B33]">
        {title}
      </p>

      <p className="mt-1">{value}</p>
    </div>
  );
}