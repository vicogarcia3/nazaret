"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

type HeaderProps = {
  clinicName?: string | null;
  showServices?: boolean;
  showHealthInsurances: boolean;
};

export default function Header({
  clinicName,
  showServices = true,
  showHealthInsurances = false,
}: HeaderProps) {

  const navigationItems = [
    ...(showServices
      ? [
          {
            label: "Servicios",
            href: "#servicios",
          },
        ]
      : []),

    {
      label: "Equipo",
      href: "#equipo",
    },

    ...(showHealthInsurances
      ? [
          {
            label: "Obras Sociales",
            href: "#obras-sociales",
          },
        ]
      : []),

    {
      label: "Testimonios",
      href: "#testimonios",
    },

    {
      label: "Contacto",
      href: "#contacto",
    },
  ];
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b transition ${
        scrolled || menuOpen
          ? "border-[#DED9CD] bg-[#F7F5EF]/95 shadow-sm backdrop-blur-md"
          : "border-transparent bg-[#F7F5EF]"
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-8 md:px-12 lg:px-16">
        <Link
          href="/"
          onClick={closeMenu}
          className="min-w-0"
        >
          <span className="block truncate font-serif text-base font-semibold uppercase tracking-tight text-gray-800 sm:text-xl">
            {clinicName || "Consultorios Nazaret"}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-xs font-medium uppercase tracking-widest lg:flex">
          {navigationItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[#263F3B] transition hover:text-[#8FA178]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-full border border-[#A2B38B] px-4 py-2.5 text-sm text-[#6F7F5F] transition hover:bg-white"
          >
            Iniciar sesión
          </Link>

          <Link
            href="/dashboard/patient/turnos"
            className="rounded-full bg-[#A2B38B] px-5 py-2.5 text-sm text-white transition hover:bg-[#8FA178]"
          >
            Reservar turno
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/dashboard/patient/turnos"
            className="hidden rounded-full bg-[#A2B38B] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#8FA178] sm:inline-flex"
          >
            Reservar
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={
              menuOpen
                ? "Cerrar menú de navegación"
                : "Abrir menú de navegación"
            }
            aria-expanded={menuOpen}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#A2B38B] text-[#263F3B] transition hover:bg-white"
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden border-[#DED9CD] bg-[#F7F5EF] transition-all duration-300 ease-in-out lg:hidden ${
          menuOpen
            ? "max-h-[520px] border-t opacity-100"
            : "max-h-0 border-t-0 opacity-0"
        }`}
      >
        <div className="px-4 py-6 sm:px-8">
          <nav className="flex flex-col">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="border-b border-[#DED9CD] py-4 text-sm font-medium uppercase tracking-[0.18em] text-[#263F3B] transition hover:pl-2 hover:text-[#8FA178]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/login"
              onClick={closeMenu}
              className="flex items-center justify-center rounded-full border border-[#A2B38B] px-5 py-3 text-sm font-medium text-[#6F7F5F] transition hover:bg-white"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/dashboard/patient/turnos"
              onClick={closeMenu}
              className="flex items-center justify-center rounded-full bg-[#A2B38B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#8FA178]"
            >
              Reservar turno
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}