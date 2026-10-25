import AuditLog from '../models/AuditLog.js';

// Append-only audit logger service
export async function logAudit({ actorId, action, targetType, targetId, previousValues = null, newValues = null, reason = null }) {
  try {
    return await AuditLog.create({
      actor: actorId,
      action,
      targetType,
      targetId,
      previousValues,
      newValues,
      reason
    });
  } catch (error) {
    console.error('[Audit Log Error] Failed to write audit trail:', error.message);
  }
}
