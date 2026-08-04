export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-60 rounded bg-[#E8E6DE]" />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-60 rounded-xl border border-[#DED9CD] bg-white" />
        <div className="h-60 rounded-xl border border-[#DED9CD] bg-white" />
      </div>

      <div className="h-72 rounded-xl border border-[#DED9CD] bg-white" />
    </div>
  );
}