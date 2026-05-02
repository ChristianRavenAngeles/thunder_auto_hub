export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 20 }}>
            <div style={{ height: 14, width: 80, background: '#2A2A2A', borderRadius: 6, marginBottom: 12 }} />
            <div style={{ height: 28, width: 56, background: '#2A2A2A', borderRadius: 6, marginBottom: 6 }} />
            <div style={{ height: 10, width: 100, background: '#2A2A2A', borderRadius: 6 }} />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2A2A2A' }}>
          <div style={{ height: 16, width: 140, background: '#2A2A2A', borderRadius: 6 }} />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid #1E1E1E' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2A2A2A', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ height: 13, width: 120, background: '#2A2A2A', borderRadius: 5 }} />
              <div style={{ height: 13, width: 80, background: '#2A2A2A', borderRadius: 5 }} />
              <div style={{ height: 13, width: 60, background: '#2A2A2A', borderRadius: 5 }} />
            </div>
            <div style={{ height: 22, width: 72, background: '#2A2A2A', borderRadius: 40 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
