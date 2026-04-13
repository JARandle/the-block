export function SkeletonCard() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50"
      aria-hidden
    >
      <div className="aspect-[16/10] bg-slate-800" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/4 rounded bg-slate-800" />
        <div className="h-4 w-1/2 rounded bg-slate-800" />
        <div className="h-4 w-full rounded bg-slate-800" />
        <div className="flex justify-between pt-3">
          <div className="h-10 w-24 rounded bg-slate-800" />
          <div className="h-4 w-20 rounded bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
