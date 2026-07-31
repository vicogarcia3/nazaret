"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import DeleteDoctorDialog from "@/components/admin/users/DeleteDoctorDialog";
import EditDoctorModal from "@/components/admin/users/EditDoctorModal";
import UserList from "@/components/admin/users/UserList";
import type {
  AvailableDoctor,
  Branch,
  UserItem,
} from "@/components/admin/users/types";

type AccountRole = "ADMIN" | "DOCTOR";

type NewAccountForm = {
  role: AccountRole;
  doctorId: string;
  name: string;
  email: string;
  password: string;
};

const EMPTY_ACCOUNT_FORM: NewAccountForm = {
  role: "DOCTOR",
  doctorId: "",
  name: "",
  email: "",
  password: "",
};

function generatePassword(name?: string) {
  const random = Math.floor(1000 + Math.random() * 9000);

  const firstName =
    name
      ?.trim()
      .split(" ")[0]
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z]/g, "")
      .toLowerCase() || "usuario";

  return `${firstName}${random}`;
}

export default function UsersClient({
  users,
  currentUser,
  branches,
  availableDoctors,
}: {
  users: UserItem[];
  currentUser: UserItem | null;
  branches: Branch[];
  availableDoctors: AvailableDoctor[];
}) {
  const router = useRouter();

  const [selectedUser, setSelectedUser] =
    useState<UserItem | null>(null);

  const [showEditPassword, setShowEditPassword] =
    useState(false);

  const [savingUser, setSavingUser] =
    useState(false);

  const [accountForm, setAccountForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [newAccountModalOpen, setNewAccountModalOpen] =
    useState(false);

  const [newAccountForm, setNewAccountForm] =
    useState<NewAccountForm>(EMPTY_ACCOUNT_FORM);

  const [showNewAccountPassword, setShowNewAccountPassword] =
    useState(false);

  const [creatingAccount, setCreatingAccount] =
    useState(false);

  const [newAccountError, setNewAccountError] =
    useState("");

  const [doctorToEdit, setDoctorToEdit] =
    useState<UserItem | null>(null);

  const [doctorToDelete, setDoctorToDelete] =
    useState<{
      id: string;
      name: string;
    } | null>(null);

  const [deletingDoctor, setDeletingDoctor] =
    useState(false);

  const admins = useMemo(
    () => users.filter((user) => user.role === "ADMIN"),
    [users]
  );

  const doctors = useMemo(
    () => users.filter((user) => user.role === "DOCTOR"),
    [users]
  );

  const patients = useMemo(
    () => users.filter((user) => user.role === "PATIENT"),
    [users]
  );

  function openAccountEdit(user: UserItem) {
    setSelectedUser(user);
    setShowEditPassword(false);

    setAccountForm({
      name: user.name || "",
      email: user.email,
      password: "",
    });
  }

  function closeAccountEdit() {
    if (savingUser) {
      return;
    }

    setSelectedUser(null);
    setShowEditPassword(false);

    setAccountForm({
      name: "",
      email: "",
      password: "",
    });
  }

  async function handleSaveAccount() {
    if (!selectedUser) {
      return;
    }

    try {
      setSavingUser(true);

      const response = await fetch(
        `/api/users/${selectedUser.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: accountForm.name.trim(),
            email: accountForm.email
              .trim()
              .toLowerCase(),
            password: accountForm.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudieron guardar los cambios."
        );
      }

      toast.success(
        "Cambios guardados correctamente."
      );

      setSelectedUser(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los cambios."
      );
    } finally {
      setSavingUser(false);
    }
  }

  function openNewAccountModal() {
    setNewAccountError("");
    setShowNewAccountPassword(false);
    setNewAccountForm(EMPTY_ACCOUNT_FORM);
    setNewAccountModalOpen(true);
  }

  function closeNewAccountModal() {
    if (creatingAccount) {
      return;
    }

    setNewAccountModalOpen(false);
    setNewAccountError("");
    setShowNewAccountPassword(false);
    setNewAccountForm(EMPTY_ACCOUNT_FORM);
  }

  function handleRoleChange(role: AccountRole) {
    setNewAccountError("");

    setNewAccountForm({
      role,
      doctorId: "",
      name: "",
      email: "",
      password: "",
    });
  }

  function handleDoctorSelection(doctorId: string) {
    const selectedDoctor = availableDoctors.find(
      (doctor) => doctor.id === doctorId
    );

    setNewAccountForm((current) => ({
      ...current,
      doctorId,
      name: selectedDoctor?.name || "",
    }));
  }

  async function handleCreateAccount() {
    setNewAccountError("");

    const name = newAccountForm.name.trim();
    const email = newAccountForm.email
      .trim()
      .toLowerCase();

    if (
      newAccountForm.role === "DOCTOR" &&
      !newAccountForm.doctorId
    ) {
      setNewAccountError(
        "Seleccioná un especialista de Equipo."
      );
      return;
    }

    if (!name) {
      setNewAccountError(
        "Ingresá el nombre completo."
      );
      return;
    }

    if (!email) {
      setNewAccountError(
        "Ingresá el correo electrónico."
      );
      return;
    }

    if (newAccountForm.password.length < 8) {
      setNewAccountError(
        "La contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    try {
      setCreatingAccount(true);

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: newAccountForm.role,
          doctorId:
            newAccountForm.role === "DOCTOR"
              ? newAccountForm.doctorId
              : null,
          name,
          email,
          password: newAccountForm.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo crear la cuenta."
        );
      }

      setNewAccountModalOpen(false);
      setNewAccountForm(EMPTY_ACCOUNT_FORM);

      toast.success(
        "Cuenta creada correctamente."
      );

      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo crear la cuenta.";

      setNewAccountError(message);
      toast.error(message);
    } finally {
      setCreatingAccount(false);
    }
  }

  function requestDeleteDoctor(user: UserItem) {
    if (!user.doctor) {
      return;
    }

    setDoctorToDelete({
      id: user.doctor.id,
      name:
        user.doctor.name ||
        user.name ||
        "Especialista",
    });
  }

  async function handleDeleteDoctor() {
    if (!doctorToDelete) {
      return;
    }

    try {
      setDeletingDoctor(true);

      const response = await fetch(
        `/api/doctors/${doctorToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo eliminar el especialista."
        );
      }

      toast.success(
        data.message ||
          "Especialista eliminado correctamente."
      );

      setDoctorToDelete(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el especialista."
      );
    } finally {
      setDeletingDoctor(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-medium leading-tight">
            Usuarios
          </h1>

          <p className="mt-2 text-sm text-[#5F6F6B]">
            Administrá las cuentas que tienen acceso al
            sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewAccountModal}
          className="flex items-center justify-center gap-2 bg-[#263F3B] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1D302D]"
        >
          <Plus className="h-4 w-4" />
          Crear usuario
        </button>
      </div>

      <section className="mt-10 border border-[#DED9CD] bg-white p-8">
        <UserRound className="mb-5 h-5 w-5 text-[#A2B38B]" />

        <div className="grid gap-8 md:grid-cols-[1fr_1px_200px] md:items-center">
          <div>
            <h2 className="font-serif text-3xl text-[#12302A]">
              Mi cuenta
            </h2>

            <div className="mt-6 space-y-4">
              <AccountField
                label="Nombre"
                value={
                  currentUser?.name || "Sin nombre"
                }
              />

              <AccountField
                label="Email"
                value={
                  currentUser?.email || "Sin email"
                }
              />

              <AccountField
                label="Contraseña"
                value="************"
              />
            </div>
          </div>

          <div className="hidden h-full bg-[#DED9CD] md:block" />

          <div className="flex justify-start md:justify-center">
            <button
              type="button"
              onClick={() =>
                currentUser &&
                openAccountEdit(currentUser)
              }
              disabled={!currentUser}
              className="flex items-center gap-3 bg-[#263F3B] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1D302D] disabled:cursor-not-allowed disabled:opacity-50"
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
          <UserList
            title="Administradores"
            users={admins}
            branches={branches}
            currentUserId={currentUser?.id}
          />

          <UserList
            title="Odontólogos"
            users={doctors}
            branches={branches}
            currentUserId={currentUser?.id}
            onEditDoctor={setDoctorToEdit}
            onDeleteDoctor={requestDeleteDoctor}
            deletingDoctorId={
              deletingDoctor
                ? doctorToDelete?.id ?? null
                : null
            }
          />

          <UserList
            title="Pacientes"
            users={patients}
            branches={branches}
            currentUserId={currentUser?.id}
          />
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
                onClick={closeAccountEdit}
                className="text-[#6B7774] transition hover:text-[#263F3B]"
                title="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 space-y-5">
              <TextField
                label="Nombre"
                value={accountForm.name}
                onChange={(value) =>
                  setAccountForm((current) => ({
                    ...current,
                    name: value,
                  }))
                }
              />

              <TextField
                label="Email"
                type="email"
                value={accountForm.email}
                onChange={(value) =>
                  setAccountForm((current) => ({
                    ...current,
                    email: value,
                  }))
                }
              />

              <PasswordField
                label="Nueva contraseña"
                value={accountForm.password}
                visible={showEditPassword}
                placeholder="Dejar vacío para no cambiar"
                onToggleVisibility={() =>
                  setShowEditPassword(
                    (current) => !current
                  )
                }
                onChange={(value) =>
                  setAccountForm((current) => ({
                    ...current,
                    password: value,
                  }))
                }
              />
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAccountEdit}
                disabled={savingUser}
                className="border border-[#DED9CD] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] transition hover:bg-[#F7F5EF] disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveAccount}
                disabled={savingUser}
                className="flex items-center gap-2 bg-[#263F3B] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1D302D] disabled:opacity-50"
              >
                {savingUser && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {newAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6">
          <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto border border-[#DED9CD] bg-white">
            <div className="flex items-start justify-between gap-6 border-b border-[#DED9CD] p-7">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A2B38B]">
                  Nueva cuenta
                </p>

                <h2 className="mt-2 font-serif text-3xl text-[#12302A]">
                  Crear usuario
                </h2>

                <p className="mt-2 text-sm text-[#6B7774]">
                  Creá una cuenta de acceso al sistema.
                </p>
              </div>

              <button
                type="button"
                onClick={closeNewAccountModal}
                disabled={creatingAccount}
                className="text-[#6B7774] transition hover:text-[#263F3B] disabled:opacity-50"
                title="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-7">
              {newAccountError && (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {newAccountError}
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Tipo de usuario
                </label>

                <select
                  value={newAccountForm.role}
                  onChange={(event) =>
                    handleRoleChange(
                      event.target.value as AccountRole
                    )
                  }
                  className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none transition focus:border-[#263F3B]"
                >
                  <option value="DOCTOR">
                    Especialista
                  </option>

                  <option value="ADMIN">
                    Administrador
                  </option>
                </select>
              </div>

              {newAccountForm.role === "DOCTOR" && (
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Especialista de Equipo
                  </label>

                  <select
                    value={newAccountForm.doctorId}
                    onChange={(event) =>
                      handleDoctorSelection(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none transition focus:border-[#263F3B]"
                  >
                    <option value="">
                      Seleccionar especialista
                    </option>

                    {availableDoctors.map((doctor) => (
                      <option
                        key={doctor.id}
                        value={doctor.id}
                      >
                        {doctor.name ||
                          "Especialista sin nombre"}
                        {doctor.specialty
                          ? ` — ${doctor.specialty}`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {availableDoctors.length === 0 && (
                    <p className="mt-2 text-sm text-[#6B7774]">
                      Todos los especialistas de Equipo ya
                      tienen una cuenta asociada.
                    </p>
                  )}
                </div>
              )}

              <TextField
                label="Nombre completo"
                value={newAccountForm.name}
                placeholder="Nombre del usuario"
                disabled={
                  newAccountForm.role === "DOCTOR"
                }
                onChange={(value) =>
                  setNewAccountForm((current) => ({
                    ...current,
                    name: value,
                  }))
                }
              />

              <TextField
                label="Correo electrónico"
                type="email"
                value={newAccountForm.email}
                placeholder="usuario@correo.com"
                onChange={(value) =>
                  setNewAccountForm((current) => ({
                    ...current,
                    email: value,
                  }))
                }
              />

              <PasswordField
                label="Contraseña inicial"
                value={newAccountForm.password}
                visible={showNewAccountPassword}
                onToggleVisibility={() =>
                  setShowNewAccountPassword(
                    (current) => !current
                  )
                }
                onChange={(value) =>
                  setNewAccountForm((current) => ({
                    ...current,
                    password: value,
                  }))
                }
              />

              <button
                type="button"
                onClick={() =>
                  setNewAccountForm((current) => ({
                    ...current,
                    password: generatePassword(
                      current.name
                    ),
                  }))
                }
                className="border border-[#DED9CD] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#263F3B] transition hover:bg-[#F7F5EF]"
              >
                Generar contraseña aleatoria
              </button>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#DED9CD] bg-white p-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeNewAccountModal}
                disabled={creatingAccount}
                className="border border-[#DED9CD] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] transition hover:bg-[#F7F5EF] disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleCreateAccount}
                disabled={
                  creatingAccount ||
                  (newAccountForm.role === "DOCTOR" &&
                    availableDoctors.length === 0)
                }
                className="flex items-center justify-center gap-2 bg-[#263F3B] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1D302D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingAccount && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Crear cuenta
              </button>
            </div>
          </div>
        </div>
      )}

      <EditDoctorModal
        open={Boolean(doctorToEdit)}
        user={doctorToEdit}
        branches={branches}
        onClose={() => setDoctorToEdit(null)}
        onSaved={() => router.refresh()}
      />

      <DeleteDoctorDialog
        doctor={doctorToDelete}
        loading={deletingDoctor}
        onConfirm={handleDeleteDoctor}
        onCancel={() => {
          if (!deletingDoctor) {
            setDoctorToDelete(null);
          }
        }}
      />
    </div>
  );
}

function AccountField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#A2B38B]">
        {label}
      </p>

      <p className="mt-1 text-lg text-[#12302A]">
        {value}
      </p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none transition focus:border-[#263F3B] disabled:cursor-not-allowed disabled:bg-[#F4F4F1] disabled:text-[#6B7774]"
      />
    </div>
  );
}

function PasswordField({
  label,
  value,
  visible,
  onChange,
  onToggleVisibility,
  placeholder,
}: {
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
        {label}
      </label>

      <div className="relative mt-2">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className="w-full border border-[#DED9CD] bg-white p-3 pr-12 outline-none transition focus:border-[#263F3B]"
        />

        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7774]"
          title={
            visible
              ? "Ocultar contraseña"
              : "Mostrar contraseña"
          }
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}