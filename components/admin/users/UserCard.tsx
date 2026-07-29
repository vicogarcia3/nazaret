"use client";

import {
  Clock3,
  Loader2,
  MapPin,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react";

import type {
  Branch,
  UserItem,
} from "@/components/admin/users/types";

function formatLastLogin(
    date: Date | string | null,
    isCurrenrUser = false
) {
  if (isCurrenrUser) {
    return "Activo ahora";
  }

  if (!date) return "Nunca";

  const loginDate = new Date(date);

  if (Number.isNaN(loginDate.getTime())) {
    return "Sin información";
  }

  const now = new Date();
  const diff = now.getTime() - loginDate.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Recién";
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours} h`;
  if (days === 1) return "Ayer";
  if (days < 30) return `Hace ${days} días`;

  return loginDate.toLocaleDateString("es-AR");
}

type UserCardProps = {
  user: UserItem;
  branches: Branch[];
  onEditDoctor?: (user: UserItem) => void;
  onDeleteDoctor?: (user: UserItem) => void;
  deletingDoctorId?: string | null;
  isCurrentUser?: boolean;
};

export default function UserCard({
  user,
  branches,
  onEditDoctor,
  onDeleteDoctor,
  deletingDoctorId,
  isCurrentUser = false,
}: UserCardProps) {
  const doctor = user.doctor;
  const isDoctor = user.role === "DOCTOR" && Boolean(doctor);
  const isDeleting = doctor?.id === deletingDoctorId;

  const doctorBranches = isDoctor
    ? branches.filter((branch) =>
        doctor?.branches.some(
          (doctorBranch) => doctorBranch.branchId === branch.id
        )
      )
    : [];

  return (
    <li className="border border-[#E4E0D7] bg-white p-5 transition hover:border-[#C8D2BC]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F1F4EC] text-[#879B75]">
            {doctor?.photo ? (
              <img
                src={doctor.photo}
                alt={user.name || "Especialista"}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium text-[#12302A]">
                {user.name || "Usuario sin nombre"}
              </p>

              {isDoctor && (
                <span
                  className={`inline-flex border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] ${
                    doctor?.active
                      ? "border-[#CBD8BF] bg-[#F1F5ED] text-[#5F7753]"
                      : "border-[#E3D8CC] bg-[#FAF4EE] text-[#9A684E]"
                  }`}
                >
                  {doctor?.active ? "Activo" : "Inactivo"}
                </span>
              )}
            </div>

            {doctor?.specialty && (
              <p className="mt-1 text-sm font-medium text-[#718665]">
                {doctor.specialty}
              </p>
            )}

            <p className="mt-1 break-all text-sm text-[#6B7774]">
              {user.email}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:justify-end">
          <div className="min-w-[130px]">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
              <Clock3 className="h-3.5 w-3.5" />
              Último acceso
            </p>

            <p className="mt-1 text-sm text-[#6B7774]">
              {formatLastLogin(user.lastLoginAt, isCurrentUser)}
            </p>
          </div>

          {isDoctor && onEditDoctor && onDeleteDoctor && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEditDoctor(user)}
                className="flex h-10 items-center gap-2 border border-[#CBD0C7] px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#42524F] transition hover:bg-[#F1F4EC]"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </button>

              <button
                type="button"
                onClick={() => onDeleteDoctor(user)}
                disabled={isDeleting}
                className="flex h-10 items-center gap-2 border border-[#F1D3D3] px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
