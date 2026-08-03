type PageNavigationProps = {
  page: number;
  totalPages: number;
  onPrevious?: () => void;
  onNext?: () => void;
};

export default function PageNavigation({
  page,
  totalPages,
  onPrevious,
  onNext,
}: PageNavigationProps) {
  const isFirstPage = page === 1;
  const isLastPage = page === totalPages;

  return (
    <div className="flex justify-center print:hidden">
      <div className="inline-flex items-center gap-3 rounded-full border border-[#DED9CD] bg-white px-3 py-2 shadow-[0_8px_22px_rgba(38,63,59,0.10)]">
        <button
          type="button"
          onClick={onPrevious}
          disabled={isFirstPage}
          aria-label="Página anterior"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DED9CD] bg-white text-xl leading-none text-[#263F3B] transition hover:border-[#A2B38B] hover:bg-[#A2B38B] hover:text-white disabled:cursor-default disabled:opacity-30 disabled:hover:border-[#DED9CD] disabled:hover:bg-white disabled:hover:text-[#263F3B]"
        >
          ‹
        </button>

        <span className="min-w-[120px] text-center text-sm text-[#64716E]">
          Página{" "}
          <strong className="font-semibold text-[#263F3B]">
            {page}
          </strong>{" "}
          de{" "}
          <strong className="font-semibold text-[#263F3B]">
            {totalPages}
          </strong>
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={isLastPage}
          aria-label="Página siguiente"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DED9CD] bg-white text-xl leading-none text-[#263F3B] transition hover:border-[#A2B38B] hover:bg-[#A2B38B] hover:text-white disabled:cursor-default disabled:opacity-30 disabled:hover:border-[#DED9CD] disabled:hover:bg-white disabled:hover:text-[#263F3B]"
        >
          ›
        </button>
      </div>
    </div>
  );
}