"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Users,
  Star,
  Phone,
  Plus,
  Trash2,
  Save,
  ShieldPlus,
} from "lucide-react";
import TreatmentManager from "@/components/admin/TratmentManager";

type Service = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  active: boolean;
};

type Doctor = {
  id: string;
  user: {
    name: string;
    email: string;
  };
  specialty: string | null;
  description: string | null;
  photo: string | null;
  active: boolean;
  branches: {
    branchId: string;
    branch: {
      id: string;
      name: string;
      city: string;
      address: string;
    };
  }[];
};

type Branch = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone?: string | null;
  mapUrl?: string | null;
  active: boolean;
  mondayToFridayHours?: string | null;
  saturdayHours?: string | null;
  sundayHours?: string | null;
};

type Availability = {
  id: string;
  doctorId: string;
  branchId: string;
  date: string;
  startTime: string;
  endTime: string;
  doctor: {
    user: {
      name: string | null;
    };
  };
};

type Tab =
  | "servicios"
  | "tratamientos"
  | "equipo"
  | "testimonios"
  | "contacto";

export default function ServiciosPage() {
  const [activeTab, setActiveTab] = useState<Tab>("servicios");
  const [services, setServices] = useState<Service[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);

  const [availabilityForm, setAvailabilityForm] = useState({
    doctorId: "",
    branchId: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  const [doctorForm, setDoctorForm] = useState<{
    name: string;
    email: string;
    specialty: string;
    description: string;
    photo: string;
    active: boolean;
    branchIds: string[];
  }>({
    name: "",
    email: "",
    specialty: "",
    description: "",
    photo: "",
    active: true,
    branchIds: [],
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    image: "",
    active: true,
  });

  const [contactForm, setContactForm] = useState({
    whatsapp: "",
    instagram: "",
    facebook: "",
    businessHoursWeek: "",
    businessHoursSaturday: "",
    businessHoursSunday: "",
  });

  function updateBranchField(
    branchId: string,
    field: keyof Branch,
    value: string | boolean
  ) {
    setBranches((prev) =>
      prev.map((branch) =>
        branch.id === branchId
          ? {
              ...branch,
              [field]: value,
            }
          : branch
      )
    );
  }

  async function loadAvailabilities() {
    const res = await fetch("/api/doctor-availability");
    const data = await res.json();

    setAvailabilities(Array.isArray(data) ? data : []);
  }

  async function saveAvailability(branchId: string) {
    const res = await fetch("/api/doctor-availability", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...availabilityForm,
        branchId,
      }),
    });

    if (!res.ok) {
      alert("No se pudo guardar la disponibilidad.");
      return;
    }

    setAvailabilityForm({
      doctorId: "",
      branchId: "",
      date: "",
      startTime: "",
      endTime: "",
    });

    await loadAvailabilities();

    alert("Disponibilidad guardada.");
  }

  async function deleteAvailability(id: string) {
    if (!confirm("¿Eliminar disponibilidad?")) return;

    await fetch(`/api/doctor-availability/${id}`, {
      method: "DELETE",
    });

    await loadAvailabilities();
  }

  async function saveBranchHours() {
    for (const branch of branches) {
      console.log("Guardando sucursal:", branch);

      const res = await fetch(`/api/branches/${branch.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(branch),
      });

      console.log(await res.json());
    }

    alert("Sucursales guardadas.");
  }

  async function loadServices() {
    const res = await fetch("/api/services");
    const data = await res.json();

    setServices(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadServices();
    loadDoctors();
    loadBranches();
    loadContact();
    loadAvailabilities();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      image: "",
      active: true,
    });
  }

  function startEditDoctor(doctor: Doctor) {
    setEditingDoctorId(doctor.id);

    setDoctorForm({
      name: doctor.user.name,
      email: doctor.user.email,
      specialty: doctor.specialty || "",
      description: doctor.description || "",
      photo: doctor.photo || "",
      active: doctor.active,
      branchIds: doctor.branches.map((b: any) => b.branchId),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const url = editingId ? `/api/services/${editingId}` : "/api/services";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      alert("No se pudo guardar el servicio.");
      return;
    }

    resetForm();
    loadServices();
  }

async function loadDoctors() {
  const res = await fetch("/api/doctors");
  const data = await res.json();
  setDoctors(data);
}

async function loadBranches() {
  const res = await fetch("/api/branches");
  const data = await res.json();

  console.log("BRANCHES:", data);

  setBranches(data);
}

async function handleDoctorSubmit(e: React.FormEvent) {
  e.preventDefault();

  const url = editingDoctorId
    ? `/api/doctors/${editingDoctorId}`
    : "/api/doctors";

  const method = editingDoctorId ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: doctorForm.name,
      email: doctorForm.email,
      specialty: doctorForm.specialty,
      description: doctorForm.description,
      photo: doctorForm.photo,
      active: doctorForm.active,
      branchIds: doctorForm.branchIds,
    }),
  });

  if (!res.ok) {
    const data = await res.json();
    alert(data.error || "No se pudo guardar el especialista.");
    return;
  }

  setEditingDoctorId(null);

  setDoctorForm({
    name: "",
    email: "",
    specialty: "",
    description: "",
    photo: "",
    active: true,
    branchIds: [],
  });

  loadDoctors();
}

async function loadContact() {
  const res = await fetch("/api/site-config");
  const data = await res.json();

  if (data) {
    setContactForm({
      whatsapp: data.whatsapp || "",
      instagram: data.instagram || "",
      facebook: data.facebook || "",
      businessHoursWeek: data.businessHoursWeek || "",
      businessHoursSaturday: data.businessHoursSaturday || "",
      businessHoursSunday: data.businessHoursSunday || "",
    });
  }
}

async function handleContactSubmit(e: React.FormEvent) {
  e.preventDefault();

  await fetch("/api/site-config", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contactForm),
  });

  alert("Datos de contacto guardados.");
}

  function startEdit(service: Service) {
    setEditingId(service.id);
    setForm({
      title: service.title,
      description: service.description,
      image: service.image || "",
      active: service.active,
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Seguro que querés eliminar este servicio?")) return;

    await fetch(`/api/services/${id}`, {
      method: "DELETE",
    });

    loadServices();
  }

  const tabs = [
    {
      id: "servicios" as Tab,
      label: "Servicios",
      icon: FileText,
    },
    {
      id: "tratamientos" as Tab,
      label: "Tratamientos",
      icon: ShieldPlus,
    },
    {
      id: "equipo" as Tab,
      label: "Equipo",
      icon: Users,
    },
    {
      id: "testimonios" as Tab,
      label: "Testimonios",
      icon: Star,
    },
    {
      id: "contacto" as Tab,
      label: "Contacto",
      icon: Phone,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <div className="space-y-10">
        <header>
          <h1 className="font-serif text-4xl font-medium leading-tight">
            Contenido del sitio
          </h1>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#6B7774]">
            Editá los servicios, tratamientos, equipo, testimonios y los datos de
            contacto que ven los pacientes en el sitio público.
          </p>
        </header>

        <div className="grid border border-[#DED9CD] bg-white md:grid-cols-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 border-b border-[#DED9CD] px-6 py-2 text-sm font-semibold transition md:border-b-0 md:border-r ${
                  activeTab === tab.id
                    ? "bg-[#263F3B] text-white"
                    : "text-[#5F6F6B] hover:bg-[#F7F5EF]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "servicios" && (
          <section className="space-y-6">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => 
                  setDoctorForm({
                    name: "",
                    email: "",
                    specialty: "",
                    description: "",
                    photo: "",
                    active: true,
                    branchIds: doctorForm.branchIds,
                  })
                }
                className="flex items-center gap-2 bg-[#263F3B] px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]"
              >
                <Plus className="h-4 w-4" />
                Agregar servicio
              </button>
            </div>

            <div className="space-y-6">
              <form
                onSubmit={handleSubmit}
                className="border border-[#DED9CD] bg-white p-8"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-[#A2B38B]">
                    <span>#{editingId ? "Editando" : services.length + 1}</span>
                  </div>

                  <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#6B7774]">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          active: e.target.checked,
                        })
                      }
                    />
                    Visible
                  </label>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                      Título
                    </label>

                    <input
                      className="mt-3 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                      value={form.title}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          title: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                      Imagen del servicio
                    </label>

                    <input
                      type="file"
                      accept="image/*"
                      className="mt-3 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];

                        if (!file) return;

                        const formData = new FormData();
                        formData.append("file", file);

                        const res = await fetch("/api/upload", {
                          method: "POST",
                          body: formData,
                        });

                       const data = await res.json();

                       setForm({
                         ...form,
                         image: data.url,
                       });
                     }}
                    />

                   {form.image && (
                     <img
                       src={form.image}
                       alt="Imagen del servicio"
                       className="mt-4 h-40 w-full border border-[#DED9CD] object-cover"
                     />
                   )}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Descripción
                  </label>

                  <textarea
                    rows={5}
                    className="mt-3 h-20 w-full resize-y border border-[#DED9CD] bg-white p-2 leading-5 outline-none focus:border-[#263F3B]"
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="mt-3 flex flex-wrap justify-end gap-3">
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="border border-[#DED9CD] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] hover:bg-[#F7F5EF]"
                    >
                      Cancelar
                    </button>
                  )}

                  <button className="flex items-center gap-2 bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]">
                    <Save className="h-4 w-4" />
                    {editingId ? "Guardar cambios" : "Guardar servicio"}
                  </button>
                </div>
              </form>

              {services.map((service, index) => (
                <div
                  key={service.id}
                  className="border border-[#DED9CD] bg-white p-7"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-[#A2B38B]">
                      <span>#{index + 1}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-[0.2em] text-[#6B7774]">
                        {service.active ? "Visible" : "Oculto"}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDelete(service.id)}
                        className="text-[#D97A7A] hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                        Título
                      </p>

                      <p className="mt-3 border border-[#DED9CD] p-2">
                        {service.title}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                        Imagen
                      </p>

                      <p className="mt-3 break-all border border-[#DED9CD] p-2.5 text-sm text-[#6B7774]">
                        {service.image || "Sin imagen cargada"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                      Descripción
                    </p>

                    <p className="mt-3 min-h-[100px] border border-[#DED9CD] p-4 leading-7 text-[#263F3B]">
                      {service.description}
                    </p>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => startEdit(service)}
                      className="border border-[#DED9CD] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] hover:bg-[#F7F5EF]"
                    >
                      Editar servicio
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "tratamientos" && (
          <TreatmentManager />
        )}

        {activeTab === "equipo" && (
          <section className="space-y-6">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 bg-[#263F3B] px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]"
              >
                <Plus className="h-4 w-4" />
                Agregar especialista
              </button>
            </div>

            <form
              onSubmit={handleDoctorSubmit}
              className="border border-[#DED9CD] bg-white p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm text-[#A2B38B]">#{doctors.length + 1}</span>

                <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#6B7774]">
                  <input
                    type="checkbox"
                    checked={doctorForm.active}
                    onChange={(e) =>
                      setDoctorForm({
                        ...doctorForm,
                        active: e.target.checked,
                      })
                    }
                  />
                  Visible
                </label>
              </div>

              <div className="mb-6 flex items-start gap-6">
                <div className="flex h-28 w-28 items-center justify-center bg-[#E4E8E0] text-xs uppercase tracking-[0.15em] text-[#8A9A87]">
                  {doctorForm.photo ? (
                    <img
                      src={doctorForm.photo}
                      alt="Foto del odontólogo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    "Sin foto"
                  )}
                </div>

                <div>
                  <label className="inline-block cursor-pointer border border-[#DED9CD] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#263F3B] hover:bg-[#F7F5EF]">
                    Subir foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const formData = new FormData();
                        formData.append("file", file);

                        const res = await fetch("/api/upload", {
                          method: "POST",
                          body: formData,
                        });

                        const data = await res.json();

                        setDoctorForm({
                          ...doctorForm,
                          photo: data.url,
                        });
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Nombre completo
                  </label>

                  <input
                    className="mt-2 w-full border border-[#DED9CD] p-2 outline-none focus:border-[#263F3B]"
                    value={doctorForm.name}
                    onChange={(e) =>
                      setDoctorForm({
                        ...doctorForm,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Email
                  </label>

                  <input
                    type="email"
                    className="mt-2 w-full border border-[#DED9CD] p-2 outline-none focus:border-[#263F3B]"
                    value={doctorForm.email}
                    onChange={(e) =>
                      setDoctorForm({
                        ...doctorForm,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Rol / Especialidad
                </label>

                <input
                  className="mt-2 w-full border border-[#DED9CD] p-2 outline-none focus:border-[#263F3B]"
                  value={doctorForm.specialty}
                  onChange={(e) =>
                    setDoctorForm({
                      ...doctorForm,
                      specialty: e.target.value,
                    })
                  }
                  placeholder="Ej: Ortodoncia, Estética dental, Odontopediatría"
                />
              </div>

              <div className="mt-6">
                <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Sucursales
                </label>

                <div className="grid md:grid-cols-2 gap-3">
                  {branches.map((branch) => (
                    <label
                      key={branch.id}
                      className="border border-[#d8d2c4] px-4 py-3 flex items-center gap-3 text-sm text-[#1f3f36]"
                    >
                      <input
                        type="checkbox"
                        checked={doctorForm.branchIds.includes(branch.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDoctorForm({
                              ...doctorForm,
                              branchIds: [...doctorForm.branchIds, branch.id],
                            });
                          } else {
                            setDoctorForm({
                              ...doctorForm,
                              branchIds: doctorForm.branchIds.filter(
                                (id) => id !== branch.id
                              ),
                            });
                          }
                        }}
                        className="h-4 w-4 accent-[#1f3f36]"
                      />

                      <span>
                        {branch.name} - {branch.address}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Biografía
                </label>

                <textarea
                  rows={4}
                  className="mt-2 w-full border border-[#DED9CD] p-2 leading-7 outline-none focus:border-[#263F3B]"
                  value={doctorForm.description}
                  onChange={(e) =>
                    setDoctorForm({
                      ...doctorForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button className="bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]">
                  Guardar especialista
                </button>
              </div>
            </form>

            {doctors.map((doctor, index) => (
              <div
                key={doctor.id}
                className="border border-[#DED9CD] bg-white p-8"
              >
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-sm text-[#A2B38B]">#{index + 1}</span>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#6B7774]">
                      <input
                        type="checkbox"
                        checked={doctor.active}
                        onChange={async (e) => {
                          await fetch(`/api/doctors/${doctor.id}`, {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              ...doctor,
                              active: e.target.checked,
                              branchIds: doctor.branches.map((b) => b.branch.id),
                              name: doctor.user.name,
                              email: doctor.user.email,
                            }),
                          });

                          loadDoctors();
                        }}
                      />
                      Visible
                    </label>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm("¿Seguro que querés eliminar este especialista?")) return;

                        const res = await fetch(`/api/doctors/${doctor.id}`, {
                          method: "DELETE",
                        });

                        if (!res.ok) {
                          const data = await res.json();
                          alert(data.error || "No se pudo eliminar el especialista.");
                          return;
                        }

                        loadDoctors();
                      }}
                      className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D97A7A] hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-[120px_1fr]">
                  <div className="flex h-28 w-28 items-center justify-center bg-[#E4E8E0] text-xs uppercase tracking-[0.15em] text-[#8A9A87]">
                    {doctor.photo ? (
                      <img
                        src={doctor.photo}
                        alt={doctor.user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "Sin foto"
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                      Nombre completo
                    </p>

                    <p className="mt-2 border border-[#DED9CD] p-2">
                      {doctor.user.name}
                    </p>

                    <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                      Rol / Especialidad
                    </p>

                    <p className="mt-2 border border-[#DED9CD] p-2">
                      {doctor.specialty || "Sin especialidad cargada"}
                    </p>

                    <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                      Sucursales
                    </p>

                    <div className="mt-2 w-full border border-[#DED9CD] p-2 outline-none focus:border-[#263F3B]">
                      {doctor.branches.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {doctor.branches.map((b) => (
                            <span
                              key={b.branchId}
                              className="rounded-full border border-[#A2B38B] px-3 py-2 text-sm"
                            >
                              {b.branch.name} - {b.branch.address}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">
                          Sin sucursal asignada
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Biografía
                  </p>

                  <p className="mt-3 min-h-[80px] border border-[#DED9CD] p-4 leading-6 text-[#263F3B]">
                    {doctor.description || "Sin biografía cargada."}
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => startEditDoctor(doctor)}
                      className="border border-[#DED9CD] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] hover:bg-[#F7F5EF]"
                  >
                    Editar especialista
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {activeTab === "testimonios" && (
          <section className="border border-[#DED9CD] bg-white p-8">
            <Star className="mb-5 h-5 w-5 text-[#A2B38B]" />
            <h2 className="font-[var(--font-cormorant)] text-4xl font-medium">
              Testimonios
            </h2>
            <p className="mt-2 text-sm text-[#6B7774]">
              Próximamente: comentarios de pacientes con calificación de 1 a 5
              estrellas.
            </p>
          </section>
        )}

        {activeTab === "contacto" && (
          <section className="border border-[#DED9CD] bg-white p-8">
            <Phone className="mb-5 h-5 w-5 text-[#A2B38B]" />

            <h2 className="font-serif text-3xl font-medium">
              Contacto
            </h2>

            <p className="mt-2 text-sm text-[#6B7774]">
              Cargá los datos de contacto, redes sociales y sucursales visibles en el sitio.
            </p>

            <form onSubmit={handleContactSubmit} className="mt-8 space-y-8">
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    WhatsApp
                  </label>

                  <input
                    className="mt-3 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                    value={contactForm.whatsapp}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, whatsapp: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Instagram
                  </label>

                  <input
                    className="mt-3 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                    value={contactForm.instagram}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, instagram: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Facebook
                  </label>

                  <input
                    className="mt-3 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                    value={contactForm.facebook}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, facebook: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-[#DED9CD] pt-6">
                <button className="bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]">
                  Guardar contacto
                </button>
              </div>
            </form>

            <div className="mt-12 border-t border-[#DED9CD] pt-8">
              <h3 className="font-serif text-3xl font-medium">
                Sucursales
              </h3>

              <p className="mt-2 text-sm text-[#6B7774]">
                Administrá nombre, ciudad, dirección y horarios de atención por sucursal.
              </p>

              <div className="mt-8 space-y-8">
                {branches.map((branch, index) => (
                  <div
                    key={branch.id}
                    className="border border-[#DED9CD] bg-white p-6"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <span className="text-[#A2B38B]">
                        #{index + 1}
                      </span>

                      <div className="flex items-center gap-5">
                        <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#6B7774]">
                          <input
                            type="checkbox"
                            checked={branch.active}
                            onChange={(e) =>
                              updateBranchField(branch.id, "active", e.target.checked)
                            }
                          />
                          Visible
                        </label>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                          Nombre
                        </label>
                        <input
                          className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
                          value={branch.name}
                          onChange={(e) =>
                            updateBranchField(branch.id, "name", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                          Ciudad
                        </label>
                        <input
                          className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
                          value={branch.city}
                          onChange={(e) =>
                            updateBranchField(branch.id, "city", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                        Dirección
                      </label>
                      <input
                        className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
                        value={branch.address}
                        onChange={(e) =>
                          updateBranchField(branch.id, "address", e.target.value)
                        }
                      />
                    </div>

                    <div className="mt-6 grid gap-6 md:grid-cols-3">
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                          Lunes a viernes
                        </label>

                        <input
                          className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
                          placeholder="09:00 - 19:00"
                          value={branch.mondayToFridayHours || ""}
                          onChange={(e) =>
                            updateBranchField(branch.id, "mondayToFridayHours", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                          Sábados
                        </label>

                        <input
                          className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
                          placeholder="09:00 - 13:00"
                          value={branch.saturdayHours || ""}
                          onChange={(e) =>
                            updateBranchField(branch.id, "saturdayHours", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                          Domingos
                        </label>

                        <input
                          className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
                          placeholder="Cerrado"
                          value={branch.sundayHours || ""}
                          onChange={(e) =>
                            updateBranchField(branch.id, "sundayHours", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-10 w-full border-t border-[#DED9CD] pt-8">
                      <h4 className="font-[var(--font-cormorant)] text-2xl text-[#263F3B]">
                        Programación de especialistas
                      </h4>

                      <p className="mt-1 text-sm text-[#6B7774]">
                        Definí qué día y en qué horario atiende cada especialista en esta sucursal.
                      </p>

                      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-5">
                        <div className="md:col-span-2">
                          <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                            Especialista
                          </label>

                          <select
                            className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
                            value={
                              availabilityForm.branchId === branch.id
                                ? availabilityForm.doctorId
                                : ""
                            }
                            onChange={(e) =>
                              setAvailabilityForm({
                                ...availabilityForm,
                                branchId: branch.id,
                                doctorId: e.target.value,
                              })
                            }
                          >
                            <option value="">Seleccionar especialista</option>

                            {doctors
                              .filter((doctor) =>
                                doctor.branches?.some((b) => b.branchId === branch.id)
                              )
                              .map((doctor) => (
                                <option key={doctor.id} value={doctor.id}>
                                  {doctor.user?.name || "Especialista"}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                            Día
                          </label>

                          <input
                            type="date"
                            className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
                            value={
                              availabilityForm.branchId === branch.id
                                ? availabilityForm.date
                                : ""
                            }
                            onChange={(e) =>
                              setAvailabilityForm({
                                ...availabilityForm,
                                branchId: branch.id,
                                date: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                            Desde
                          </label>

                          <input
                            type="time"
                            className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
                            value={
                              availabilityForm.branchId === branch.id
                                ? availabilityForm.startTime
                                : ""
                            }
                            onChange={(e) =>
                              setAvailabilityForm({
                                ...availabilityForm,
                                branchId: branch.id,
                                startTime: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                            Hasta
                          </label>

                          <input
                            type="time"
                            className="mt-2 w-full border border-[#DED9CD] bg-white p-3 outline-none focus:border-[#263F3B]"
                            value={
                              availabilityForm.branchId === branch.id
                                ? availabilityForm.endTime
                                : ""
                            }
                            onChange={(e) =>
                              setAvailabilityForm({
                                ...availabilityForm,
                                branchId: branch.id,
                                endTime: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          type="button"
                          onClick={() => saveAvailability(branch.id)}
                          className="bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]"
                        >
                          Agregar disponibilidad
                        </button>
                      </div>

                      <div className="mt-8 border-t border-[#DED9CD] pt-6">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                          Disponibilidades cargadas
                        </p>

                        <div className="space-y-3">
                          {availabilities
                            .filter((a) => a.branchId === branch.id)
                            .map((availability) => (
                              <div
                                key={availability.id}
                                className="flex items-center justify-between border border-[#DED9CD] bg-[#FCFBF8] px-5 py-4 text-sm"
                              >
                                <span>
                                  <strong>{availability.doctor.user?.name}</strong>{" "}
                                  — {new Date(availability.date).toLocaleDateString("es-AR")}{" "}
                                  — {availability.startTime} a {availability.endTime}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => deleteAvailability(availability.id)}
                                  className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-400 hover:underline"
                                >
                                  Eliminar
                                </button>
                              </div>
                            ))}

                          {availabilities.filter((a) => a.branchId === branch.id).length === 0 && (
                            <p className="border border-[#DED9CD] bg-[#FCFBF8] px-5 py-4 text-sm text-[#6B7774]">
                              Todavía no hay programación cargada para esta sucursal.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={saveBranchHours}
                  className="bg-[#263F3B] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]"
                >
                  Guardar sucursales
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}