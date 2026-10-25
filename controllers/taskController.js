import Task from '../models/Task.js';
import User from '../models/User.js';
import EvidenceVersion from '../models/EvidenceVersion.js';
import { logAudit } from '../services/auditService.js';

// List tasks with filtering
export async function listTasks(req, res) {
  try {
    const isManager = req.user.role === 'manager';
    const query = {};

    // Ownership filter: Employees only see their own tasks
    if (!isManager) {
      query.assignee = req.user._id;
    } else if (req.query.employee) {
      query.assignee = req.query.employee;
    }

    if (req.query.status) {
      query.progressStatus = req.query.status;
    }

    if (req.query.reviewStatus) {
      query.reviewStatus = req.query.reviewStatus;
    }

    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    const tasks = await Task.find(query)
      .populate('assignee', 'name userId department')
      .populate('createdBy', 'name')
      .sort({ deadline: 1 });

    // Optional filter by overdue dynamically
    let filteredTasks = tasks;
    if (req.query.overdue === 'true') {
      filteredTasks = tasks.filter(t => t.isOverdue);
    }

    const employees = isManager ? await User.find({ isDeactivated: false }).select('name userId') : [];

    res.render('tasks/index', {
      title: isManager ? 'All Compliance Tasks' : 'My Assigned Tasks',
      tasks: filteredTasks,
      employees,
      filters: req.query,
      isManager
    });
  } catch (err) {
    console.error('List tasks error:', err);
    res.status(500).render('errors/500');
  }
}

// Show Task Creation Form (Manager only)
export async function showCreateForm(req, res) {
  try {
    const employees = await User.find({ isDeactivated: false }).sort({ name: 1 });
    res.render('tasks/new', {
      title: 'Create Compliance Task',
      employees
    });
  } catch (err) {
    console.error('Show create task error:', err);
    res.status(500).render('errors/500');
  }
}

// Process Task Creation (Manager only)
export async function createTask(req, res) {
  const { title, description, category, priority, assignee, deadline } = req.body;

  if (!title || !description || !assignee || !deadline) {
    req.session.errorMsg = 'Title, description, assignee, and deadline are required.';
    return res.redirect('/tasks/new');
  }

  try {
    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      category: category ? category.trim() : 'General Compliance',
      priority: priority || 'Medium',
      assignee,
      createdBy: req.user._id,
      deadline: new Date(deadline),
      progressStatus: 'Pending',
      reviewStatus: 'Not Reviewed'
    });

    await logAudit({
      actorId: req.user._id,
      action: 'TASK_CREATED',
      targetType: 'Task',
      targetId: task._id,
      newValues: {
        title: task.title,
        priority: task.priority,
        assignee: task.assignee,
        deadline: task.deadline
      }
    });

    req.session.successMsg = 'Compliance task created and assigned successfully.';
    res.redirect(`/tasks/${task._id}`);
  } catch (err) {
    console.error('Create task error:', err);
    req.session.errorMsg = 'Failed to create task: ' + err.message;
    res.redirect('/tasks/new');
  }
}

// View Single Task with Evidence History
export async function showTask(req, res) {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name userId email department')
      .populate('createdBy', 'name userId');

    if (!task) {
      return res.status(404).render('errors/404');
    }

    // Task Ownership Security Check
    const isManager = req.user.role === 'manager';
    const isAssignee = task.assignee._id.toString() === req.user._id.toString();

    if (!isManager && !isAssignee) {
      return res.status(403).render('errors/403', {
        title: 'Access Denied',
        message: 'You are not authorized to view this compliance task.'
      });
    }

    // Load immutable evidence version history (newest version first)
    const evidenceVersions = await EvidenceVersion.find({ task: task._id })
      .populate('submittedBy', 'name userId')
      .sort({ versionNumber: -1 });

    res.render('tasks/show', {
      title: `Task: ${task.title}`,
      task,
      evidenceVersions,
      isManager,
      isAssignee
    });
  } catch (err) {
    console.error('Show task error:', err);
    res.status(500).render('errors/500');
  }
}

// Show Task Edit Form (Manager only)
export async function showEditForm(req, res) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).render('errors/404');

    const employees = await User.find({ isDeactivated: false }).sort({ name: 1 });

    res.render('tasks/edit', {
      title: `Edit Task — ${task.title}`,
      task,
      employees
    });
  } catch (err) {
    console.error('Show edit task error:', err);
    res.status(500).render('errors/500');
  }
}

// Update Task Details (Manager only)
export async function updateTask(req, res) {
  const { title, description, category, priority, assignee, deadline } = req.body;

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).render('errors/404');

    const previousValues = {
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      assignee: task.assignee.toString(),
      deadline: task.deadline
    };

    const newDeadline = new Date(deadline);
    const deadlineChanged = task.deadline.getTime() !== newDeadline.getTime();

    task.title = title.trim();
    task.description = description.trim();
    if (category) task.category = category.trim();
    if (priority) task.priority = priority;
    if (assignee) task.assignee = assignee;
    task.deadline = newDeadline;

    await task.save();

    if (deadlineChanged) {
      await logAudit({
        actorId: req.user._id,
        action: 'DEADLINE_CHANGED',
        targetType: 'Task',
        targetId: task._id,
        previousValues: { deadline: previousValues.deadline },
        newValues: { deadline: task.deadline },
        reason: req.body.editReason || 'Manager adjusted deadline'
      });
    }

    await logAudit({
      actorId: req.user._id,
      action: 'TASK_UPDATED',
      targetType: 'Task',
      targetId: task._id,
      previousValues,
      newValues: {
        title: task.title,
        priority: task.priority,
        assignee: task.assignee,
        deadline: task.deadline
      },
      reason: req.body.editReason || 'Task details modified'
    });

    req.session.successMsg = 'Task details updated successfully.';
    res.redirect(`/tasks/${task._id}`);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).render('errors/500');
  }
}

// Update Employee Task Progress ('Pending' -> 'In Progress')
export async function updateProgress(req, res) {
  const { progressStatus } = req.body;

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).render('errors/404');

    // Strict ownership verification
    if (req.user.role !== 'manager' && task.assignee.toString() !== req.user._id.toString()) {
      return res.status(403).render('errors/403');
    }

    // Employees can only set 'In Progress' directly; 'Submitted for Review' is set via evidence submission
    if (!['Pending', 'In Progress'].includes(progressStatus)) {
      req.session.errorMsg = 'Invalid progress update request.';
      return res.redirect(`/tasks/${task._id}`);
    }

    const previousStatus = task.progressStatus;
    task.progressStatus = progressStatus;
    await task.save();

    await logAudit({
      actorId: req.user._id,
      action: 'PROGRESS_UPDATED',
      targetType: 'Task',
      targetId: task._id,
      previousValues: { progressStatus: previousStatus },
      newValues: { progressStatus: task.progressStatus }
    });

    req.session.successMsg = `Task status updated to "${progressStatus}".`;
    res.redirect(`/tasks/${task._id}`);
  } catch (err) {
    console.error('Update progress error:', err);
    res.status(500).render('errors/500');
  }
}

// Submit or Revise Evidence (Employee)
export async function submitEvidence(req, res) {
  const { evidenceUrl, notes } = req.body;

  if (!evidenceUrl || !evidenceUrl.trim()) {
    req.session.errorMsg = 'At least one valid evidence URL is required.';
    return res.redirect(`/tasks/${req.params.id}`);
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).render('errors/404');

    // Strict ownership check
    if (req.user.role !== 'manager' && task.assignee.toString() !== req.user._id.toString()) {
      return res.status(403).render('errors/403');
    }

    // Split multiple URLs if entered by comma or newline
    const urls = evidenceUrl
      .split(/[\n,]+/)
      .map(u => u.trim())
      .filter(u => u.length > 0);

    // Calculate sequential version number without overwriting
    const versionCount = await EvidenceVersion.countDocuments({ task: task._id });
    const versionNumber = versionCount + 1;

    await EvidenceVersion.create({
      task: task._id,
      versionNumber,
      evidenceUrls: urls,
      notes: notes ? notes.trim() : '',
      submittedBy: req.user._id
    });

    // Update Task progress to 'Submitted for Review' and reviewStatus to 'Not Reviewed'
    task.progressStatus = 'Submitted for Review';
    task.reviewStatus = 'Not Reviewed';
    if (notes) task.completionNotes = notes.trim();
    await task.save();

    const isRevision = versionNumber > 1;
    await logAudit({
      actorId: req.user._id,
      action: isRevision ? 'EVIDENCE_REVISED' : 'EVIDENCE_SUBMITTED',
      targetType: 'Task',
      targetId: task._id,
      newValues: {
        version: versionNumber,
        evidenceUrls: urls,
        notes: notes || ''
      }
    });

    req.session.successMsg = isRevision
      ? `Evidence version #${versionNumber} submitted. Task returned to review queue.`
      : 'Evidence submitted successfully. Task is now under manager review.';
    res.redirect(`/tasks/${task._id}`);
  } catch (err) {
    console.error('Submit evidence error:', err);
    res.status(500).render('errors/500');
  }
}

// Manager Evidence Review (Verify or Request Changes)
export async function reviewTask(req, res) {
  const { decision, reason } = req.body;

  if (!['Verified', 'Changes Requested'].includes(decision)) {
    req.session.errorMsg = 'Invalid review decision.';
    return res.redirect(`/tasks/${req.params.id}`);
  }

  // Mandatory reason required for Changes Requested
  if (decision === 'Changes Requested' && (!reason || !reason.trim())) {
    req.session.errorMsg = 'A clear explanation is mandatory when requesting corrections.';
    return res.redirect(`/tasks/${req.params.id}`);
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).render('errors/404');

    const previousReviewStatus = task.reviewStatus;
    task.reviewStatus = decision;
    task.latestReviewComment = reason ? reason.trim() : (decision === 'Verified' ? 'Verified by manager' : '');
    await task.save();

    await logAudit({
      actorId: req.user._id,
      action: decision === 'Verified' ? 'TASK_VERIFIED' : 'CHANGES_REQUESTED',
      targetType: 'Task',
      targetId: task._id,
      previousValues: { reviewStatus: previousReviewStatus },
      newValues: { reviewStatus: task.reviewStatus },
      reason: task.latestReviewComment
    });

    req.session.successMsg = decision === 'Verified' 
      ? 'Task verified and marked completed.' 
      : 'Correction request submitted. The employee has been notified.';
    res.redirect(`/tasks/${task._id}`);
  } catch (err) {
    console.error('Review task error:', err);
    res.status(500).render('errors/500');
  }
}
