"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Star,
} from "lucide-react";

type Testimonial = {
  id: string;
  rating: number;
  comment: string | null;
  patientName: string;
};

type TestimonialsCarouselProps = {
  testimonials: Testimonial[];
  googleReviewsUrl: string;
};

export default function TestimonialsCarousel({
  testimonials,
  googleReviewsUrl,
}: TestimonialsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    slidesToScroll: 1,
  });

  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateButtons = useCallback(() => {
    if (!emblaApi) return;

    setCanScrollPrevious(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    updateButtons();

    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);

    return () => {
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi, updateButtons]);

  return (
    <div className="mt-10">
      {testimonials.length > 0 ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canScrollPrevious}
            aria-label="Ver reseñas anteriores"
            className="absolute left-0 top-1/2 z-10 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#A2B38B] bg-[#F7F5EF] text-[#6F855F] shadow-sm transition hover:bg-[#A2B38B] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div ref={emblaRef} className="overflow-hidden">
            <div className="-ml-5 flex">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="min-w-0 flex-[0_0_100%] pl-5 sm:flex-[0_0_50%] lg:flex-[0_0_33.333333%]"
                >
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canScrollNext}
            aria-label="Ver más reseñas"
            className="absolute right-0 top-1/2 z-10 hidden h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#A2B38B] bg-[#F7F5EF] text-[#6F855F] shadow-sm transition hover:bg-[#A2B38B] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="mt-6 flex justify-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canScrollPrevious}
              aria-label="Ver reseñas anteriores"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#A2B38B] text-[#6F855F] transition disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canScrollNext}
              aria-label="Ver más reseñas"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#A2B38B] text-[#6F855F] transition disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-[#DED9CD] bg-white px-6 py-10 text-center">
          <p className="text-sm text-gray-500">
            Todavía no hay testimonios publicados.
          </p>
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <a
          href={googleReviewsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-[#A2B38B] px-6 py-3 text-sm font-medium text-[#6F855F] transition hover:bg-[#A2B38B] hover:text-white"
        >
          <Star className="h-4 w-4 fill-[#D5A940] text-[#D5A940]" />
          Ver reseñas en Google
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

function TestimonialCard({
  testimonial,
}: {
  testimonial: Testimonial;
}) {
  const patientName = formatPatientName(testimonial.patientName);
  const initials = getInitials(testimonial.patientName);
  const rating = Number(testimonial.rating);

  return (
    <article className="flex h-full min-h-[310px] flex-col rounded-3xl border border-[#DED9CD] bg-white p-7 shadow-sm">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? "fill-[#D5A940] text-[#D5A940]"
                : "fill-transparent text-[#D8D8D8]"
            }`}
          />
        ))}
      </div>

      <blockquote className="mt-6 flex-1 text-base leading-7 text-gray-600">
        {testimonial.comment
          ? `“${testimonial.comment}”`
          : "El paciente compartió su calificación con el consultorio."}
      </blockquote>

      <div className="mt-7 flex items-center gap-3 border-t border-[#E7E2D8] pt-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E9EEE4] text-sm font-semibold text-[#6F855F]">
          {initials}
        </div>

        <div>
          <p className="font-semibold text-[#263F3B]">{patientName}</p>

          <p className="mt-1 flex items-center gap-1 text-xs text-[#6F855F]">
            <BadgeCheck className="h-4 w-4" />
            Paciente verificado
          </p>
        </div>
      </div>
    </article>
  );
}

function formatPatientName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "Paciente";
  if (parts.length === 1) return parts[0];

  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(
    0
  )}`.toUpperCase();
}