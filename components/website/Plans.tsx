export default function Plans() {
  return (
    <section
      id="planes"
      className="bg-slate-50 py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-12 text-center text-4xl font-bold">
          Nuestros planes
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-8 shadow">
            <h3 className="text-2xl font-bold">
              Plan Básico
            </h3>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow">
            <h3 className="text-2xl font-bold">
              Plan Familiar
            </h3>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow">
            <h3 className="text-2xl font-bold">
              Plan Premium
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
}