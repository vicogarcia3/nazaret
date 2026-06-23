export default function Services() {
  const services = [
    "Odontología general",
    "Ortodoncia",
    "Implantes",
    "Endodoncia",
    "Odontopediatría",
    "Estética dental",
  ];

  return (
    <section
      id="servicios"
      className="mx-auto max-w-7xl py-24 px-6"
    >
      <h2 className="mb-12 text-center text-4xl font-bold">
        Especialidades
      </h2>

      <div className="grid gap-6 md:grid-cols-3">
        {services.map((service) => (
          <div
            key={service}
            className="rounded-2xl border bg-white p-8 shadow-sm"
          >
            <h3 className="text-xl font-semibold">
              {service}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
}