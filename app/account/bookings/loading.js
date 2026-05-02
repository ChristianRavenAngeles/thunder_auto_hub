export default function BookingsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-[var(--border)] rounded mb-6" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-1.5">
              <div className="h-5 w-32 bg-[var(--border)] rounded" />
              <div className="h-3 w-48 bg-[var(--border)] rounded" />
            </div>
            <div className="h-6 w-24 bg-[var(--border)] rounded-full" />
          </div>
          <div className="flex gap-4 mt-3">
            <div className="h-3 w-28 bg-[var(--border)] rounded" />
            <div className="h-3 w-20 bg-[var(--border)] rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
