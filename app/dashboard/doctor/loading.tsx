export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 rounded bg-[#E8E6DE]" />

      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-44 rounded-xl border border-[#DED9CD] bg-white"
          />
        ))}
      </div>

      <div className="h-[400px] rounded-xl border border-[#DED9CD] bg-white" />
    </div>
  );
}