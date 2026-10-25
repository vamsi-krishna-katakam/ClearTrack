import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Task from '../models/Task.js';
import EvidenceVersion from '../models/EvidenceVersion.js';
import AuditLog from '../models/AuditLog.js';

async function seedDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cleartrack';

  try {
    await mongoose.connect(uri, { family: 4 });
    console.log('[Seed] Connected to MongoDB');

    // Clear existing collections for a clean, cohesive demo environment
    await User.deleteMany({});
    await Task.deleteMany({});
    await EvidenceVersion.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('[Seed] Cleared existing demo data');

    // -------------------------------------------------------------------------
    // 1. Seed Users (1 Manager + 4 Active Employees + 1 Deactivated Employee)
    // -------------------------------------------------------------------------
    const manager = await User.create({
      userId: 'manager',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@cleartrack.internal',
      password: 'Manager@123',
      role: 'manager',
      department: 'Compliance Operations',
      mustChangePassword: false
    });

    const emp1 = await User.create({
      userId: 'emp101',
      name: 'Rohan Verma',
      email: 'rohan.verma@cleartrack.internal',
      password: 'Employee@123',
      role: 'employee',
      department: 'Cloud Security',
      mustChangePassword: false
    });

    const emp2 = await User.create({
      userId: 'emp102',
      name: 'Sneha Reddy',
      email: 'sneha.reddy@cleartrack.internal',
      password: 'Employee@123',
      role: 'employee',
      department: 'Finance & Governance',
      mustChangePassword: false
    });

    const emp3 = await User.create({
      userId: 'emp103',
      name: 'Karthik Iyer',
      email: 'karthik.iyer@cleartrack.internal',
      password: 'Employee@123',
      role: 'employee',
      department: 'DevOps & Infrastructure',
      mustChangePassword: false
    });

    const emp4 = await User.create({
      userId: 'emp104',
      name: 'Priya Sharma',
      email: 'priya.sharma@cleartrack.internal',
      password: 'Employee@123',
      role: 'employee',
      department: 'Legal & Privacy',
      mustChangePassword: true
    });

    const empDeactivated = await User.create({
      userId: 'emp105',
      name: 'Rajesh Gupta (Contractor)',
      email: 'rajesh.gupta@external.internal',
      password: 'Employee@123',
      role: 'employee',
      department: 'External Audits',
      isDeactivated: true
    });

    console.log('[Seed] Created 6 user accounts across 5 departments');

    // -------------------------------------------------------------------------
    // 2. Seed Tasks & Evidence Versions Covering All Lifecycle States
    // -------------------------------------------------------------------------
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // Task 1: Pending start (Future deadline)
    const task1 = await Task.create({
      title: 'Annual SOC 2 Type II Access Control Review',
      description: 'Audit administrative IAM privileges across AWS production accounts. Export identity provider logs and confirm MFA enforcement on root accounts.',
      category: 'Access Governance',
      priority: 'High',
      assignee: emp1._id,
      createdBy: manager._id,
      deadline: new Date(now + 5 * day),
      progressStatus: 'Pending',
      reviewStatus: 'Not Reviewed'
    });

    // Task 2: In Progress & OVERDUE (Past deadline, unverified, non-blocking)
    const task2 = await Task.create({
      title: 'Database Encryption-at-Rest Verification',
      description: 'Verify and document that all primary MongoDB clusters and replica backup snapshots are encrypted with customer-managed KMS keys.',
      category: 'Data Protection',
      priority: 'Critical',
      assignee: emp1._id,
      createdBy: manager._id,
      deadline: new Date(now - 3 * day),
      progressStatus: 'In Progress',
      reviewStatus: 'Not Reviewed'
    });

    // Task 3: Submitted for Review (Awaiting manager action in Review Queue)
    const task3 = await Task.create({
      title: 'Quarterly Disaster Recovery & Backup Restoration Drill',
      description: 'Perform a cold-standby database failover simulation in staging. Measure Recovery Time Objective (RTO) and Recovery Point Objective (RPO).',
      category: 'Business Continuity',
      priority: 'High',
      assignee: emp3._id,
      createdBy: manager._id,
      deadline: new Date(now + 2 * day),
      progressStatus: 'Submitted for Review',
      reviewStatus: 'Not Reviewed',
      completionNotes: 'Simulated failure of primary us-east cluster. Automated failover achieved RTO of 4m 12s, beating our 15m SLA.'
    });

    await EvidenceVersion.create({
      task: task3._id,
      versionNumber: 1,
      evidenceUrls: [
        'https://internal-docs.cleartrack.io/dr-tests/2026-q4-failover-report.pdf',
        'https://monitoring.cleartrack.io/dashboards/dr-drill-recovery-graph'
      ],
      notes: 'Full runbook logs and Grafana latency metrics during simulated cutover.',
      submittedBy: emp3._id
    });

    // Task 4: Changes Requested (Rejection cycle with mandatory feedback)
    const task4 = await Task.create({
      title: 'PCI-DSS Quarterly External Vulnerability Assessment',
      description: 'Conduct automated network vulnerability scans against all cardholder data environment (CDE) endpoints through an Approved Scanning Vendor (ASV).',
      category: 'Payment Compliance',
      priority: 'Critical',
      assignee: emp1._id,
      createdBy: manager._id,
      deadline: new Date(now + 1 * day),
      progressStatus: 'In Progress',
      reviewStatus: 'Changes Requested',
      latestReviewComment: 'The submitted ASV report shows 2 unmitigated medium findings on api.gateway.internal (CVE-2024-38856). Please apply the patch and attach the clean re-scan report.'
    });

    await EvidenceVersion.create({
      task: task4._id,
      versionNumber: 1,
      evidenceUrls: [
        'https://security.cleartrack.io/scans/asv-scan-initial-run.pdf'
      ],
      notes: 'Initial scan executed on October 20.',
      submittedBy: emp1._id
    });

    // Task 5: Resubmitted Evidence (Version 2 after changes requested)
    const task5 = await Task.create({
      title: 'GDPR Article 30 Records of Processing Activities (RoPA)',
      description: 'Update personal data processing inventories across HR, Marketing, and Engineering systems to reflect new cross-border data transfer mechanisms.',
      category: 'Data Privacy',
      priority: 'High',
      assignee: emp4._id,
      createdBy: manager._id,
      deadline: new Date(now + 4 * day),
      progressStatus: 'Submitted for Review',
      reviewStatus: 'Not Reviewed',
      completionNotes: 'Updated the EU-US Data Privacy Framework clauses in Appendix C as requested by management.'
    });

    await EvidenceVersion.create({
      task: task5._id,
      versionNumber: 1,
      evidenceUrls: [
        'https://privacy.cleartrack.io/ropa/draft-v1.docx'
      ],
      notes: 'Initial draft inventory.',
      submittedBy: emp4._id
    });

    await EvidenceVersion.create({
      task: task5._id,
      versionNumber: 2,
      evidenceUrls: [
        'https://privacy.cleartrack.io/ropa/ropa-2026-final-signed.pdf',
        'https://legal.cleartrack.io/clauses/standard-contractual-clauses-addendum.pdf'
      ],
      notes: 'Version 2 with legal counsel sign-off and revised DPA standard contractual clauses.',
      submittedBy: emp4._id
    });

    // Task 6: Completed & Verified (Past deadline, but verified -> NOT overdue)
    const task6 = await Task.create({
      title: 'Annual Anti-Bribery & Whistleblower Policy Attestation',
      description: 'Coordinate employee training and collect 100% written or digital policy attestations from all permanent staff members.',
      category: 'Ethics & Governance',
      priority: 'Medium',
      assignee: emp2._id,
      createdBy: manager._id,
      deadline: new Date(now - 7 * day),
      progressStatus: 'Submitted for Review',
      reviewStatus: 'Verified',
      completionNotes: 'All 48 full-time personnel completed the compliance training module on LMS with passing scores.',
      latestReviewComment: 'Attestation records audited and cross-checked against HR payroll roster. Fully compliant.'
    });

    await EvidenceVersion.create({
      task: task6._id,
      versionNumber: 1,
      evidenceUrls: [
        'https://hr-portal.cleartrack.io/compliance/attestations-export-2026.csv',
        'https://lms.cleartrack.io/certificates/cohort-2026-summary.pdf'
      ],
      notes: 'Exported compliance CSV and training certificate bundle.',
      submittedBy: emp2._id
    });

    // Task 7: Infrastructure Hardening (Marcus Brody)
    await Task.create({
      title: 'Production Kubernetes CIS Benchmark Hardening',
      description: 'Execute kube-bench against all master and worker nodes. Remediate anonymous authentication and enable etcd client certificate validation.',
      category: 'Infrastructure Security',
      priority: 'Medium',
      assignee: emp3._id,
      createdBy: manager._id,
      deadline: new Date(now + 9 * day),
      progressStatus: 'Pending',
      reviewStatus: 'Not Reviewed'
    });

    // Task 8: Finance / Audit trail for deactivated user
    await Task.create({
      title: 'Legacy Vendor Risk Assessment Archive',
      description: 'Consolidate and archive 2024-2025 third-party vendor risk questionnaires into cold storage.',
      category: 'Vendor Risk',
      priority: 'Low',
      assignee: empDeactivated._id,
      createdBy: manager._id,
      deadline: new Date(now - 14 * day),
      progressStatus: 'Submitted for Review',
      reviewStatus: 'Verified',
      completionNotes: 'Archives transferred to encrypted Glacier vault.',
      latestReviewComment: 'Archive checksum verified.'
    });

    console.log('[Seed] Created 8 comprehensive tasks spanning all statuses and priorities');

    // -------------------------------------------------------------------------
    // 3. Seed Audit Trail Logs
    // -------------------------------------------------------------------------
    await AuditLog.create([
      {
        actor: manager._id,
        action: 'EMPLOYEE_CREATED',
        targetType: 'User',
        targetId: emp1._id,
        newValues: { userId: 'emp101', name: 'Rohan Verma', department: 'Cloud Security' },
        createdAt: new Date(now - 10 * day)
      },
      {
        actor: manager._id,
        action: 'TASK_CREATED',
        targetType: 'Task',
        targetId: task1._id,
        newValues: { title: task1.title, priority: task1.priority, deadline: task1.deadline },
        createdAt: new Date(now - 8 * day)
      },
      {
        actor: emp3._id,
        action: 'PROGRESS_UPDATED',
        targetType: 'Task',
        targetId: task3._id,
        previousValues: { progressStatus: 'Pending' },
        newValues: { progressStatus: 'In Progress' },
        createdAt: new Date(now - 4 * day)
      },
      {
        actor: emp3._id,
        action: 'EVIDENCE_SUBMITTED',
        targetType: 'Task',
        targetId: task3._id,
        newValues: { version: 1, evidenceCount: 2 },
        createdAt: new Date(now - 1 * day)
      },
      {
        actor: manager._id,
        action: 'CHANGES_REQUESTED',
        targetType: 'Task',
        targetId: task4._id,
        previousValues: { reviewStatus: 'Not Reviewed' },
        newValues: { reviewStatus: 'Changes Requested' },
        reason: 'Unmitigated medium findings on api.gateway.internal (CVE-2024-38856).',
        createdAt: new Date(now - 2 * day)
      },
      {
        actor: emp4._id,
        action: 'EVIDENCE_REVISED',
        targetType: 'Task',
        targetId: task5._id,
        newValues: { version: 2, note: 'Added legal counsel sign-off' },
        createdAt: new Date(now - 12 * 60 * 60 * 1000)
      },
      {
        actor: manager._id,
        action: 'TASK_VERIFIED',
        targetType: 'Task',
        targetId: task6._id,
        previousValues: { reviewStatus: 'Not Reviewed' },
        newValues: { reviewStatus: 'Verified' },
        reason: 'Attestation records audited and cross-checked against HR payroll roster.',
        createdAt: new Date(now - 2 * day)
      },
      {
        actor: manager._id,
        action: 'EMPLOYEE_DEACTIVATED',
        targetType: 'User',
        targetId: empDeactivated._id,
        reason: 'Contract concluded; account soft-deactivated to preserve historical compliance integrity.',
        createdAt: new Date(now - 5 * day)
      }
    ]);

    console.log('[Seed] Created realistic audit trail events');
    console.log('\n================================================================');
    console.log('                 CLEARTARCK DEMO CREDENTIALS                   ');
    console.log('================================================================');
    console.log('MANAGER:');
    console.log('  User ID  : manager (Rahul Sharma)');
    console.log('  Password : Manager@123');
    console.log('  Role     : Manager (Full administrative & review queue access)');
    console.log('----------------------------------------------------------------');
    console.log('EMPLOYEES:');
    console.log('  1. Rohan Verma   (Cloud Security) : emp101 / Employee@123');
    console.log('  2. Sneha Reddy   (Finance)        : emp102 / Employee@123');
    console.log('  3. Karthik Iyer  (DevOps)         : emp103 / Employee@123');
    console.log('  4. Priya Sharma  (Legal/Privacy)  : emp104 / Employee@123 (First-login demo)');
    console.log('  5. Rajesh Gupta  (Deactivated)    : emp105 / Employee@123 (Deactivated demo)');
    console.log('================================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error] Failed to seed database:', err);
    process.exit(1);
  }
}

seedDatabase();
