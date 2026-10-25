import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'USER_PASSWORD_CHANGED',
      'EMPLOYEE_CREATED',
      'EMPLOYEE_DEACTIVATED',
      'EMPLOYEE_UPDATED',
      'TASK_CREATED',
      'TASK_UPDATED',
      'DEADLINE_CHANGED',
      'PROGRESS_UPDATED',
      'EVIDENCE_SUBMITTED',
      'EVIDENCE_REVISED',
      'TASK_VERIFIED',
      'CHANGES_REQUESTED'
    ]
  },
  targetType: {
    type: String,
    enum: ['Task', 'User'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  previousValues: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  reason: {
    type: String,
    default: null
  }
}, { 
  collection: 'auditLogs',
  timestamps: { createdAt: true, updatedAt: false }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
