"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

type Service = {
  id: string;
  title: string;
  description: string;
  image: string | null;
};

type ServicesCarouselProps = {
  services: Service[];
};

export default function ServicesCarousel({
  services,
}: ServicesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (services.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentIndex((current) =>
        current === services.length - 1 ? 0 : current + 1
      );
    }, 7000);

    return () => {
      window.clearInterval(interval);
    };
  }, [services.length]);

  if (services.length === 0) {
    return null;
  }

  function previousService() {
    setCurrentIndex((current) =>
      current === 0 ? services.length - 1 : current - 1
    );
  }

  function nextService() {
    setCurrentIndex((current) =>
      current === services.length - 1 ? 0 : current + 1
    );
  }

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#A2B38B]">
            Especialidades
          </p>

          <h2 className="mt-3 font-serif text-4xl font-medium text-[#263F3B]">
            Nuestros servicios
          </h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#DED9CD] bg-[#F7F5EF]">
          <div className="relative aspect-[16/7] overflow-hidden">
            <div
              className="flex h-full transition-transform duration-[1200ms] ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {services.map((service) => (
                <article
                  key={service.id}
                  className="relative h-full min-w-full"
                >
                  <Image
                    src={service.image || ""}
                    alt={service.title}
                    fill
                    priority={currentIndex === 0}
                    sizes="100vw"
                    className="object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />

                  <div className="absolute inset-y-0 left-0 flex max-w-2xl flex-col justify-center px-20 text-white md:px-24">

                    <h3 className="mt-3 font-serif text-4xl font-medium md:text-5xl">
                      {service.title}
                    </h3>

                    {service.description && (
                      <p className="mt-4 max-w-xl text-sm leading-7 text-white/90 md:text-base">
                        {service.description}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {services.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={previousService}
                  aria-label="Servicio anterior"
                  className="absolute left-6 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/90 text-[#263F3B] shadow transition hover:bg-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={nextService}
                  aria-label="Servicio siguiente"
                  className="absolute right-6 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/90 text-[#263F3B] shadow transition hover:bg-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {services.length > 1 && (
            <div className="flex justify-center gap-2 bg-white py-4">
              {services.map((service, index) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Mostrar servicio ${index + 1}`}
                  className={`h-2.5 rounded-full transition ${
                    currentIndex === index
                      ? "w-7 bg-[#263F3B]"
                      : "w-2.5 bg-[#C9CEC5]"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}