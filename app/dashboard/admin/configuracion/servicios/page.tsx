"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
import DoctorScheduleManager from "@/components/admin/DoctorScheduleManager";
import ImageUploader from "@/components/admin/ImageUploader";

type Service = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  active: boolean;
};

type Doctor = {
  id: string;
  name: string | null;
  user: {
    name: string;
    email: string;
  } | null;
  specialty: string | null;
  description: string | null;
  photo: string | null;
  active: boolean;
  visible: boolean;
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

type Testimonial = {
  id: string;
  rating: number;
  comment: string | null;
  visible: boolean;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
  patient: {
    firstName: string;
    lastName: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    } | null;
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
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const doctorFormRef = useRef<HTMLFormElement>(null);
  const editSectionRef = useRef<HTMLFormElement>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(false);
  const [updatingTestimonialId, setUpdatingTestimonialId] =
    useState<string | null>(null);

  const [doctorForm, setDoctorForm] = useState<{
    name: string;
    email: string;
    specialty: string;
    description: string;
    photo: string;
    active: boolean;
    visible: boolean;
    branchIds: string[];
  }>({
    name: "",
    email: "",
    specialty: "",
    description: "",
    photo: "",
    active: true,
    visible: true,
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
    googleReviewsUrl: "",
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

    toast.success("Sucursales guardadas.");
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
    loadTestimonials();
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
      name: doctor.name || doctor.user?.name || "",
      email: doctor.user?.email || "",
      specialty: doctor.specialty || "",
      description: doctor.description || "",
      photo: doctor.photo || "",
      active: doctor.active,
      visible: doctor.visible,
      branchIds: doctor.branches.map((branch) => branch.branchId),
    });
    setShowDoctorForm(true);

    requestAnimationFrame(() => {
      doctorFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const url = editingId
      ? `/api/services/${editingId}`
      : "/api/services";

    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      toast.error("No se pudo guardar el servicio.");
      return;
    }

    resetForm();
    setShowServiceForm(false);
    await loadServices();
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
      active: true,
      visible: doctorForm.active,
      branchIds: doctorForm.branchIds,
    }),
  });

  if (!res.ok) {
    const data = await res.json();
    toast.error("No se pudo guardar el especialista.");
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
    visible: true,
    branchIds: [],
  });

  // 👇 Cerrar el formulario después de guardar
  setShowDoctorForm(false);

  await loadDoctors();
}

async function loadContact() {
  const res = await fetch("/api/site-config");
  const data = await res.json();

  if (data) {
    setContactForm({
      whatsapp: data.whatsapp || "",
      instagram: data.instagram || "",
      facebook: data.facebook || "",
      googleReviewsUrl: data.googleReviewsUrl || "",
      businessHoursWeek: data.businessHoursWeek || "",
      businessHoursSaturday: data.businessHoursSaturday || "",
      businessHoursSunday: data.businessHoursSunday || "",
    });
  }
}

async function loadTestimonials() {
  try {
    setLoadingTestimonials(true);

    const res = await fetch("/api/testimonials", {
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error("No se pudieron cargar los testimonios.");
      setTestimonials([]);
      return;
    }

    setTestimonials(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Error al cargar testimonios:", error);
    setTestimonials([]);
  } finally {
    setLoadingTestimonials(false);
  }
}

async function updateTestimonial(
  id: string,
  changes: {
    approved?: boolean;
    visible?: boolean;
  }
) {
  try {
    setUpdatingTestimonialId(id);

    const res = await fetch(`/api/testimonials/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(changes),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error("No se pudo actualizar el testimonio.");
      return;
    }

    setTestimonials((currentTestimonials) =>
      currentTestimonials.map((testimonial) =>
        testimonial.id === id
          ? {
              ...testimonial,
              ...data,
            }
          : testimonial
      )
    );
  } catch (error) {
    console.error("Error al actualizar testimonio:", error);
    toast.error("No se pudo actualizar el testimonio.");
  } finally {
    setUpdatingTestimonialId(null);
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

  toast.success("Datos de contacto guardados.");
}

  function startEdit(service: Service) {
    setEditingId(service.id);
    setShowServiceForm(true);

    setForm({
      title: service.title,
      description: service.description,
      image: service.image || "",
      active: service.active,
    });

    requestAnimationFrame(() => {
      editSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
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

  const approvedTestimonials = testimonials.filter(
    (testimonial) => testimonial.approved
  ).length;

  const pendingTestimonials = testimonials.filter(
    (testimonial) => !testimonial.approved
  ).length;

  const visibleTestimonials = testimonials.filter(
    (testimonial) => testimonial.visible
  ).length;

  const averageRating =
    testimonials.length > 0
      ? testimonials.reduce(
          (total, testimonial) => total + testimonial.rating,
          0
        ) / testimonials.length
      : 0;

  function getInitials(name: string) {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("");
  }

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
                onClick={() => {
                  if (showServiceForm) {
                    resetForm();
                    setShowServiceForm(false);
                    return;
                  }

                  resetForm();
                  setShowServiceForm(true);

                  requestAnimationFrame(() => {
                    editSectionRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  });
                }}
                className="flex items-center gap-2 bg-[#263F3B] px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]"
              >
                <Plus className="h-4 w-4" />
                {showServiceForm ? "Cerrar" : "Agregar servicio"}
              </button>
            </div>

            <div className="space-y-6">
              {showServiceForm && (
                <form
                  ref={editSectionRef}
                  onSubmit={handleSubmit}
                  className="scroll-mt-6 border border-[#DED9CD] bg-white p-8"
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

                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                          Título
                        </label>

                        <input
                          className="mt-3 w-full border border-[#DED9CD] bg-white p-2 outline-none focus:border-[#263F3B]"
                          value={form.title}
                          onChange={(e) =>
                            setForm((current) => ({
                              ...current,
                              title: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div>
                        <ImageUploader
                          value={form.image}
                          onChange={(image) =>
                            setForm((current) => ({
                              ...current,
                              image,
                            }))
                          }
                          aspect={16 / 7}
                          label="Imagen del servicio"
                          emptyText="Subir imagen"
                          previewAlt={form.title || "Servicio"}
                          previewClassName="h-full w-full object-cover"
                        />
                      </div>
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
                        onClick={() => {
                          resetForm();
                          setShowServiceForm(false);
                        }}
                        className="border border-[#DED9CD] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] hover:bg-[#F7F5EF]"
                      >
                        Cancelar
                      </button>
                    )}

                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]"
                    >
                      <Save className="h-4 w-4" />
                      {editingId ? "Guardar cambios" : "Guardar servicio"}
                    </button>
                  </div>
                </form>
              )}

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
                onClick={() => {

                  if (showDoctorForm) {

                    setEditingDoctorId(null);

                    setDoctorForm({
                      name: "",
                      email: "",
                      specialty: "",
                      description: "",
                      photo: "",
                      active: true,
                      visible: true,
                      branchIds: [],
                    });

                    setShowDoctorForm(false);

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
                    visible: true,
                    branchIds: [],
                  });

                  setShowDoctorForm(true);

                  requestAnimationFrame(() => {
                    doctorFormRef.current?.scrollIntoView({
                      behavior: "smooth",
                    });
                  });

                }}
                className="flex items-center gap-2 bg-[#263F3B] px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]"
              >
                <Plus className="h-4 w-4" />

                {showDoctorForm
                  ? "Cerrar"
                  : "Agregar especialista"}
              </button>
            </div>

            {showDoctorForm && (
              <form
              ref={doctorFormRef}
                onSubmit={handleDoctorSubmit}
                className="scroll-mt-6 border border-[#DED9CD] bg-white p-8"
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

                <div className="mb-6">
                  <ImageUploader
                    value={doctorForm.photo}
                    onChange={(photo) =>
                      setDoctorForm((current) => ({
                        ...current,
                        photo,
                      }))
                    }
                    aspect={1}
                    label="Foto del especialista"
                    emptyText="Subir foto"
                    previewAlt={
                      doctorForm.name || "Especialista"
                    }
                    previewClassName="h-full w-full object-cover"
                  />
                </div>

                <div>
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

                <div className="mt-6 flex justify-end">
                  <button className="bg-[#263F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]">
                    {editingDoctorId
                      ? "Guardar cambios"
                      : "Guardar especialista"}
                  </button>
                </div>
              </form>
            )}

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
                              name: doctor.name || doctor.user?.name || "",
                              email: doctor.user?.email || "",
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
                          toast.error("No se pudo eliminar al especialista.");
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
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden bg-[#E4E8E0] text-3xl font-semibold uppercase text-[#8A9A87]">
                    {doctor.photo ? (
                      <img
                        src={doctor.photo}
                        alt={doctor.name || doctor.user?.name || "Especialista"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(doctor.name || doctor.user?.name || "") || "N"
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                      Nombre completo
                    </p>

                    <p className="mt-2 border border-[#DED9CD] p-2">
                      {doctor.name || doctor.user?.name || "Especialista"}
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
          <section className="space-y-8">
            <div className="border border-[#DED9CD] bg-white p-8">
              <Star className="mb-5 h-5 w-5 text-[#A2B38B]" />

              <h2 className="font-[var(--font-cormorant)] text-4xl font-medium">
                Testimonios
              </h2>

              <p className="mt-2 text-sm text-[#6B7774]">
                Revisá, aprobá y administrá las opiniones publicadas por los
                pacientes.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-4">
                <TestimonialStatCard
                  label="Total"
                  value={testimonials.length.toString()}
                />

                <TestimonialStatCard
                  label="Promedio"
                  value={
                    testimonials.length > 0
                      ? averageRating.toFixed(1)
                      : "0.0"
                  }
                  suffix=" / 5"
                />

                <TestimonialStatCard
                  label="Aprobadas"
                  value={approvedTestimonials.toString()}
                />

                <TestimonialStatCard
                  label="Pendientes"
                  value={pendingTestimonials.toString()}
                />
              </div>
            </div>

            <div className="space-y-5">
              {loadingTestimonials && (
                <div className="border border-[#DED9CD] bg-white p-8 text-sm text-[#6B7774]">
                  Cargando testimonios...
                </div>
              )}

              {!loadingTestimonials && testimonials.length === 0 && (
                <div className="border border-[#DED9CD] bg-white p-8 text-center">
                  <Star className="mx-auto h-8 w-8 text-[#A2B38B]" />

                  <h3 className="mt-4 font-serif text-2xl">
                    Todavía no hay testimonios
                  </h3>

                  <p className="mt-2 text-sm text-[#6B7774]">
                    Cuando un paciente publique una reseña, aparecerá en esta
                    sección.
                  </p>
                </div>
              )}

              {!loadingTestimonials &&
                testimonials.map((testimonial) => {
                  const patientName =
                    testimonial.patient.user?.name?.trim() ||
                    `${testimonial.patient.firstName} ${testimonial.patient.lastName}`;

                  const initials = patientName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((word) => word[0]?.toUpperCase())
                    .join("");

                  const isUpdating =
                    updatingTestimonialId === testimonial.id;

                  return (
                    <article
                      key={testimonial.id}
                      className="border border-[#DED9CD] bg-white p-7"
                    >
                      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E4E8E0] text-sm font-semibold text-[#263F3B]">
                            {testimonial.patient.user?.image ? (
                              <img
                                src={testimonial.patient.user.image}
                                alt={patientName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              initials || "P"
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate font-serif text-2xl">
                              {patientName}
                            </h3>

                            <p className="mt-1 text-xs text-[#6B7774]">
                              Publicada el{" "}
                              {new Date(
                                testimonial.createdAt
                              ).toLocaleDateString("es-AR")}
                            </p>

                            <div
                              className="mt-3 flex gap-1"
                              aria-label={`${testimonial.rating} de 5 estrellas`}
                            >
                              {Array.from({ length: 5 }).map((_, index) => (
                                <Star
                                  key={index}
                                  className={`h-5 w-5 ${
                                    index < testimonial.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "fill-transparent text-[#DED9CD]"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                              testimonial.approved
                                ? "border-[#A2B38B] bg-[#F2F5EF] text-[#56705F]"
                                : "border-[#E3C98A] bg-[#FFF8E8] text-[#927025]"
                            }`}
                          >
                            {testimonial.approved
                              ? "Aprobada"
                              : "Pendiente"}
                          </span>

                          <span
                            className={`border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                              testimonial.visible
                                ? "border-[#A2B38B] bg-[#F2F5EF] text-[#56705F]"
                                : "border-[#D8CACA] bg-[#FAF3F3] text-[#9A6868]"
                            }`}
                          >
                            {testimonial.visible ? "Visible" : "Oculta"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 border border-[#DED9CD] bg-[#FCFBF8] p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                          Comentario
                        </p>

                        <p className="mt-3 whitespace-pre-wrap leading-7 text-[#263F3B]">
                          {testimonial.comment?.trim() ||
                            "El paciente dejó una calificación sin comentario."}
                        </p>
                      </div>

                      <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[#DED9CD] pt-5">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            updateTestimonial(testimonial.id, {
                              approved: !testimonial.approved,
                            })
                          }
                          className={`border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            testimonial.approved
                              ? "border-[#DED9CD] text-[#6B7774] hover:bg-[#F7F5EF]"
                              : "border-[#263F3B] bg-[#263F3B] text-white hover:bg-[#1D302D]"
                          }`}
                        >
                          {testimonial.approved
                            ? "Quitar aprobación"
                            : "Aprobar"}
                        </button>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            updateTestimonial(testimonial.id, {
                              visible: !testimonial.visible,
                            })
                          }
                          className="border border-[#DED9CD] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#263F3B] transition hover:bg-[#F7F5EF] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {testimonial.visible
                            ? "Ocultar del sitio"
                            : "Mostrar en el sitio"}
                        </button>
                      </div>
                    </article>
                  );
                })}
            </div>

            {testimonials.length > 0 && (
              <div className="border border-[#DED9CD] bg-white px-6 py-4 text-sm text-[#6B7774]">
                <strong className="text-[#263F3B]">
                  {visibleTestimonials}
                </strong>{" "}
                testimonios están configurados como visibles. Solo aparecerán
                públicamente aquellos que además estén aprobados.
              </div>
            )}
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

                    <DoctorScheduleManager
                      branch={branch}
                      doctors={doctors}
                    />
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

function TestimonialStatCard({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="border border-[#DED9CD] bg-[#FCFBF8] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
        {label}
      </p>

      <p className="mt-3 text-3xl font-medium text-[#263F3B]">
        {value}
        {suffix && (
          <span className="ml-1 text-base text-[#6B7774]">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}