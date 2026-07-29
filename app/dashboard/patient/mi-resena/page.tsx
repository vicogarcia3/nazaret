"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Star } from "lucide-react";

type Testimonial = {
  id: string;
  rating: number;
  comment: string | null;
};

export default function PatientTestimonialPage() {
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTestimonial();
  }, []);

  async function loadTestimonial() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/testimonials", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo cargar la reseña.");
      }

      const loadedTestimonial = extractTestimonial(data);

      if (loadedTestimonial) {
        setTestimonial(loadedTestimonial);
        setRating(Number(loadedTestimonial.rating));
        setComment(loadedTestimonial.comment || "");
        setEditing(false);
      } else {
        setTestimonial(null);
        setRating(0);
        setComment("");
        setEditing(true);
      }

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al cargar la reseña."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (rating < 1 || rating > 5) {
      setError("Seleccioná una calificación entre 1 y 5 estrellas.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo guardar la reseña.");
      }

      const savedTestimonial = extractTestimonial(data);

      if (!savedTestimonial) {
        throw new Error("La respuesta de la reseña no es válida.");
      }

      setTestimonial(savedTestimonial);
      setRating(Number(savedTestimonial.rating));
      setComment(savedTestimonial.comment || "");
      setEditing(false);

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al guardar la reseña."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit() {
    if (!testimonial) return;

    setRating(testimonial.rating);
    setComment(testimonial.comment || "");
    setError("");
    setEditing(true);
  }

  function handleCancel() {
    if (!testimonial) return;

    setRating(testimonial.rating);
    setComment(testimonial.comment || "");
    setError("");
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 text-[#6B7774]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando reseña...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
          Tu experiencia
        </p>

        <h1 className="mt-3 font-serif text-4xl font-medium text-[#263F3B]">
          Mi reseña
        </h1>

        <p className="mt-3 max-w-2xl text-[#6B7774]">
          Compartí tu experiencia en el consultorio y ayudá a otros pacientes
          a conocernos.
        </p>
      </div>

      {!editing && testimonial ? (
        <article className="border border-[#DED9CD] bg-white p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF3EA]">
              <CheckCircle2 className="h-8 w-8 text-[#6F855F]" />
            </div>

            <h2 className="mt-5 font-serif text-3xl font-medium text-[#263F3B]">
              ¡Completaste tu reseña!
            </h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-[#6B7774]">
              Muchas gracias por compartir tu experiencia con nosotros.
            </p>

            <div className="mt-6 flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-7 w-7 ${
                    star <= Number(testimonial.rating)
                      ? "fill-[#D5A940] text-[#D5A940]"
                      : "fill-transparent text-[#D8D8D8]"
                  }`}
                />
              ))}
            </div>

            {testimonial.comment ? (
              <p className="mt-6 max-w-xl text-base italic leading-7 text-[#4F5E5A]">
                “{testimonial.comment}”
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleEdit}
              className="mt-8 border border-[#6F855F] px-8 py-3 text-sm font-medium text-[#6F855F] transition hover:bg-[#6F855F] hover:text-white"
            >
              Editar reseña
            </button>
          </div>
        </article>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="border border-[#DED9CD] bg-white p-8"
        >
          <div>
            <label className="block text-sm font-semibold text-[#263F3B]">
              Calificación
            </label>

            <p className="mt-1 text-sm text-[#6B7774]">
              Seleccioná de 1 a 5 estrellas.
            </p>

            <div
              className="mt-5 flex items-center gap-2"
              onMouseLeave={() => setHoveredRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const activeRating = hoveredRating || rating;
                const selected = star <= activeRating;

                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(star);
                      setError("");
                    }}
                    onMouseEnter={() => setHoveredRating(star)}
                    aria-label={`${star} ${
                      star === 1 ? "estrella" : "estrellas"
                    }`}
                    className="transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#A2B38B] focus:ring-offset-2"
                  >
                    <Star
                      className={`h-10 w-10 transition ${
                        selected
                          ? "fill-[#D5A940] text-[#D5A940]"
                          : "text-[#D8D8D8]"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {rating > 0 ? (
              <p className="mt-3 text-sm font-medium text-[#6F855F]">
                {getRatingLabel(rating)}
              </p>
            ) : null}
          </div>

          <div className="mt-8">
            <label
              htmlFor="testimonial-comment"
              className="block text-sm font-semibold text-[#263F3B]"
            >
              Comentario
            </label>

            <p className="mt-1 text-sm text-[#6B7774]">
              Contanos brevemente cómo fue tu experiencia.
            </p>

            <textarea
              id="testimonial-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={6}
              maxLength={800}
              placeholder="Escribí tu comentario..."
              className="mt-4 w-full resize-none border border-[#DED9CD] bg-[#FFFCF7] px-4 py-3 text-sm text-[#263F3B] outline-none transition placeholder:text-[#9AA5A2] focus:border-[#A2B38B]"
            />

            <div className="mt-2 flex justify-end">
              <span className="text-xs text-[#8B9693]">
                {comment.length}/800
              </span>
            </div>
          </div>

          {error ? (
            <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {testimonial ? (
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="border border-[#DED9CD] px-8 py-3 text-sm font-medium text-[#5F6F6B] transition hover:bg-[#F0EDE6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
            ) : null}

            <button
              type="submit"
              disabled={saving || rating === 0}
              className="flex items-center justify-center gap-2 bg-[#6F855F] px-8 py-3 text-sm font-medium text-white transition hover:bg-[#5F7452] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : testimonial ? (
                "Guardar cambios"
              ) : (
                "Enviar reseña"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function getRatingLabel(rating: number) {
  switch (rating) {
    case 1:
      return "Mala";
    case 2:
      return "Regular";
    case 3:
      return "Buena";
    case 4:
      return "Muy buena";
    case 5:
      return "Excelente";
    default:
      return "";
  }
}

function extractTestimonial(data: unknown): Testimonial | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const response = data as {
    testimonial?: Testimonial | null;
    id?: string;
    rating?: number;
    comment?: string | null;
  };

  if (response.testimonial !== undefined) {
    return response.testimonial;
  }

  if (response.id && response.rating !== undefined) {
    return response as Testimonial;
  }

  return null;
}