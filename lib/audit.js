export async function safeInsertAuditLog(admin, payload) {
  try {
    await admin.from('audit_logs').insert(payload)
  } catch (error) {
    console.error('[audit_logs]', error)
  }
}
