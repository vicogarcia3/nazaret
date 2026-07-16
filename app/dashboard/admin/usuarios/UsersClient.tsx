"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, UserRound, X } from "lucide-react";

type UserItem = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  lastLoginAt: Date | string | null;
};

function formatLastLogin(date: Date | string | null) {
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

  return loginDate.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function UsersClient({
  users,
  currentUser,
}: {
  users: UserItem[];
  currentUser: UserItem | null;
}) {
  const router = useRouter();

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const admins = users.filter((user) => user.role === "ADMIN");
  const doctors = users.filter((user) => user.role === "DOCTOR");
  const patients = users.filter((user) => user.role === "PATIENT");

  function openEdit(user: UserItem) {
    setSelectedUser(user);

    setForm({
      name: user.name || "",
      email: user.email,
      password: "",
    });
  }

  function closeEdit() {
    setSelectedUser(null);

    setForm({
      name: "",
      email: "",
      password: "",
    });
  }

  async function handleSave() {
    if (!selectedUser) return;

    const res = await fetch(`/api/users/${selectedUser.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "No se pudieron guardar los cambios.");
      return;
    }

    alert("Cambios guardados correctamente.");

    closeEdit();
    router.refresh();
  }

  return (
    <div>
      <h1 className="font-serif text-4xl font-medium leading-tight">
        Usuarios
      </h1>

      <p className="mt-2 text-sm text-[#5F6F6B]">
        Administrá todos los usuarios del sistema: administradores,
        odontólogos y pacientes.
      </p>

      <section className="mt-10 border border-[#DED9CD] bg-white p-8">
        <UserRound className="mb-5 h-5 w-5 text-[#A2B38B]" />

        <div className="grid gap-8 md:grid-cols-[1fr_1px_200px] md:items-center">
          <div>
            <h2 className="font-serif text-3xl text-[#12302A]">
              Mi cuenta
            </h2>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#A2B38B]">
                  Nombre
                </p>

                <p className="mt-1 text-lg text-[#12302A]">
                  {currentUser?.name || "Sin nombre"}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#A2B38B]">
                  Email
                </p>

                <p className="mt-1 text-[#12302A]">
                  {currentUser?.email || "Sin email"}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#A2B38B]">
                  Contraseña
                </p>

                <p className="mt-1 text-[#12302A]">
                  ************
                </p>
              </div>
            </div>
          </div>

          <div className="hidden h-full bg-[#DED9CD] md:block" />

          <div className="flex justify-start md:justify-center">
            <button
              type="button"
              onClick={() => currentUser && openEdit(currentUser)}
              disabled={!currentUser}
              className="flex items-center gap-3 bg-[#263F3B] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1d302d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Pencil className="h-4 w-4" />
              Editar datos
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8 border border-[#DED9CD] bg-white p-8">
        <h2 className="font-serif text-3xl text-[#12302A]">
          Todos los usuarios
        </h2>

        <div className="mt-6">
          <UserList title="Administradores" users={admins} />

          <UserList title="Odontólogos" users={doctors} />

          <UserList title="Pacientes" users={patients} />
        </div>
      </section>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg border border-[#DED9CD] bg-white p-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="font-serif text-3xl text-[#12302A]">
                  Editar mi cuenta
                </h2>

                <p className="mt-1 text-sm text-[#6B7774]">
                  Modificá tus datos de acceso.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                className="text-[#6B7774] transition hover:text-[#263F3B]"
                title="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 space-y-5">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Nombre
                </label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none transition focus:border-[#263F3B]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Email
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none transition focus:border-[#263F3B]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Nueva contraseña
                </label>

                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                  className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none transition focus:border-[#263F3B]"
                  placeholder="Dejar vacío para no cambiar"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEdit}
                className="border border-[#DED9CD] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] transition hover:bg-[#F7F5EF]"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="bg-[#263F3B] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1d302d]"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserList({
  title,
  users,
}: {
  title: string;
  users: UserItem[];
}) {
  return (
    <div className="border-t border-[#DED9CD] py-6">
      <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#A2B38B]">
        {title}
      </h3>

      {users.length === 0 ? (
        <p className="text-sm text-[#6B7774]">
          No hay usuarios cargados.
        </p>
      ) : (
        <ul className="space-y-3">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex min-h-14 items-center justify-between gap-6"
            >
              <div>
                <p className="text-[#12302A]">
                  {user.name || "Usuario sin nombre"}
                </p>

                <p className="text-sm text-[#6B7774]">
                  {user.email}
                </p>
              </div>

              {user.role === "PATIENT" && (
                <div className="ml-auto text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Último acceso
                  </p>

                  <p className="mt-1 text-sm text-[#6B7774]">
                    {formatLastLogin(user.lastLoginAt)}
                  </p>
                </div>
              )}

              {user.role === "DOCTOR" && (
                <button
                  type="button"
                  className="ml-auto flex h-10 w-10 items-center justify-center border border-[#F1D3D3] text-red-500 transition hover:bg-red-50"
                  title="Eliminar odontólogo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}