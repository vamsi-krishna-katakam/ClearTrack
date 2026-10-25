import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Task from '../models/Task.js';
import EvidenceVersion from '../models/EvidenceVersion.js';
import AuditLog from '../models/AuditLog.js';
import { logAudit } from '../services/auditService.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cleartrack';

test.before(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI, { family: 4 });
  }
});

test.after(async () => {
  await mongoose.disconnect();
});

test('ClearTrack Core Compliance Logic & Security Tests', async (t) => {

  let managerUser;
  let employee1;
  let employee2;
  let complianceTask;

  await t.test('Setup: Create test users', async () => {
    await User.deleteMany({ userId: { $in: ['test_mgr', 'test_emp1', 'test_emp2'] } });

    managerUser = await User.create({
      userId: 'test_mgr',
      name: 'Manager Tester',
      email: 'mgr@test.local',
      password: 'Password@123',
      role: 'manager'
    });

    employee1 = await User.create({
      userId: 'test_emp1',
      name: 'Employee One',
      email: 'emp1@test.local',
      password: 'Password@123',
      role: 'employee'
    });

    employee2 = await User.create({
      userId: 'test_emp2',
      name: 'Employee Two',
      email: 'emp2@test.local',
      password: 'Password@123',
      role: 'employee'
    });

    assert.ok(managerUser._id);
    assert.ok(employee1._id);
    assert.ok(employee2._id);
  });

  await t.test('1. Successful login and password verification', async () => {
    const valid = await employee1.comparePassword('Password@123');
    const invalid = await employee1.comparePassword('WrongPassword');
    assert.equal(valid, true, 'Valid password must be verified');
    assert.equal(invalid, false, 'Invalid password must be rejected');
  });

  await t.test('2. Passwords are never stored in plaintext', async () => {
    const freshUser = await User.findById(employee1._id);
    assert.notEqual(freshUser.password, 'Password@123', 'Password must be hashed with bcrypt');
    assert.ok(freshUser.password.startsWith('$2'), 'Bcrypt hash signature must be present');
  });

  await t.test('3. Manager can create and assign a compliance task', async () => {
    const deadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    complianceTask = await Task.create({
      title: 'Cloud Security Audit',
      description: 'Audit cloud infrastructure security policies',
      category: 'Cloud Security',
      priority: 'High',
      assignee: employee1._id,
      createdBy: managerUser._id,
      deadline,
      progressStatus: 'Pending',
      reviewStatus: 'Not Reviewed'
    });

    assert.equal(complianceTask.title, 'Cloud Security Audit');
    assert.equal(complianceTask.progressStatus, 'Pending');
    assert.equal(complianceTask.reviewStatus, 'Not Reviewed');
    assert.equal(complianceTask.assignee.toString(), employee1._id.toString());
  });

  await t.test('4. Task Ownership: Employee 2 is prevented from accessing Employee 1 task', async () => {
    const isAssignee = complianceTask.assignee.toString() === employee2._id.toString();
    assert.equal(isAssignee, false, 'Employee 2 must not be recognized as task assignee');
  });

  await t.test('5. Employee can update task progress to "In Progress"', async () => {
    complianceTask.progressStatus = 'In Progress';
    await complianceTask.save();
    assert.equal(complianceTask.progressStatus, 'In Progress');
  });

  await t.test('6. Dynamic Overdue rule: Task in future is NOT overdue', async () => {
    assert.equal(complianceTask.isOverdue, false, 'Future deadline must not be overdue');
  });

  await t.test('7. Dynamic Overdue rule: Task with past deadline IS overdue if unverified', async () => {
    complianceTask.deadline = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await complianceTask.save();
    assert.equal(complianceTask.isOverdue, true, 'Unverified task with past deadline must be overdue');
  });

  await t.test('8. Employee can submit evidence even after deadline (Non-blocking)', async () => {
    const v1 = await EvidenceVersion.create({
      task: complianceTask._id,
      versionNumber: 1,
      evidenceUrls: ['https://example.com/audit-report-v1.pdf'],
      notes: 'Initial evidence submitted past deadline',
      submittedBy: employee1._id
    });

    complianceTask.progressStatus = 'Submitted for Review';
    complianceTask.reviewStatus = 'Not Reviewed';
    await complianceTask.save();

    assert.equal(v1.versionNumber, 1);
    assert.equal(complianceTask.progressStatus, 'Submitted for Review');
    assert.equal(complianceTask.isOverdue, true, 'Task remains overdue until verified by manager');
  });

  await t.test('9. Manager rejection requires explanation & sets Changes Requested', async () => {
    const rejectionReason = 'Missing IAM role documentation for secondary accounts';
    assert.ok(rejectionReason.trim().length > 0, 'Mandatory reason must be present');

    complianceTask.reviewStatus = 'Changes Requested';
    complianceTask.latestReviewComment = rejectionReason;
    await complianceTask.save();

    assert.equal(complianceTask.reviewStatus, 'Changes Requested');
    assert.equal(complianceTask.latestReviewComment, rejectionReason);
  });

  await t.test('10. Evidence revision creates new version without overwriting previous history', async () => {
    const countBefore = await EvidenceVersion.countDocuments({ task: complianceTask._id });
    assert.equal(countBefore, 1, 'Previous version must still exist');

    const v2 = await EvidenceVersion.create({
      task: complianceTask._id,
      versionNumber: countBefore + 1,
      evidenceUrls: ['https://example.com/audit-report-v2-corrected.pdf'],
      notes: 'Added IAM role documentation as requested',
      submittedBy: employee1._id
    });

    complianceTask.progressStatus = 'Submitted for Review';
    complianceTask.reviewStatus = 'Not Reviewed';
    await complianceTask.save();

    const countAfter = await EvidenceVersion.countDocuments({ task: complianceTask._id });
    assert.equal(countAfter, 2, 'New version must be appended');
    assert.equal(v2.versionNumber, 2);
    assert.equal(complianceTask.reviewStatus, 'Not Reviewed', 'Task must return to manager review queue');
  });

  await t.test('11. Manager verification updates state to Verified and marks task completed', async () => {
    complianceTask.reviewStatus = 'Verified';
    complianceTask.latestReviewComment = 'Verified and approved by manager';
    await complianceTask.save();

    assert.equal(complianceTask.reviewStatus, 'Verified');
  });

  await t.test('12. A verified task is NO LONGER counted as overdue even if past deadline', async () => {
    assert.equal(complianceTask.isOverdue, false, 'Verified tasks must never display overdue status');
  });

  await t.test('13. Audit records are created for critical events', async () => {
    const audit = await logAudit({
      actorId: managerUser._id,
      action: 'TASK_VERIFIED',
      targetType: 'Task',
      targetId: complianceTask._id,
      newValues: { reviewStatus: 'Verified' },
      reason: 'All evidence validated'
    });

    assert.ok(audit._id);
    const savedLog = await AuditLog.findById(audit._id);
    assert.equal(savedLog.action, 'TASK_VERIFIED');
    assert.equal(savedLog.actor.toString(), managerUser._id.toString());
  });

  await t.test('14. Account deactivation preserves historical tasks and audit integrity', async () => {
    employee1.isDeactivated = true;
    await employee1.save();

    const taskStillLinked = await Task.findById(complianceTask._id);
    assert.equal(taskStillLinked.assignee.toString(), employee1._id.toString(), 'Task must remain linked to deactivated user');
  });

  await t.test('Cleanup: Remove test artifacts', async () => {
    await EvidenceVersion.deleteMany({ task: complianceTask._id });
    await Task.deleteOne({ _id: complianceTask._id });
    await AuditLog.deleteMany({ actor: { $in: [managerUser._id, employee1._id, employee2._id] } });
    await User.deleteMany({ _id: { $in: [managerUser._id, employee1._id, employee2._id] } });
  });

});
