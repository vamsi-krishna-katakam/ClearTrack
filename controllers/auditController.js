import AuditLog from '../models/AuditLog.js';

// List audit trail events for managers
export async function listLogs(req, res) {
  try {
    const logs = await AuditLog.find()
      .populate('actor', 'name userId role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.render('audit/index', {
      title: 'Compliance Audit Trail',
      logs
    });
  } catch (err) {
    console.error('List audit logs error:', err);
    res.status(500).render('errors/500');
  }
}
