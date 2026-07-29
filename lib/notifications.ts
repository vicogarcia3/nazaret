import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CreateNotificationParams = {
  patientId: string;
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string;
  appointmentId?: string;
  budgetId?: string;
  paymentId?: string;
  clinicalHistoryId?: string;
};

export async function createNotification({
  patientId,
  title,
  message,
  type,
  actionUrl,
  appointmentId,
  budgetId,
  paymentId,
  clinicalHistoryId,
}: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      patientId,
      title,
      message,
      type,
      actionUrl,
      appointmentId,
      budgetId,
      paymentId,
      clinicalHistoryId,
    },
  });
}

/* =========================================================
   TURNOS
========================================================= */

export async function notifyAppointmentCreated({
  patientId,
  appointmentId,
  doctorName,
  date,
}: {
  patientId: string;
  appointmentId: string;
  doctorName: string;
  date: Date;
}) {
  return createNotification({
    patientId,
    title: "Turno reservado",
    message: `Tu turno con ${doctorName} fue reservado para el ${formatDateTime(
      date
    )}.`,
    type: NotificationType.APPOINTMENT,
    appointmentId,
    actionUrl: "/dashboard/patient/mis-turnos",
  });
}

export async function notifyAppointmentCancelled({
  patientId,
  appointmentId,
  doctorName,
  date,
}: {
  patientId: string;
  appointmentId: string;
  doctorName: string;
  date: Date;
}) {
  return createNotification({
    patientId,
    title: "Turno cancelado",
    message: `Tu turno con ${doctorName} del ${formatDateTime(
      date
    )} fue cancelado.`,
    type: NotificationType.APPOINTMENT,
    appointmentId,
    actionUrl: "/dashboard/patient/mis-turnos",
  });
}

export async function notifyAppointmentRescheduled({
  patientId,
  appointmentId,
  doctorName,
  previousDate,
  newDate,
}: {
  patientId: string;
  appointmentId: string;
  doctorName: string;
  previousDate: Date;
  newDate: Date;
}) {
  return createNotification({
    patientId,
    title: "Turno reprogramado",
    message: `Tu turno con ${doctorName} fue reprogramado del ${formatDateTime(
      previousDate
    )} al ${formatDateTime(newDate)}.`,
    type: NotificationType.APPOINTMENT,
    appointmentId,
    actionUrl: "/dashboard/patient/mis-turnos",
  });
}

export async function notifyAppointmentReminder({
  patientId,
  appointmentId,
  doctorName,
  date,
}: {
  patientId: string;
  appointmentId: string;
  doctorName: string;
  date: Date;
}) {
  return createNotification({
    patientId,
    title: "Recordatorio de turno",
    message: `Recordá que tenés un turno con ${doctorName} el ${formatDateTime(
      date
    )}.`,
    type: NotificationType.APPOINTMENT,
    appointmentId,
    actionUrl: "/dashboard/patient/mis-turnos",
  });
}

/* =========================================================
   PRESUPUESTOS
========================================================= */

export async function notifyBudgetCreated({
  patientId,
  budgetId,
}: {
  patientId: string;
  budgetId: string;
}) {
  return createNotification({
    patientId,
    title: "Nuevo presupuesto",
    message: "Tenés un nuevo presupuesto disponible para consultar.",
    type: NotificationType.BUDGET,
    budgetId,
    actionUrl: "/dashboard/patient/presupuestos",
  });
}

/* =========================================================
   PAGOS
========================================================= */

export async function notifyPaymentReceived({
  patientId,
  paymentId,
  amount,
  budgetId,
}: {
  patientId: string;
  paymentId: string;
  amount: number;
  budgetId?: string;
}) {
  return createNotification({
    patientId,
    title: "Pago registrado",
    message: `Se registró correctamente un pago de ${formatCurrency(amount)}.`,
    type: NotificationType.PAYMENT,
    paymentId,
    budgetId,
    actionUrl: "/dashboard/patient/pagos",
  });
}

export async function notifyPendingPayment({
  patientId,
  paymentId,
  amount,
  dueDate,
  budgetId,
}: {
  patientId: string;
  paymentId: string;
  amount: number;
  dueDate: Date;
  budgetId?: string;
}) {
  return createNotification({
    patientId,
    title: "Saldo pendiente",
    message: `Tenés un saldo pendiente de ${formatCurrency(
      amount
    )} con vencimiento el ${formatDate(dueDate)}.`,
    type: NotificationType.PAYMENT,
    paymentId,
    budgetId,
    actionUrl: "/dashboard/patient/pagos",
  });
}

/* =========================================================
   HISTORIA CLÍNICA
========================================================= */

export async function notifyClinicalHistoryUpdated({
  patientId,
  clinicalHistoryId,
}: {
  patientId: string;
  clinicalHistoryId: string;
}) {
  return createNotification({
    patientId,
    title: "Historia clínica actualizada",
    message: "El profesional realizó una actualización en tu historia clínica.",
    type: NotificationType.CLINICAL_HISTORY,
    clinicalHistoryId,
    actionUrl: "/dashboard/patient/historia-clinica",
  });
}

/* =========================================================
   FORMATO
========================================================= */

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
}