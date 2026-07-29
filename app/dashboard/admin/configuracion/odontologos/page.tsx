"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Stethoscope,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

type Branch = {
  id: string;
  name: string;
  city: string;
  address: string;
  active?: boolean;
};

type Doctor = {
  id: string;
  specialty: string | null;
  description: string | null;
  photo: string | null;
  active: boolean;

  user: {
    id?: string;
    name: string;
    email: string;
    lastLoginAt?: string | null;
  };

  branches: Array<{
    branch: Branch;
  }>;

  _count?: {
    patients?: number;
    appointments?: number;
  };
};

type DoctorForm = {
  name: string;
  email: string;
  password: string;
  specialty: string;
  description: string;
  photo: string;
  active: boolean;
  branchIds: string[];
};

const EMPTY_FORM: DoctorForm = {
  name: "",
  email: "",
  password: "",
  specialty: "",
  description: "",
  photo: "",
  active: true,
  branchIds: [],
};

const SPECIALTIES = [
  "Odontología general",
  "Ortodoncia",
  "Implantología",
  "Endodoncia",
  "Odontopediatría",
  "Cirugía",
  "Prótesis",
  "Estética dental",
  "Periodoncia",
  "Otra",
];

function createTemporaryPassword() {
  const randomNumber = Math.floor(1000 + Math.random() * 9000);

  return `Nazaret@${randomNumber}`;
}

function formatLastLogin(date?: string | null) {
  if (!date) {
    return "Nunca ingresó";
  }

  const loginDate = new Date(date);

  if (Number.isNaN(loginDate.getTime())) {
    return "Sin información";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(loginDate);
}

export default function OdontologosPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<DoctorForm>(EMPTY_FORM);

  const [showPassword, setShowPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [doctorsResponse, branchesResponse] = await Promise.all([
        fetch("/api/doctors", {
          cache: "no-store",
        }),
        fetch("/api/branches", {
          cache: "no-store",
        }),
      ]);

      const doctorsData = await doctorsResponse.json();
      const branchesData = await branchesResponse.json();

      if (!doctorsResponse.ok) {
        throw new Error(
          doctorsData.error || "No se pudieron cargar los odontólogos."
        );
      }

      if (!branchesResponse.ok) {
        throw new Error(
          branchesData.error || "No se pudieron cargar las sucursales."
        );
      }

      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
    } catch (loadError) {
      console.error(loadError);

      setDoctors([]);
      setBranches([]);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar la información."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredDoctors = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const searchableText = [
        doctor.user.name,
        doctor.user.email,
        doctor.specialty || "",
        doctor.description || "",
        ...doctor.branches.map((item) => item.branch.name),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch === "" ||
        searchableText.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && doctor.active) ||
        (statusFilter === "INACTIVE" && !doctor.active);

      return matchesSearch && matchesStatus;
    });
  }, [doctors, search, statusFilter]);

  const activeDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.active).length,
    [doctors]
  );

  const inactiveDoctors = doctors.length - activeDoctors;

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
  }

  function openCreateDrawer() {
    resetMessages();
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
      password: createTemporaryPassword(),
    });

    setShowPassword(false);
    setDrawerOpen(true);
  }

  function openEditDrawer(doctor: Doctor) {
    resetMessages();
    setEditingId(doctor.id);

    setForm({
      name: doctor.user.name,
      email: doctor.user.email,
      password: "",
      specialty: doctor.specialty || "",
      description: doctor.description || "",
      photo: doctor.photo || "",
      active: doctor.active,
      branchIds: doctor.branches.map((item) => item.branch.id),
    });

    setShowPassword(false);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (saving || uploadingPhoto) {
      return;
    }

    setDrawerOpen(false);
    resetForm();
  }

  function updateForm<K extends keyof DoctorForm>(
    field: K,
    value: DoctorForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleBranch(branchId: string) {
    setForm((current) => {
      const isSelected = current.branchIds.includes(branchId);

      return {
        ...current,
        branchIds: isSelected
          ? current.branchIds.filter((id) => id !== branchId)
          : [...current.branchIds, branchId],
      };
    });
  }

  function selectAllBranches() {
    setForm((current) => ({
      ...current,
      branchIds: branches.map((branch) => branch.id),
    }));
  }

  function clearBranches() {
    setForm((current) => ({
      ...current,
      branchIds: [],
    }));
  }

  async function copyPassword() {
    if (!form.password) {
      return;
    }

    try {
      await navigator.clipboard.writeText(form.password);
      setSuccess("Contraseña copiada.");
    } catch {
      setError("No se pudo copiar la contraseña.");
    }
  }

  async function uploadPhoto(file: File) {
    try {
      setUploadingPhoto(true);
      setError("");

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

      updateForm("photo", data.url);
    } catch (uploadError) {
      console.error(uploadError);

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo subir la imagen."
      );
    } finally {
      setUploadingPhoto(false);
    }
  }

  function validateForm() {
    if (!form.name.trim()) {
      return "Ingresá el nombre completo.";
    }

    if (!form.email.trim()) {
      return "Ingresá el correo electrónico.";
    }

    if (!editingId && form.password.length < 8) {
      return "La contraseña inicial debe tener al menos 8 caracteres.";
    }

    if (form.branchIds.length === 0) {
      return "Seleccioná al menos una sucursal.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      resetMessages();

      const isEditing = Boolean(editingId);
      const endpoint = isEditing
        ? `/api/doctors/${editingId}`
        : "/api/doctors";

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          specialty: form.specialty.trim() || null,
          description: form.description.trim() || null,
          photo: form.photo || null,
          active: form.active,
          branchIds: form.branchIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            (isEditing
              ? "No se pudo actualizar el odontólogo."
              : "No se pudo crear el odontólogo.")
        );
      }

      await loadData();

      setDrawerOpen(false);
      resetForm();

      setSuccess(
        isEditing
          ? "Odontólogo actualizado correctamente."
          : "Cuenta de odontólogo creada correctamente."
      );
    } catch (submitError) {
      console.error(submitError);

      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar el odontólogo."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(doctor: Doctor) {
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar a ${doctor.user.name}? Esta acción puede afectar sus turnos, pacientes y presupuestos asociados.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(doctor.id);
      resetMessages();

      const response = await fetch(`/api/doctors/${doctor.id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudo eliminar el odontólogo."
        );
      }

      setDoctors((current) =>
        current.filter((item) => item.id !== doctor.id)
      );

      setSuccess("Odontólogo eliminado correctamente.");
    } catch (deleteError) {
      console.error(deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No se pudo eliminar el odontólogo."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F5EF] px-4 py-6 text-[#263F3B] sm:px-6 md:px-10 md:py-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#8FA07F]">
              Configuración
            </p>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
              Odontólogos
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B7774]">
              Creá cuentas profesionales, asigná sucursales y administrá el
              acceso de cada especialista al sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateDrawer}
            className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#263F3B] px-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#1D302D]"
          >
            <Plus className="h-4 w-4" />
            Nuevo odontólogo
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<UsersRound className="h-5 w-5" />}
            label="Profesionales"
            value={doctors.length}
            detail="Cuentas registradas"
          />

          <MetricCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Activos"
            value={activeDoctors}
            detail="Con acceso habilitado"
          />

          <MetricCard
            icon={<AlertCircle className="h-5 w-5" />}
            label="Inactivos"
            value={inactiveDoctors}
            detail="Sin actividad pública"
          />

          <MetricCard
            icon={<Building2 className="h-5 w-5" />}
            label="Sucursales"
            value={branches.length}
            detail="Disponibles para asignar"
          />
        </section>

        <section className="border border-[#DED9CD] bg-white p-4 md:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(280px,1fr)_240px_auto]">
            <label className="relative block">
              <span className="sr-only">Buscar odontólogo</span>

              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8FA07F]" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, correo, especialidad o sucursal"
                className="w-full border border-[#DED9CD] bg-[#FFFCF7] py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-[#9AA09E] focus:border-[#6F855F]"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "ALL" | "ACTIVE" | "INACTIVE"
                )
              }
              className="w-full border border-[#DED9CD] bg-[#FFFCF7] px-4 py-3 text-sm outline-none transition focus:border-[#6F855F]"
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#DED9CD] px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5F6F6B] transition hover:border-[#6F855F] disabled:opacity-50"
            >
              <RefreshCcw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Actualizar
            </button>
          </div>
        </section>

        {error && (
          <FeedbackMessage
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        )}

        {success && (
          <FeedbackMessage
            type="success"
            message={success}
            onClose={() => setSuccess("")}
          />
        )}

        {loading ? (
          <section className="flex min-h-[360px] flex-col items-center justify-center border border-[#DED9CD] bg-white">
            <Loader2 className="h-7 w-7 animate-spin text-[#6F855F]" />

            <p className="mt-3 text-sm text-[#6B7774]">
              Cargando odontólogos...
            </p>
          </section>
        ) : filteredDoctors.length === 0 ? (
          <EmptyState
            hasFilters={
              search.trim() !== "" || statusFilter !== "ALL"
            }
            onCreate={openCreateDrawer}
            onClear={() => {
              setSearch("");
              setStatusFilter("ALL");
            }}
          />
        ) : (
          <section className="grid gap-4">
            {filteredDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                deleting={deletingId === doctor.id}
                onEdit={() => openEditDrawer(doctor)}
                onDelete={() => handleDelete(doctor)}
              />
            ))}
          </section>
        )}
      </div>

      {drawerOpen && (
        <DoctorFormDrawer
          editing={Boolean(editingId)}
          form={form}
          branches={branches}
          specialties={SPECIALTIES}
          saving={saving}
          uploadingPhoto={uploadingPhoto}
          showPassword={showPassword}
          onTogglePassword={() =>
            setShowPassword((current) => !current)
          }
          onChange={updateForm}
          onToggleBranch={toggleBranch}
          onSelectAllBranches={selectAllBranches}
          onClearBranches={clearBranches}
          onGeneratePassword={() =>
            updateForm("password", createTemporaryPassword())
          }
          onCopyPassword={copyPassword}
          onUploadPhoto={uploadPhoto}
          onRemovePhoto={() => updateForm("photo", "")}
          onSubmit={handleSubmit}
          onClose={closeDrawer}
        />
      )}
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <article className="flex items-center gap-4 border border-[#DED9CD] bg-white p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EEF1E8] text-[#6F855F]">
        {icon}
      </div>

      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8FA07F]">
          {label}
        </p>

        <p className="mt-1 text-2xl font-semibold tracking-tight">
          {value}
        </p>

        <p className="mt-1 text-xs text-[#6B7774]">{detail}</p>
      </div>
    </article>
  );
}

function DoctorCard({
  doctor,
  deleting,
  onEdit,
  onDelete,
}: {
  doctor: Doctor;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const branchNames = doctor.branches.map(
    (item) => item.branch.name
  );

  const initials = doctor.user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <article className="border border-[#DED9CD] bg-white transition hover:border-[#8FA07F]">
      <div className="grid gap-6 p-5 md:p-6 xl:grid-cols-[minmax(270px,1.1fr)_minmax(200px,0.8fr)_minmax(250px,1fr)_auto] xl:items-center">
        <div className="flex min-w-0 items-center gap-4">
          {doctor.photo ? (
            <img
              src={doctor.photo}
              alt={doctor.user.name}
              className="h-16 w-16 shrink-0 rounded-full border border-[#DED9CD] object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#EEF1E8] text-lg font-semibold text-[#6F855F]">
              {initials || <UserRound className="h-6 w-6" />}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8FA07F]">
                Profesional
              </p>

              <StatusBadge active={doctor.active} />
            </div>

            <h2 className="mt-1 truncate text-xl font-semibold tracking-tight md:text-2xl">
              {doctor.user.name}
            </h2>

            <p className="mt-1 flex items-center gap-2 truncate text-sm text-[#6B7774]">
              <Mail className="h-4 w-4 shrink-0 text-[#8FA07F]" />
              {doctor.user.email}
            </p>
          </div>
        </div>

        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8FA07F]">
            Especialidad
          </p>

          <p className="mt-2 text-sm font-semibold">
            {doctor.specialty || "Sin especialidad"}
          </p>

          <p className="mt-2 text-xs leading-5 text-[#6B7774]">
            Último acceso: {formatLastLogin(doctor.user.lastLoginAt)}
          </p>
        </div>

        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8FA07F]">
            Sucursales
          </p>

          {branchNames.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {branchNames.map((branchName) => (
                <span
                  key={branchName}
                  className="border border-[#DCE3D5] bg-[#F3F6EF] px-2.5 py-1.5 text-[10px] font-medium text-[#5F7653]"
                >
                  {branchName}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#A45858]">
              Sin sucursales asignadas
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-11 items-center justify-center gap-2 border border-[#263F3B] px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#263F3B] transition hover:bg-[#263F3B] hover:text-white"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            aria-label={`Eliminar a ${doctor.user.name}`}
            className="inline-flex h-11 w-11 items-center justify-center border border-[#D9A5A5] text-[#A45858] transition hover:bg-[#F8E6E6] disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {doctor.description && (
        <div className="border-t border-[#EEEAE1] bg-[#FAF9F5] px-5 py-4 md:px-6">
          <p className="line-clamp-2 text-sm leading-6 text-[#6B7774]">
            {doctor.description}
          </p>
        </div>
      )}
    </article>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.14em] ${
        active
          ? "bg-[#E8F0E3] text-[#5F7653]"
          : "bg-[#F8E6E6] text-[#A45858]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-[#6F855F]" : "bg-[#C77777]"
        }`}
      />

      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

function DoctorFormDrawer({
  editing,
  form,
  branches,
  specialties,
  saving,
  uploadingPhoto,
  showPassword,
  onTogglePassword,
  onChange,
  onToggleBranch,
  onSelectAllBranches,
  onClearBranches,
  onGeneratePassword,
  onCopyPassword,
  onUploadPhoto,
  onRemovePhoto,
  onSubmit,
  onClose,
}: {
  editing: boolean;
  form: DoctorForm;
  branches: Branch[];
  specialties: string[];
  saving: boolean;
  uploadingPhoto: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
  onChange: <K extends keyof DoctorForm>(
    field: K,
    value: DoctorForm[K]
  ) => void;
  onToggleBranch: (branchId: string) => void;
  onSelectAllBranches: () => void;
  onClearBranches: () => void;
  onGeneratePassword: () => void;
  onCopyPassword: () => void;
  onUploadPhoto: (file: File) => void;
  onRemovePhoto: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Cerrar formulario"
        onClick={onClose}
        className="absolute inset-0 bg-[#263F3B]/40"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col bg-[#F7F5EF] shadow-2xl">
        <header className="flex items-start justify-between gap-5 border-b border-[#DED9CD] bg-white p-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8FA07F]">
              Gestión de profesionales
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              {editing ? "Editar odontólogo" : "Nuevo odontólogo"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#6B7774]">
              {editing
                ? "Actualizá los datos profesionales y sus sucursales."
                : "Creá la cuenta que utilizará el profesional para ingresar al portal."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving || uploadingPhoto}
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#DED9CD] text-[#6B7774] transition hover:bg-[#F7F5EF] disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-7 overflow-y-auto p-6">
            <FormSection
              eyebrow="Cuenta"
              title="Datos de acceso"
              description="Información que utilizará el odontólogo para iniciar sesión."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Nombre completo" htmlFor="doctor-name">
                  <input
                    id="doctor-name"
                    value={form.name}
                    onChange={(event) =>
                      onChange("name", event.target.value)
                    }
                    placeholder="Ejemplo: Dra. María Pérez"
                    className={inputClasses}
                    required
                  />
                </FormField>

                <FormField label="Correo electrónico" htmlFor="doctor-email">
                  <input
                    id="doctor-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      onChange("email", event.target.value)
                    }
                    placeholder="profesional@nazaret.com"
                    className={inputClasses}
                    required
                  />
                </FormField>
              </div>

              {!editing && (
                <FormField
                  label="Contraseña inicial"
                  htmlFor="doctor-password"
                  helper="El profesional podrá utilizarla para su primer ingreso."
                >
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                    <div className="relative">
                      <input
                        id="doctor-password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(event) =>
                          onChange("password", event.target.value)
                        }
                        className={`${inputClasses} pr-11`}
                        required
                        minLength={8}
                      />

                      <button
                        type="button"
                        onClick={onTogglePassword}
                        aria-label={
                          showPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7774]"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={onGeneratePassword}
                      className="border border-[#DED9CD] px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5F6F6B] transition hover:border-[#6F855F]"
                    >
                      Generar
                    </button>

                    <button
                      type="button"
                      onClick={onCopyPassword}
                      disabled={!form.password}
                      aria-label="Copiar contraseña"
                      className="flex h-12 w-12 items-center justify-center border border-[#DED9CD] text-[#6F855F] transition hover:border-[#6F855F] disabled:opacity-40"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </FormField>
              )}
            </FormSection>

            <FormSection
              eyebrow="Perfil"
              title="Información profesional"
              description="Datos que se mostrarán en el equipo de especialistas."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Especialidad" htmlFor="doctor-specialty">
                  <select
                    id="doctor-specialty"
                    value={form.specialty}
                    onChange={(event) =>
                      onChange("specialty", event.target.value)
                    }
                    className={inputClasses}
                  >
                    <option value="">Seleccionar especialidad</option>

                    {specialties.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                </FormField>

                <div className="flex items-end">
                  <label className="flex min-h-12 w-full items-center justify-between border border-[#DED9CD] bg-white px-4 py-3">
                    <span>
                      <span className="block text-sm font-medium">
                        Profesional activo
                      </span>

                      <span className="mt-1 block text-xs text-[#6B7774]">
                        Mostrar y habilitar su cuenta.
                      </span>
                    </span>

                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(event) =>
                        onChange("active", event.target.checked)
                      }
                      className="h-4 w-4 accent-[#6F855F]"
                    />
                  </label>
                </div>
              </div>

              <FormField label="Descripción" htmlFor="doctor-description">
                <textarea
                  id="doctor-description"
                  value={form.description}
                  onChange={(event) =>
                    onChange("description", event.target.value)
                  }
                  rows={4}
                  placeholder="Experiencia, formación y enfoque profesional..."
                  className={`${inputClasses} resize-none leading-6`}
                />
              </FormField>

              <FormField
                label="Fotografía"
                htmlFor="doctor-photo"
                helper="Utilizá una imagen clara y preferentemente cuadrada."
              >
                <div className="flex flex-col gap-4 border border-[#DED9CD] bg-white p-4 sm:flex-row sm:items-center">
                  {form.photo ? (
                    <img
                      src={form.photo}
                      alt="Vista previa del profesional"
                      className="h-20 w-20 rounded-full border border-[#DED9CD] object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EEF1E8] text-[#6F855F]">
                      <UserRound className="h-7 w-7" />
                    </div>
                  )}

                  <div className="flex-1">
                    <label
                      htmlFor="doctor-photo"
                      className="inline-flex cursor-pointer items-center gap-2 border border-[#263F3B] px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#263F3B] transition hover:bg-[#263F3B] hover:text-white"
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}

                      {uploadingPhoto ? "Subiendo" : "Subir imagen"}
                    </label>

                    <input
                      id="doctor-photo"
                      type="file"
                      accept="image/*"
                      disabled={uploadingPhoto}
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (file) {
                          onUploadPhoto(file);
                        }

                        event.target.value = "";
                      }}
                    />

                    {form.photo && (
                      <button
                        type="button"
                        onClick={onRemovePhoto}
                        className="ml-3 text-xs font-medium text-[#A45858] hover:underline"
                      >
                        Quitar foto
                      </button>
                    )}
                  </div>
                </div>
              </FormField>
            </FormSection>

            <FormSection
              eyebrow="Asignación"
              title="Sucursales"
              description="Elegí las sedes en las que atiende el profesional."
            >
              <div className="flex flex-wrap justify-between gap-3">
                <p className="text-xs text-[#6B7774]">
                  {form.branchIds.length} de {branches.length} seleccionadas
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onSelectAllBranches}
                    className="text-xs font-medium text-[#6F855F] hover:underline"
                  >
                    Seleccionar todas
                  </button>

                  <button
                    type="button"
                    onClick={onClearBranches}
                    className="text-xs font-medium text-[#A45858] hover:underline"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              <div className="grid gap-3">
                {branches.map((branch) => {
                  const selected = form.branchIds.includes(branch.id);

                  return (
                    <label
                      key={branch.id}
                      className={`flex cursor-pointer items-start justify-between gap-4 border p-4 transition ${
                        selected
                          ? "border-[#6F855F] bg-[#F3F6EF]"
                          : "border-[#DED9CD] bg-white hover:border-[#A2B38B]"
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{branch.name}</p>

                        <p className="mt-1 text-xs leading-5 text-[#6B7774]">
                          {branch.address}, {branch.city}
                        </p>
                      </div>

                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleBranch(branch.id)}
                        className="mt-1 h-4 w-4 accent-[#6F855F]"
                      />
                    </label>
                  );
                })}

                {branches.length === 0 && (
                  <p className="border border-dashed border-[#DED9CD] p-5 text-center text-sm text-[#6B7774]">
                    No hay sucursales disponibles.
                  </p>
                )}
              </div>
            </FormSection>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-[#DED9CD] bg-white p-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || uploadingPhoto}
              className="border border-[#DED9CD] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5F6F6B] transition hover:bg-[#F7F5EF] disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving || uploadingPhoto}
              className="inline-flex items-center justify-center gap-2 bg-[#263F3B] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#1D302D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {editing ? "Guardar cambios" : "Crear cuenta"}
                </>
              )}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}

function FormSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-[#DED9CD] bg-[#FFFCF7] p-5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8FA07F]">
        {eyebrow}
      </p>

      <h3 className="mt-1 text-xl font-semibold tracking-tight">{title}</h3>

      <p className="mt-1 text-xs leading-5 text-[#6B7774]">
        {description}
      </p>

      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function FormField({
  label,
  htmlFor,
  helper,
  children,
}: {
  label: string;
  htmlFor: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#6B7774]"
      >
        {label}
      </label>

      <div className="mt-2">{children}</div>

      {helper && (
        <p className="mt-2 text-xs leading-5 text-[#8B9491]">
          {helper}
        </p>
      )}
    </div>
  );
}

function FeedbackMessage({
  type,
  message,
  onClose,
}: {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 border px-5 py-4 text-sm ${
        type === "success"
          ? "border-[#BCD0B3] bg-[#EFF5EB] text-[#506548]"
          : "border-[#E4BABA] bg-[#FBEFEF] text-[#9C5252]"
      }`}
    >
      <div className="flex items-start gap-3">
        {type === "success" ? (
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        )}

        <p>{message}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar mensaje"
        className="shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onCreate,
  onClear,
}: {
  hasFilters: boolean;
  onCreate: () => void;
  onClear: () => void;
}) {
  return (
    <section className="flex min-h-[380px] flex-col items-center justify-center border border-[#DED9CD] bg-white px-6 py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF1E8] text-[#6F855F]">
        <Stethoscope className="h-7 w-7" />
      </div>

      <h2 className="mt-6 text-2xl font-semibold tracking-tight">
        {hasFilters
          ? "No encontramos profesionales"
          : "Todavía no hay odontólogos"}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-[#6B7774]">
        {hasFilters
          ? "Probá con otros términos o eliminá los filtros seleccionados."
          : "Creá la primera cuenta profesional y asignale las sucursales donde atiende."}
      </p>

      <button
        type="button"
        onClick={hasFilters ? onClear : onCreate}
        className="mt-6 inline-flex items-center gap-2 border border-[#263F3B] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#263F3B] transition hover:bg-[#263F3B] hover:text-white"
      >
        {hasFilters ? (
          <>
            <X className="h-4 w-4" />
            Limpiar filtros
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Crear odontólogo
          </>
        )}
      </button>
    </section>
  );
}

const inputClasses =
  "w-full border border-[#DED9CD] bg-white px-4 py-3 text-sm text-[#263F3B] outline-none transition placeholder:text-[#9AA09E] focus:border-[#6F855F]";