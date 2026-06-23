export default function Hero() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-slate-50 px-6 pt-20">
      <div className="max-w-4xl text-center">
        <h1 className="text-6xl font-bold text-slate-900">
          Tu sonrisa, nuestra prioridad.
        </h1>

        <p className="mt-6 text-xl text-slate-600">
          Atención odontológica integral, tecnología moderna
          y profesionales especializados.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <button className="rounded-xl bg-teal-600 px-8 py-4 text-white">
            Solicitar turno
          </button>

          <button className="rounded-xl border px-8 py-4">
            Ver planes
          </button>
        </div>
      </div>
    </section>
  );
}