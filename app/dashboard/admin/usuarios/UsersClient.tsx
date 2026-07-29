"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import DeleteDoctorDialog from "@/components/admin/users/DeleteDoctorDialog";
import EditDoctorModal from "@/components/admin/users/EditDoctorModal";
import UserList from "@/components/admin/users/UserList";
import type {
  Branch,
  UserItem,
} from "@/components/admin/users/types";

type SpecialistForm = {
  name: string;
  email: string;
  password: string;
  specialty: string;
  description: string;
  photo: string;
  active: boolean;
  branchIds: string[];
};

const EMPTY_SPECIALIST_FORM: SpecialistForm = {
  name: "",
  email: "",
  password: "",
  specialty: "",
  description: "",
  photo: "",
  active: true,
  branchIds: [],
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
}: {
  users: UserItem[];
  currentUser: UserItem | null;
  branches: Branch[];
}) {
  const router = useRouter();

  const [selectedUser, setSelectedUser] =
    useState<UserItem | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  const [accountForm, setAccountForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [specialistModalOpen, setSpecialistModalOpen] = useState(false);
  const [specialistForm, setSpecialistForm] =
    useState<SpecialistForm>(EMPTY_SPECIALIST_FORM);
  const [showSpecialistPassword, setShowSpecialistPassword] =
    useState(false);
  const [creatingSpecialist, setCreatingSpecialist] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [specialistError, setSpecialistError] = useState("");

  const [doctorToEdit, setDoctorToEdit] =
    useState<UserItem | null>(null);

  const [doctorToDelete, setDoctorToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [deletingDoctor, setDeletingDoctor] = useState(false);

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
    if (savingUser) return;

    setSelectedUser(null);
    setShowEditPassword(false);
    setAccountForm({
      name: "",
      email: "",
      password: "",
    });
  }

  async function handleSaveAccount() {
    if (!selectedUser) return;

    try {
      setSavingUser(true);

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: accountForm.name.trim(),
          email: accountForm.email.trim().toLowerCase(),
          password: accountForm.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudieron guardar los cambios."
        );
      }

      toast.success("Cambios guardados correctamente.");
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

  function openSpecialistModal() {
    setSpecialistError("");
    setShowSpecialistPassword(false);
    setSpecialistForm({
      ...EMPTY_SPECIALIST_FORM,
      password: "",
    });
    setSpecialistModalOpen(true);
  }

  function closeSpecialistModal() {
    if (creatingSpecialist || uploadingPhoto) return;

    setSpecialistModalOpen(false);
    setSpecialistError("");
    setShowSpecialistPassword(false);
    setSpecialistForm(EMPTY_SPECIALIST_FORM);
  }

  function toggleBranch(branchId: string) {
    setSpecialistForm((current) => ({
      ...current,
      branchIds: current.branchIds.includes(branchId)
        ? current.branchIds.filter((id) => id !== branchId)
        : [...current.branchIds, branchId],
    }));
  }

  async function handlePhotoUpload(file: File) {
    try {
      setUploadingPhoto(true);
      setSpecialistError("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "No se pudo subir la imagen.");
      }

      setSpecialistForm((current) => ({
        ...current,
        photo: data.url,
      }));

      toast.success("Imagen cargada correctamente.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo subir la imagen.";

      setSpecialistError(message);
      toast.error(message);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleCreateSpecialist() {
    setSpecialistError("");

    if (!specialistForm.name.trim()) {
      setSpecialistError("Ingresá el nombre completo.");
      return;
    }

    if (!specialistForm.email.trim()) {
      setSpecialistError("Ingresá el correo electrónico.");
      return;
    }

    if (specialistForm.password.length < 8) {
      setSpecialistError(
        "La contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (specialistForm.branchIds.length === 0) {
      setSpecialistError("Seleccioná al menos una sucursal.");
      return;
    }

    try {
      setCreatingSpecialist(true);

      const response = await fetch("/api/doctors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: specialistForm.name.trim(),
          email: specialistForm.email.trim().toLowerCase(),
          password: specialistForm.password,
          specialty: specialistForm.specialty.trim() || null,
          description: specialistForm.description.trim() || null,
          photo: specialistForm.photo || null,
          active: specialistForm.active,
          branchIds: specialistForm.branchIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudo crear el especialista."
        );
      }

      setSpecialistModalOpen(false);
      setSpecialistForm(EMPTY_SPECIALIST_FORM);

      toast.success("Especialista creado correctamente.");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo crear el especialista.";

      setSpecialistError(message);
      toast.error(message);
    } finally {
      setCreatingSpecialist(false);
    }
  }

  function requestDeleteDoctor(user: UserItem) {
    if (!user.doctor) return;

    setDoctorToDelete({
      id: user.doctor.id,
      name: user.name || "Especialista",
    });
  }

  async function handleDeleteDoctor() {
    if (!doctorToDelete) return;

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
          data.error || "No se pudo eliminar el especialista."
        );
      }

      toast.success(
        data.message || "Especialista eliminado correctamente."
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
            Administrá todos los usuarios del sistema: administradores,
            odontólogos y pacientes.
          </p>
        </div>

        <button
          type="button"
          onClick={openSpecialistModal}
          className="flex items-center justify-center gap-2 bg-[#263F3B] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1D302D]"
        >
          <Plus className="h-4 w-4" />
          Crear usuario especialista
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
                value={currentUser?.name || "Sin nombre"}
              />
              <AccountField
                label="Email"
                value={currentUser?.email || "Sin email"}
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
                currentUser && openAccountEdit(currentUser)
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
              deletingDoctor ? doctorToDelete?.id ?? null : null
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

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Nueva contraseña
                </label>

                <div className="relative mt-2">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={accountForm.password}
                    onChange={(event) =>
                      setAccountForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    className="w-full border border-[#DED9CD] bg-white p-3 pr-12 outline-none transition focus:border-[#263F3B]"
                    placeholder="Dejar vacío para no cambiar"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowEditPassword((current) => !current)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7774]"
                  >
                    {showEditPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
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

      {specialistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6">
          <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto border border-[#DED9CD] bg-white">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-6 border-b border-[#DED9CD] bg-white p-7">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A2B38B]">
                  Nuevo usuario profesional
                </p>

                <h2 className="mt-2 font-serif text-3xl text-[#12302A]">
                  Crear especialista
                </h2>

                <p className="mt-2 text-sm text-[#6B7774]">
                  Ingresá sus datos personales, profesionales y de acceso.
                </p>
              </div>

              <button
                type="button"
                onClick={closeSpecialistModal}
                disabled={creatingSpecialist || uploadingPhoto}
                className="text-[#6B7774] transition hover:text-[#263F3B] disabled:opacity-50"
                title="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-8 p-7">
              {specialistError && (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {specialistError}
                </div>
              )}

              <section>
                <SectionTitle
                  title="Datos de acceso"
                  description="El especialista usará este correo y contraseña para ingresar."
                />

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <TextField
                    label="Nombre completo"
                    value={specialistForm.name}
                    placeholder="Ejemplo: Dra. María Pérez"
                    onChange={(value) =>
                      setSpecialistForm((current) => ({
                        ...current,
                        name: value,
                      }))
                    }
                  />

                  <TextField
                    label="Correo electrónico"
                    type="email"
                    value={specialistForm.email}
                    placeholder="especialista@correo.com"
                    onChange={(value) =>
                      setSpecialistForm((current) => ({
                        ...current,
                        email: value,
                      }))
                    }
                  />
                </div>

                <div className="mt-5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Contraseña inicial
                  </label>

                  <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <div className="relative">
                      <input
                        type={
                          showSpecialistPassword
                            ? "text"
                            : "password"
                        }
                        value={specialistForm.password}
                        onChange={(event) =>
                          setSpecialistForm((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                        className="w-full border border-[#DED9CD] bg-white p-3 pr-12 outline-none transition focus:border-[#263F3B]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowSpecialistPassword(
                            (current) => !current
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7774]"
                      >
                        {showSpecialistPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSpecialistForm((current) => ({
                          ...current,
                          password: generatePassword(
                            specialistForm.name
                          ),
                        }))
                      }
                      className="border border-[#DED9CD] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#263F3B] transition hover:bg-[#F7F5EF]"
                    >
                      Generar aleatoriamente
                    </button>
                  </div>
                </div>
              </section>

              <section className="border-t border-[#DED9CD] pt-8">
                <SectionTitle
                  title="Perfil profesional"
                  description="Información visible dentro del sistema."
                />

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <TextField
                    label="Especialidad"
                    value={specialistForm.specialty}
                    placeholder="Ejemplo: Odontología general"
                    onChange={(value) =>
                      setSpecialistForm((current) => ({
                        ...current,
                        specialty: value,
                      }))
                    }
                  />

                  <label className="mt-7 flex items-center justify-between border border-[#DED9CD] px-4 py-3">
                    <span>
                      <span className="block text-sm font-medium text-[#12302A]">
                        Especialista activo
                      </span>
                      <span className="mt-1 block text-xs text-[#6B7774]">
                        Podrá utilizar el portal profesional.
                      </span>
                    </span>

                    <input
                      type="checkbox"
                      checked={specialistForm.active}
                      onChange={(event) =>
                        setSpecialistForm((current) => ({
                          ...current,
                          active: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-[#263F3B]"
                    />
                  </label>
                </div>

                <div className="mt-5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Descripción
                  </label>

                  <textarea
                    value={specialistForm.description}
                    onChange={(event) =>
                      setSpecialistForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={4}
                    className="mt-2 w-full resize-none border border-[#DED9CD] bg-white p-3 outline-none transition focus:border-[#263F3B]"
                    placeholder="Experiencia, formación o presentación profesional..."
                  />
                </div>

                <div className="mt-5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Foto
                  </label>

                  <div className="mt-2 flex flex-col gap-4 border border-[#DED9CD] p-4 sm:flex-row sm:items-center">
                    {specialistForm.photo ? (
                      <img
                        src={specialistForm.photo}
                        alt="Vista previa"
                        className="h-20 w-20 rounded-full border border-[#DED9CD] object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F1F4EC] text-[#A2B38B]">
                        <UserRound className="h-7 w-7" />
                      </div>
                    )}

                    <div>
                      <label className="inline-flex cursor-pointer items-center gap-2 bg-[#263F3B] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#1D302D]">
                        {uploadingPhoto ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}

                        {uploadingPhoto ? "Subiendo" : "Subir imagen"}

                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingPhoto}
                          onChange={(event) => {
                            const file = event.target.files?.[0];

                            if (file) {
                              handlePhotoUpload(file);
                            }

                            event.target.value = "";
                          }}
                        />
                      </label>

                      {specialistForm.photo && (
                        <button
                          type="button"
                          onClick={() =>
                            setSpecialistForm((current) => ({
                              ...current,
                              photo: "",
                            }))
                          }
                          className="ml-3 text-sm text-red-600 hover:underline"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="border-t border-[#DED9CD] pt-8">
                <SectionTitle
                  title="Sucursales"
                  description="Seleccioná al menos una sede donde atenderá."
                />

                <div className="mt-5 grid gap-3">
                  {branches.map((branch) => {
                    const selected =
                      specialistForm.branchIds.includes(branch.id);

                    return (
                      <label
                        key={branch.id}
                        className={`flex cursor-pointer items-start justify-between gap-4 border p-4 transition ${
                          selected
                            ? "border-[#A2B38B] bg-[#F4F6F0]"
                            : "border-[#DED9CD] bg-white hover:border-[#A2B38B]"
                        }`}
                      >
                        <div>
                          <p className="font-medium text-[#12302A]">
                            {branch.name}
                          </p>

                          <p className="mt-1 text-sm text-[#6B7774]">
                            {branch.address}, {branch.city}
                          </p>
                        </div>

                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleBranch(branch.id)}
                          className="mt-1 h-4 w-4 accent-[#263F3B]"
                        />
                      </label>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-[#DED9CD] bg-white p-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeSpecialistModal}
                disabled={creatingSpecialist || uploadingPhoto}
                className="border border-[#DED9CD] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] transition hover:bg-[#F7F5EF] disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleCreateSpecialist}
                disabled={creatingSpecialist || uploadingPhoto}
                className="flex items-center justify-center gap-2 bg-[#263F3B] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1D302D] disabled:opacity-50"
              >
                {creatingSpecialist && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Crear especialista
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none transition focus:border-[#263F3B]"
      />
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="font-serif text-2xl text-[#12302A]">
        {title}
      </h3>

      <p className="mt-1 text-sm text-[#6B7774]">
        {description}
      </p>
    </div>
  );
}
