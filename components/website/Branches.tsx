export default function Branches() {
  return (
    <section
      id="sucursales"
      className="mx-auto max-w-7xl py-24 px-6"
    >
      <h2 className="mb-12 text-center text-4xl font-bold">
        Nuestras sucursales
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border p-8">
          <h3 className="text-2xl font-bold">
            Córdoba Capital
          </h3>
        </div>

        <div className="rounded-2xl border p-8">
          <h3 className="text-2xl font-bold">
            Ballesteros
          </h3>
        </div>
      </div>
    </section>
  );
}