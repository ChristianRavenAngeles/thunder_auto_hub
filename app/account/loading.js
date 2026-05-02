export default function AccountLoading() {
  return (
    <div className="space-y-6 max-w-4xl animate-pulse">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-4">
            <div className="h-5 w-5 bg-[var(--border)] rounded mb-3" />
            <div className="h-7 w-16 bg-[var(--border)] rounded mb-1" />
            <div className="h-3 w-24 bg-[var(--border)] rounded" />
          </div>
        ))}
      </div>
      {/* Recent bookings */}
      <div className="card p-5">
        <div className="h-5 w-40 bg-[var(--border)] rounded mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-[var(--border)] rounded" />
                <div className="h-3 w-48 bg-[var(--border)] rounded" />
              </div>
              <div className="h-6 w-20 bg-[var(--border)] rounded-full" />
            </div>
          ))}
        </div>
      </div>
      {/* Vehicles */}
      <div className="card p-5">
        <div className="h-5 w-28 bg-[var(--border)] rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="border border-[var(--border)] rounded-xl p-4">
              <div className="h-4 w-36 bg-[var(--border)] rounded mb-2" />
              <div className="h-3 w-20 bg-[var(--border)] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
