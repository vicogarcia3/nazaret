"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, UserRound } from "lucide-react";

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

type AvailableTime = {
  time: string;
  available: boolean;
};

type Props = {
  treatments: Treatment[];
};

export default function ReservarTurnoClient({ treatments }: Props) {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [selectedTreatment, setSelectedTreatment] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableTimes, setAvailableTimes] = useState<AvailableTime[]>([]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [saving, setSaving] = useState(false);

  const steps = ["Tratamiento", "Especialista", "Fecha", "Horario"];

  useEffect(() => {
    async function loadDoctors() {
      const res = await fetch("/api/patient/doctors");
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        console.error("Error cargando doctores:", data);
        setDoctors([]);
        return;
      }

      setDoctors(data);
    }

    loadDoctors();
  }, []);

  useEffect(() => {
    async function loadTimes() {
      if (!selectedDoctorId || !selectedDate) return;

      setLoadingTimes(true);

      const res = await fetch(
        `/api/patient/available-times?doctorId=${selectedDoctorId}&date=${selectedDate}`
      );

      const data = await res.json();
      setAvailableTimes(data);
      setLoadingTimes(false);
    }

    loadTimes();
  }, [selectedDoctorId, selectedDate]);

  useEffect(() => {
    async function loadAvailableDates() {
      if (!selectedDoctorId) {
        setAvailableDates([]);
        return;
      }

      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      const res = await fetch(
        `/api/patient/available-dates?doctorId=${selectedDoctorId}&year=${year}&month=${month}`
      );

      const data = await res.json();

      setAvailableDates(Array.isArray(data) ? data : []);
    }

    loadAvailableDates();
  }, [selectedDoctorId, currentMonth]);

  const selectedDoctor = Array.isArray(doctors)
    ? doctors.find((doctor) => doctor.id === selectedDoctorId)
    : undefined;

  const sortedTreatments = useMemo(() => {
    return [...treatments].sort((a, b) => {
      const priceA = a.price ?? 999999999;
      const priceB = b.price ?? 999999999;
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

  const monthName = currentMonth.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  function formatDate(day: number) {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const dayFormatted = String(day).padStart(2, "0");

    return `${year}-${month}-${dayFormatted}`;
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
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  }

  function nextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  }

  async function confirmAppointment() {
    if (!selectedTreatment) {
      alert("Tenés que seleccionar un tratamiento.");
      return;
    }

    if (!selectedDoctorId) {
      alert("Tenés que seleccionar un especialista.");
      return;
    }

    if (!selectedDate || !selectedTime) {
      alert("Tenés que seleccionar fecha y horario.");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/patient/appointments", {
      method: "POST",
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

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "No se pudo reservar el turno.");
      setSaving(false);
      return;
    }

    router.push("/dashboard/patient/turnos");
  }

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[#6c7b72] mb-6"
      >
        <ArrowLeft size={16} />
        Volver
      </button>

      <div className="mb-8">
        <h1 className="text-4xl font-serif text-[#173b33]">
          Reservar turno
        </h1>
        <p className="text-[#6c7b72] mt-2">
          Elegí el tratamiento, especialista, fecha y horario para tu atención.
        </p>
      </div>

      <div className="border border-[#d8d2c4] bg-white p-8">
        <div className="grid grid-cols-4 gap-4 mb-10">
          {steps.map((item, index) => {
            const number = index + 1;
            const active = step === number;
            const completed = step > number;

            return (
              <div key={item} className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                    active || completed
                      ? "bg-[#1f3f36] text-white"
                      : "bg-[#eef0e8] text-[#6c7b72]"
                  }`}
                >
                  {number}
                </div>

                <span
                  className={`text-sm font-medium ${
                    active ? "text-[#1f3f36]" : "text-[#6c7b72]"
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
            <h2 className="text-2xl font-serif text-[#173b33] mb-6">
              Elegí el tratamiento
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {sortedTreatments.map((treatment) => (
                <button
                  key={treatment.id}
                  onClick={() => {
                    setSelectedTreatment(treatment.name);
                    setSelectedDoctorId("");
                    setSelectedDate("");
                    setSelectedTime("");
                    setStep(2);
                  }}
                  className={`border p-5 text-left transition ${
                    selectedTreatment === treatment.name
                      ? "bg-[#1f3f36] text-white border-[#1f3f36]"
                      : "bg-white text-[#173b33] border-[#d8d2c4] hover:border-[#1f3f36]"
                  }`}
                >
                  <h3 className="font-semibold">
                    {treatment.name}
                  </h3>

                  {treatment.description && (
                    <p className="text-sm opacity-70 mt-1">
                      {treatment.description}
                    </p>
                  )}

                  <p className="text-sm font-medium mt-3">
                    {treatment.price
                      ? `$${treatment.price.toLocaleString("es-AR")}`
                      : "Consultar precio"}
                  </p>
                </button>
              ))}

              <button
                onClick={() => {
                  setSelectedTreatment("Otro servicio");
                  setSelectedDoctorId("");
                  setSelectedDate("");
                  setSelectedTime("");
                  setStep(2);
                }}
                className={`border p-5 text-left transition ${
                  selectedTreatment === "Otro servicio"
                    ? "bg-[#1f3f36] text-white border-[#1f3f36]"
                    : "bg-white text-[#173b33] border-[#d8d2c4] hover:border-[#1f3f36]"
                }`}
              >
                <h3 className="font-semibold">
                  Otro servicio
                </h3>
                <p className="text-sm opacity-70 mt-1">
                  No encontré el tratamiento que necesito.
                </p>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-serif text-[#173b33] mb-6">
              Elegí el especialista
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  onClick={() => {
                    setSelectedDoctorId(doctor.id);
                    setSelectedDate("");
                    setSelectedTime("");
                    setAvailableTimes([]);
                    setStep(3);
                  }}
                  className={`border p-5 text-left transition ${
                    selectedDoctorId === doctor.id
                      ? "bg-[#1f3f36] text-white border-[#1f3f36]"
                      : "bg-white text-[#173b33] border-[#d8d2c4] hover:border-[#1f3f36]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#eef0e8] overflow-hidden flex items-center justify-center">
                      {doctor.imageUrl ? (
                        <img
                          src={doctor.imageUrl}
                          alt={doctor.name}
                          className="w-full h-full object-cover"
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
                        {doctor.specialty || "Especialista"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {doctors.length === 0 && (
              <p className="text-sm text-[#6c7b72]">
                No hay especialistas disponibles para tu sucursal.
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-serif text-[#173b33] mb-6">
              Elegí la fecha
            </h2>

            {selectedDoctor && (
              <div className="mb-5 text-sm text-[#6c7b72]">
                Especialista seleccionado:{" "}
                <span className="font-semibold text-[#173b33]">
                  {selectedDoctor.name}
                </span>
              </div>
            )}

            <div className="border border-[#d8d2c4] p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={previousMonth}
                  className="border border-[#d8d2c4] px-4 py-2 text-sm uppercase tracking-[0.2em]"
                >
                  Anterior
                </button>

                <h3 className="text-xl font-serif text-[#173b33] capitalize">
                  {monthName}
                </h3>

                <button
                  onClick={nextMonth}
                  className="border border-[#d8d2c4] px-4 py-2 text-sm uppercase tracking-[0.2em]"
                >
                  Siguiente
                </button>
              </div>

              <div className="grid grid-cols-7 text-center text-xs tracking-[0.2em] uppercase text-[#9caf88] mb-3">
                <div>Dom</div>
                <div>Lun</div>
                <div>Mar</div>
                <div>Mié</div>
                <div>Jue</div>
                <div>Vie</div>
                <div>Sáb</div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                  <div key={`empty-${index}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const date = formatDate(day);
                  const hasAvailability = availableDates.includes(date);
                  const disabled = isPastDate(day) || !hasAvailability;

                  return (
                    <button
                      key={day}
                      disabled={disabled}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedTime("");
                        setStep(4);
                      }}
                      className={`h-12 border text-sm transition ${
                        selectedDate === date
                          ? "bg-[#1f3f36] text-white border-[#1f3f36]"
                          : disabled
                          ? "bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed"
                          : "bg-white text-[#173b33] border-[#d8d2c4] hover:border-[#1f3f36]"
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
            <h2 className="text-2xl font-serif text-[#173b33] mb-6">
              Elegí el horario
            </h2>

            <div className="mb-5 grid md:grid-cols-3 gap-4 text-sm text-[#6c7b72]">
              <div className="border border-[#d8d2c4] p-4">
                <CalendarDays size={18} className="mb-2" />
                <p className="font-semibold text-[#173b33]">
                  Fecha
                </p>
                <p>{selectedDate}</p>
              </div>

              <div className="border border-[#d8d2c4] p-4">
                <UserRound size={18} className="mb-2" />
                <p className="font-semibold text-[#173b33]">
                  Especialista
                </p>
                <p>{selectedDoctor?.name}</p>
              </div>

              <div className="border border-[#d8d2c4] p-4">
                <Clock size={18} className="mb-2" />
                <p className="font-semibold text-[#173b33]">
                  Tratamiento
                </p>
                <p>{selectedTreatment}</p>
              </div>
            </div>

            <div className="border border-[#d8d2c4] p-6">
              <p className="text-xs tracking-[0.35em] uppercase text-[#9caf88] font-bold mb-5">
                Horarios disponibles
              </p>

              {loadingTimes ? (
                <p className="text-sm text-[#6c7b72]">
                  Cargando horarios...
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {availableTimes.map((slot) => (
                    <button
                      key={slot.time}
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`border py-3 font-semibold transition ${
                        selectedTime === slot.time
                          ? "bg-[#1f3f36] text-white border-[#1f3f36]"
                          : slot.available
                          ? "bg-white text-[#173b33] border-[#d8d2c4] hover:border-[#1f3f36]"
                          : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}

              {!loadingTimes && availableTimes.length === 0 && (
                <p className="text-sm text-[#6c7b72]">
                  No hay horarios cargados para este especialista en esta fecha.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between mt-10">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="border border-[#d8d2c4] px-8 py-3 text-xs font-bold tracking-[0.25em] uppercase text-[#173b33]"
            >
              Volver
            </button>
          ) : (
            <div />
          )}

          {step === 4 && (
            <button
              onClick={confirmAppointment}
              disabled={!selectedTime || saving}
              className="bg-[#1f3f36] text-white px-8 py-3 text-xs font-bold tracking-[0.25em] uppercase disabled:opacity-50"
            >
              {saving ? "Confirmando..." : "Confirmar turno"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}