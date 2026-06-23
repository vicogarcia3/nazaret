export default function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold text-teal-700">
          Nazaret
        </h1>

        <nav className="hidden gap-8 md:flex">
          <a href="#servicios">Servicios</a>
          <a href="#planes">Planes</a>
          <a href="#sucursales">Sucursales</a>
          <a href="#contacto">Contacto</a>
        </nav>

        <a
          href="/login"
          className="rounded-lg bg-teal-600 px-4 py-2 text-white"
        >
          Ingresar
        </a>
      </div>
    </header>
  );
}