export default function AdminBookingsLoading() {
  return (
    <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
      <div style={{ height: 32, width: 180, background: '#2A2A2A', borderRadius: 8, marginBottom: 24 }} />
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #2A2A2A', display: 'flex', gap: 12 }}>
          <div style={{ height: 36, flex: 1, background: '#2A2A2A', borderRadius: 8 }} />
          <div style={{ height: 36, width: 120, background: '#2A2A2A', borderRadius: 8 }} />
          <div style={{ height: 36, width: 100, background: '#2A2A2A', borderRadius: 8 }} />
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', borderBottom: '1px solid #1E1E1E' }}>
            <div style={{ height: 13, width: 110, background: '#2A2A2A', borderRadius: 5 }} />
            <div style={{ height: 13, width: 90, background: '#2A2A2A', borderRadius: 5 }} />
            <div style={{ height: 13, width: 120, background: '#2A2A2A', borderRadius: 5, flex: 1 }} />
            <div style={{ height: 22, width: 72, background: '#2A2A2A', borderRadius: 40 }} />
            <div style={{ height: 13, width: 60, background: '#2A2A2A', borderRadius: 5 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
