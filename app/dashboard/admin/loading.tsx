export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 rounded bg-[#E8E6DE]" />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-40 rounded-xl border border-[#DED9CD] bg-white p-6"
          >
            <div className="mb-4 h-4 w-28 rounded bg-[#E8E6DE]" />
            <div className="h-8 w-20 rounded bg-[#E8E6DE]" />
          </div>
        ))}
      </div>

      <div className="h-[420px] rounded-xl border border-[#DED9CD] bg-white" />
    </div>
  );
}