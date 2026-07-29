"use client";

import type {
  Branch,
  UserItem,
} from "@/components/admin/users/types";import UserCard from "./UserCard";

type UserListProps = {
  title: string;
  users: UserItem[];
  branches: Branch[];
  onEditDoctor?: (user: UserItem) => void;
  onDeleteDoctor?: (user: UserItem) => void;
  deletingDoctorId?: string | null;
  currentUserId?: string;
};

export default function UserList({
  title,
  users,
  branches,
  currentUserId,
  onEditDoctor,
  onDeleteDoctor,
  deletingDoctorId,
}: UserListProps) {
  return (
    <section className="border-t border-[#DED9CD] py-7">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#A2B38B]">
          {title}
        </h3>

        <span className="text-xs text-[#7A8682]">
          {users.length} {users.length === 1 ? "usuario" : "usuarios"}
        </span>
      </div>

      {users.length === 0 ? (
        <p className="border border-dashed border-[#DED9CD] p-5 text-sm text-[#6B7774]">
          No hay usuarios cargados.
        </p>
      ) : (
        <ul className="space-y-3">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              branches={branches}
              onEditDoctor={onEditDoctor}
              onDeleteDoctor={onDeleteDoctor}
              deletingDoctorId={deletingDoctorId}
              isCurrentUser={currentUserId === user.id}
            />
          ))}
        </ul>
      )}
    </section>
  );
}