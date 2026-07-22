"use client";

import {
  Building2,
  CalendarDays,
  Camera,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type ProfileData = {
  firstName: string;
  lastName: string;
  dni: string | null;
  phone: string;
  email: string;
  birthDate: string;
  image: string;

  branch: {
    id: string;
    name: string;
    city: string;
    address: string;
  };

  doctor: {
    name: string;
    specialty: string | null;
  } | null;

  createdAt: string;
  lastLoginAt: string | null;
  hasPassword: boolean;
};

export default function PatientProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/patient/profile");
        const data = await response.json();

        if (!response.ok) {
          setProfileError(
            data.error || "No se pudo cargar el perfil."
          );
          return;
        }

        setProfile(data);
      } catch {
        setProfileError("No se pudo cargar el perfil.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const initials = useMemo(() => {
    if (!profile) return "P";

    return `${profile.firstName.charAt(0)}${profile.lastName.charAt(
      0
    )}`.toUpperCase();
  }, [profile]);

  function updateProfileField(
    field: keyof Pick<
      ProfileData,
      | "firstName"
      | "lastName"
      | "phone"
      | "email"
      | "birthDate"
      | "image"
    >,
    value: string
  ) {
    setProfile((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current
    );
  }

  async function handleProfileSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!profile) return;

    setProfileError("");
    setProfileSuccess("");
    setSavingProfile(true);

    try {
      const response = await fetch("/api/patient/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          email: profile.email,
          birthDate: profile.birthDate,
          image: profile.image,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setProfileError(
          data.error || "No se pudo guardar el perfil."
        );
        return;
      }

      setProfileSuccess("Los cambios se guardaron correctamente.");
    } catch {
      setProfileError("No se pudo guardar el perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");
    setSavingPassword(true);

    try {
      const response = await fetch(
        "/api/patient/profile/password",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(passwordForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(
          data.error || "No se pudo cambiar la contraseña."
        );
        return;
      }

      setPasswordSuccess("La contraseña se actualizó correctamente.");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setProfile((current) =>
        current
          ? {
              ...current,
              hasPassword: true,
            }
          : current
      );
    } catch {
      setPasswordError("No se pudo cambiar la contraseña.");
    } finally {
      setSavingPassword(false);
    }
  }

  function handleImageSelection(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileError("Seleccioná un archivo de imagen.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError("La imagen no puede superar los 5 MB.");
      return;
    }

    /*
     * Por ahora mostramos una vista previa.
     * En el próximo paso reemplazaremos esta URL temporal
     * por la URL definitiva de Cloudinary.
     */
    const previewUrl = URL.createObjectURL(file);
    updateProfileField("image", previewUrl);
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-[#6B7774]">
        Cargando perfil...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="border border-red-200 bg-red-50 p-5 text-red-600">
        {profileError || "No se pudo cargar el perfil."}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-4xl font-medium text-[#263F3B]">
          Mi perfil
        </h1>

        <p className="mt-3 text-[#6B7774]">
          Gestioná tu información personal y la seguridad de tu
          cuenta.
        </p>
      </header>

      <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <article className="border border-[#DED9CD] bg-white p-7">
          <h2 className="text-lg font-semibold text-[#263F3B]">
            Foto de perfil
          </h2>

          <div className="mt-7 flex flex-col items-center">
            <div className="relative">
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="h-40 w-40 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-full bg-[#879B75] text-4xl font-semibold text-white">
                  {initials}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-[#6F855F] text-white transition hover:bg-[#5F7450]"
                aria-label="Cambiar foto"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageSelection}
              className="hidden"
            />

            <p className="mt-5 text-center text-sm text-[#6B7774]">
              JPG, PNG o WEBP. Máximo 5 MB.
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 w-full border border-[#A2B38B] px-5 py-3 text-sm font-medium text-[#263F3B] transition hover:bg-[#F5F5EF]"
            >
              Subir nueva foto
            </button>

            {profile.image && (
              <button
                type="button"
                onClick={() => updateProfileField("image", "")}
                className="mt-4 text-sm text-red-500 hover:underline"
              >
                Eliminar foto
              </button>
            )}
          </div>

          <div className="mt-8 space-y-4 border-t border-[#DED9CD] pt-6">
            <ProfileSummary
              icon={<CalendarDays />}
              label="Paciente desde"
              value={formatDate(profile.createdAt)}
            />

            <ProfileSummary
              icon={<ShieldCheck />}
              label="Último acceso"
              value={
                profile.lastLoginAt
                  ? formatDateTime(profile.lastLoginAt)
                  : "Sin información"
              }
            />

            <ProfileSummary
              icon={<Building2 />}
              label="Sucursal"
              value={`${profile.branch.name}, ${profile.branch.city}`}
            />

          </div>
        </article>

        <article className="border border-[#DED9CD] bg-white p-7">
          <h2 className="text-lg font-semibold text-[#263F3B]">
            Información personal
          </h2>

          <form
            onSubmit={handleProfileSubmit}
            className="mt-7 grid gap-5 md:grid-cols-2"
          >
            <ProfileInput
              label="Nombre"
              icon={<UserRound />}
              value={profile.firstName}
              onChange={(value) =>
                updateProfileField("firstName", value)
              }
            />

            <ProfileInput
              label="Apellido"
              icon={<UserRound />}
              value={profile.lastName}
              onChange={(value) =>
                updateProfileField("lastName", value)
              }
            />

            <ProfileInput
              label="Correo electrónico"
              icon={<Mail />}
              type="email"
              value={profile.email}
              onChange={(value) =>
                updateProfileField("email", value)
              }
            />

            <ProfileInput
              label="Teléfono"
              icon={<Phone />}
              value={profile.phone}
              onChange={(value) =>
                updateProfileField("phone", value)
              }
            />

            <ProfileInput
              label="Fecha de nacimiento"
              icon={<CalendarDays />}
              type="date"
              value={profile.birthDate}
              onChange={(value) =>
                updateProfileField("birthDate", value)
              }
            />

            <ProfileInput
              label="DNI"
              value={profile.dni || "Sin registrar"}
              disabled
            />

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#4F5B58]">
                Sucursal
              </label>

              <div className="border border-[#D9DDD7] bg-[#F7F5EF] px-4 py-3 text-sm text-[#6B7774]">
                {profile.branch.name} — {profile.branch.address},{" "}
                {profile.branch.city}
              </div>

              <p className="mt-2 text-xs text-[#8A9491]">
                Para cambiar tu sucursal, comunicate con el
                consultorio.
              </p>
            </div>

            {profileError && (
              <p className="md:col-span-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {profileError}
              </p>
            )}

            {profileSuccess && (
              <p className="md:col-span-2 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {profileSuccess}
              </p>
            )}

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 bg-[#6F855F] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#5F7450] disabled:opacity-60"
              >
                <Save className="h-4 w-4" />

                {savingProfile
                  ? "Guardando..."
                  : "Guardar cambios"}
              </button>
            </div>
          </form>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <article className="border border-[#DED9CD] bg-white p-7">
          <h2 className="text-lg font-semibold text-[#263F3B]">
            {profile.hasPassword
              ? "Cambiar contraseña"
              : "Crear una contraseña"}
          </h2>

          <p className="mt-2 text-sm text-[#6B7774]">
            {profile.hasPassword
              ? "Actualizá la contraseña que utilizás para ingresar con tu correo."
              : "Tu cuenta fue creada con Google. Podés crear una contraseña para ingresar también con tu correo."}
          </p>

          <form
            onSubmit={handlePasswordSubmit}
            className="mt-7 grid gap-5 lg:grid-cols-3"
          >
            {profile.hasPassword && (
              <PasswordInput
                label="Contraseña actual"
                value={passwordForm.currentPassword}
                visible={showCurrentPassword}
                onToggle={() =>
                  setShowCurrentPassword(!showCurrentPassword)
                }
                onChange={(value) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: value,
                  })
                }
              />
            )}

            <PasswordInput
              label="Nueva contraseña"
              value={passwordForm.newPassword}
              visible={showNewPassword}
              onToggle={() =>
                setShowNewPassword(!showNewPassword)
              }
              onChange={(value) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: value,
                })
              }
            />

            <PasswordInput
              label="Confirmar contraseña"
              value={passwordForm.confirmPassword}
              visible={showConfirmPassword}
              onToggle={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              onChange={(value) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: value,
                })
              }
            />

            {passwordError && (
              <p className="lg:col-span-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {passwordError}
              </p>
            )}

            {passwordSuccess && (
              <p className="lg:col-span-3 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {passwordSuccess}
              </p>
            )}

            <div className="lg:col-span-3">
              <button
                type="submit"
                disabled={savingPassword}
                className="flex items-center gap-2 bg-[#6F855F] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#5F7450] disabled:opacity-60"
              >
                <Lock className="h-4 w-4" />

                {savingPassword
                  ? "Actualizando..."
                  : profile.hasPassword
                    ? "Actualizar contraseña"
                    : "Crear contraseña"}
              </button>
            </div>
          </form>
        </article>

        <article className="border border-[#DED9CD] bg-white p-7">
          <h2 className="text-lg font-semibold text-[#263F3B]">
            Acceso a la cuenta
          </h2>

          <div className="mt-7 space-y-5">
            <AccountMethod
              title="Cuenta de Google"
              text="Podés ingresar usando tu cuenta de Google."
              active
            />

            <AccountMethod
              title="Correo y contraseña"
              text={
                profile.hasPassword
                  ? "Tenés habilitado el ingreso mediante usuario y contraseña."
                  : "Todavía no configuraste una contraseña."
              }
              active={profile.hasPassword}
            />
          </div>
        </article>
      </section>
    </div>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  icon,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#4F5B58]">
        {label}
      </label>

      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71807C] [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          required={!disabled}
          className={`w-full border px-4 py-3 text-sm outline-none transition ${
            icon ? "pl-11" : ""
          } ${
            disabled
              ? "border-[#E3E1DA] bg-[#F7F5EF] text-[#7D8784]"
              : "border-[#D9DDD7] bg-white text-[#394542] focus:border-[#879B75] focus:ring-2 focus:ring-[#A2B38B]/20"
          }`}
        />
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  visible,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  visible: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#4F5B58]">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          minLength={8}
          className="w-full border border-[#D9DDD7] bg-white px-4 py-3 pr-11 text-sm text-[#394542] outline-none transition focus:border-[#879B75] focus:ring-2 focus:ring-[#A2B38B]/20"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71807C]"
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

function ProfileSummary({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-1 text-[#6F855F] [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A9491]">
          {label}
        </p>

        <p className="mt-1 text-sm text-[#394542]">{value}</p>
      </div>
    </div>
  );
}

function AccountMethod({
  title,
  text,
  active,
}: {
  title: string;
  text: string;
  active: boolean;
}) {
  return (
    <div className="flex gap-4 border border-[#E1DFD8] p-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          active
            ? "bg-[#EEF2E9] text-[#6F855F]"
            : "bg-[#F2F1ED] text-[#9AA19E]"
        }`}
      >
        <ShieldCheck className="h-5 w-5" />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium text-[#263F3B]">{title}</p>

          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
              active
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {active ? "Activo" : "Inactivo"}
          </span>
        </div>

        <p className="mt-1 text-sm leading-5 text-[#6B7774]">
          {text}
        </p>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}