"use client";

import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  Stethoscope,
  User,
  UserRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { useEffect, useState } from "react";

type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
};

type Profile = {
  id: string;
  name: string;
  email: string;
  photo: string | null;
  phone: string;
  birthDate: string;
  dni: string;
  professionalLicense: string;
  specialty: string;
  branches: Branch[];

  account: {
    googleActive: boolean;
    passwordActive: boolean;
    lastLoginAt: string | null;
  };
};

export default function DoctorProfilePage() {
  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [phone, setPhone] =
    useState("");

  const [birthDate, setBirthDate] =
    useState("");

  const [dni, setDni] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [savingPassword, setSavingPassword] =
    useState(false);

  const [passwordError, setPasswordError] =
    useState("");

  const [passwordSuccess, setPasswordSuccess] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwordForm, setPasswordForm] =
    useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/doctor/profile",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo cargar el perfil."
        );
      }

      setProfile(data);
      setPhone(data.phone || "");
      setBirthDate(data.birthDate || "");
      setDni(data.dni || "");

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el perfil."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/doctor/profile",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            phone,
            birthDate,
            dni,
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

      setSuccess(
        "Los cambios se guardaron correctamente."
      );

      setProfile((current) =>
        current
          ? {
              ...current,
              phone: data.doctor.phone,
              birthDate:
                data.doctor.birthDate,
              dni: data.doctor.dni,
            }
          : current
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar los cambios."
      );
    } finally {
      setSaving(false);
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
        "/api/doctor/profile/password",
        {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              passwordForm
            ),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          setPasswordError(
            data.error ||
              "No se pudo cambiar la contraseña."
          );
          return;
        }

        setPasswordSuccess(
          profile?.account.passwordActive
            ? "La contraseña se actualizó correctamente."
            : "La contraseña se creó correctamente."
        );

        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setProfile((current) =>
          current
            ? {
                ...current,
                account: {
                  ...current.account,
                  passwordActive: true,
                },
              }
            : current
        );
    } catch {
        setPasswordError(
          "No se pudo cambiar la contraseña."
        );
      } finally {
        setSavingPassword(false);
      }
    }

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#6F855F]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-10">
        <div className="border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error ||
            "No se pudo cargar el perfil."}
        </div>
      </div>
    );
  }

  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F5EF] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-[1200px]">
        {/* ENCABEZADO */}

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A2B38B]">
            Cuenta profesional
          </p>

          <h1 className="mt-2 font-serif text-4xl font-medium text-[#263F3B]">
            Mi perfil
          </h1>

          <p className="mt-2 text-sm text-[#6B7774]">
            Consultá tu información personal y
            profesional.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* FOTO */}

          <section className="border border-[#DED9CD] bg-white p-7">
            <h2 className="text-lg font-semibold text-[#263F3B]">
              Foto profesional
            </h2>

            <div className="mt-8 flex justify-center">
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt={profile.name}
                  className="h-40 w-40 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-full bg-[#8EA17D] text-4xl font-semibold text-white">
                  {initials}
                </div>
              )}
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-[#7B8582]">
              La fotografía profesional es
              administrada por el consultorio.
            </p>

            <div className="mt-8 border-t border-[#DED9CD] pt-6">
              <InfoLine
                icon={
                  <Stethoscope className="h-4 w-4" />
                }
                label="Especialidad"
                value={
                  profile.specialty ||
                  "Sin especificar"
                }
              />

              <InfoLine
                icon={
                  <ShieldCheck className="h-4 w-4" />
                }
                label="Matrícula profesional"
                value={
                  profile.professionalLicense ||
                  "Sin especificar"
                }
              />

              <InfoLine
                icon={
                  <Building2 className="h-4 w-4" />
                }
                label="Sucursales"
                value={
                  profile.branches.length
                    ? profile.branches
                        .map(
                        (branch) =>
                            `${branch.name} - ${branch.city}`
                        )
                        .join(", ")
                    : "Sin sucursales asignadas"
                }
              />
            </div>
          </section>

          {/* INFORMACIÓN */}

          <section className="border border-[#DED9CD] bg-white p-7">
            <h2 className="text-lg font-semibold text-[#263F3B]">
              Información profesional
            </h2>

            <p className="mt-1 text-sm text-[#7B8582]">
              Podés modificar tu teléfono, fecha de nacimiento y DNI.
            </p>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <ReadOnlyField
                label="Nombre completo"
                value={profile.name}
                icon={
                  <UserRound className="h-4 w-4" />
                }
              />

              <ReadOnlyField
                label="Correo electrónico"
                value={
                  profile.email ||
                  "Sin especificar"
                }
                icon={
                  <Mail className="h-4 w-4" />
                }
              />

              <EditableField
                label="Teléfono"
                value={phone}
                onChange={setPhone}
                type="tel"
                placeholder="Ingresá tu teléfono"
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-[#263F3B]">
                  Fecha de nacimiento
                </label>

                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71807C]" />

                  <input
                    type="date"
                    value={birthDate}
                    onChange={(event) =>
                      setBirthDate(
                        event.target.value
                      )
                    }
                    className="w-full border border-[#DED9CD] bg-white py-3 pl-11 pr-4 text-sm text-[#263F3B] outline-none transition focus:border-[#6F855F]"
                  />
                </div>
              </div>

              <EditableField
                label="DNI"
                value={dni}
                onChange={setDni}
                type="text"
                placeholder="Ingresá tu DNI"
              />

              <ReadOnlyField
                label="Matrícula profesional"
                value={
                  profile.professionalLicense ||
                  "Sin especificar"
                }
                icon={
                  <ShieldCheck className="h-4 w-4" />
                }
              />

              <ReadOnlyField
                label="Especialidad"
                value={
                  profile.specialty ||
                  "Sin especificar"
                }
                icon={
                  <Stethoscope className="h-4 w-4" />
                }
              />

              <ReadOnlyField
                label={
                  profile.branches.length === 1
                    ? "Sucursal"
                    : "Sucursales"
                }
                value={
                  profile.branches.length
                    ? profile.branches
                        .map((branch) => {
                          const location = [
                            branch.address,
                            branch.city,
                          ]
                            .filter(Boolean)
                            .join(", ");

                          return location
                            ? `${branch.name} — ${location}`
                            : branch.name;
                        })
                        .join(" · ")
                    : "Sin sucursales asignadas"
                }
                icon={
                  <Building2 className="h-4 w-4" />
                }
              />
            </div>

            {error && (
              <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-6 flex items-center gap-2 border border-[#C9D8C2] bg-[#F1F6EE] px-4 py-3 text-sm text-[#56704C]">
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-7 flex items-center gap-2 bg-[#738B63] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#647A56] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              Guardar cambios
            </button>
          </section>
        </div>

        {/* CONTRASEÑA */}

        <section className="mt-6 border border-[#DED9CD] bg-white p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEF2E9] text-[#6F855F]">
              <Lock className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#263F3B]">
                {profile.account.passwordActive
                  ? "Cambiar contraseña"
                  : "Crear una contraseña"}
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#6B7774]">
                {profile.account.passwordActive
                  ? "Actualizá la contraseña que utilizás para ingresar con tu correo."
                  : "Si tu cuenta fue creada con Google, podés configurar una contraseña para ingresar también con tu correo electrónico."}
              </p>
            </div>
          </div>

          <form
            onSubmit={handlePasswordSubmit}
            className="mt-7 grid gap-5 lg:grid-cols-3"
          >
            {profile.account.passwordActive && (
              <PasswordInput
                label="Contraseña actual"
                value={passwordForm.currentPassword}
                visible={showCurrentPassword}
                onToggle={() =>
                  setShowCurrentPassword(
                    !showCurrentPassword
                )
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
                setShowNewPassword(
                  !showNewPassword
                )
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
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
              onChange={(value) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: value,
                })
              }
            />

            {passwordError && (
              <div className="lg:col-span-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="lg:col-span-3 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {passwordSuccess}
              </div>
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
                  : profile.account.passwordActive
                  ? "Actualizar contraseña"
                  : "Crear contraseña"}
            </button>
          </div>
        </form>
      </section>
      </div>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#263F3B]">
        {label}
      </label>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#87928F]">
          {icon}
        </div>

        <div className="min-h-[46px] border border-[#DED9CD] bg-[#F7F5EF] py-3 pl-11 pr-4 text-sm leading-5 text-[#7B8582]">
          {value}
        </div>
      </div>
    </div>
  );
}

function EditableField({
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
      <label className="mb-2 block text-sm font-medium text-[#263F3B]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full border border-[#DED9CD] bg-white px-4 py-3 text-sm text-[#263F3B] outline-none transition focus:border-[#6F855F]"
      />
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
      <label className="mb-2 block text-sm font-medium text-[#263F3B]">
        {label}
      </label>

      <div className="relative">
        <input
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          required
          minLength={8}
          className="w-full border border-[#DED9CD] bg-white px-4 py-3 pr-11 text-sm text-[#263F3B] outline-none transition focus:border-[#6F855F]"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71807C]"
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

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3 last:mb-0">
      <div className="mt-0.5 text-[#789069]">
        {icon}
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A2B38B]">
          {label}
        </p>

        <p className="mt-1 text-sm leading-5 text-[#263F3B]">
          {value}
        </p>
      </div>
    </div>
  );
}