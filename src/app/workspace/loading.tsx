export default function WorkspaceLoading() {
  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 rounded-lg bg-[#0A1226] animate-pulse" />
        <div className="h-9 w-32 rounded-xl bg-[#0A1226] animate-pulse" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-[#0A1226] animate-pulse" />
        ))}
      </div>

      {/* Content rows */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-[#0A1226] animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
        ))}
      </div>
    </div>
  );
}
