import ClinicalAccessForm from "./ClinicalAccessForm";

export default function ClinicalAccessPage() {
  return (
    <main className="min-h-screen bg-[#F7F5EF] px-6 py-12 text-[#263F3B]">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
            Consultorios Nazaret
          </p>

          <h1 className="mt-3 font-serif text-4xl font-medium">
            Acceso a Historias Clínicas
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#6B7774]">
            Ingresá con el correo habilitado por el consultorio. Te enviaremos
            un código para verificar tu identidad.
          </p>
        </div>

        <ClinicalAccessForm />
      </div>
    </main>
  );
}