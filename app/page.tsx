export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between p-6 border-b">
        <h1 className="text-2xl font-bold">
          Consultorios Nazaret
        </h1>

        <a
          href="/login"
          className="rounded-lg bg-teal-600 px-5 py-2 text-white"
        >
          Iniciar sesión
        </a>
      </header>

      <section className="flex min-h-[80vh] flex-col items-center justify-center text-center">
        <h2 className="text-6xl font-bold">
          Tu sonrisa, nuestra prioridad.
        </h2>

        <p className="mt-6 text-xl text-gray-500">
          Atención odontológica integral.
        </p>
      </section>
    </main>
  );
}