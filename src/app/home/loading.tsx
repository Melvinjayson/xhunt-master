export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-[#050816] flex flex-col">
      {/* Top bar */}
      <div className="h-14 border-b border-[#0F1D35] flex items-center px-4 gap-3">
        <div className="h-7 w-24 rounded-lg bg-[#0A1226] animate-pulse" />
        <div className="flex-1" />
        <div className="h-8 w-8 rounded-full bg-[#0A1226] animate-pulse" />
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-4">
        <div className="h-32 rounded-2xl bg-[#0A1226] animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-[#0A1226] animate-pulse" />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-[#0A1226] animate-pulse" style={{ opacity: 1 - i * 0.2 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
