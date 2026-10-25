import Task from '../models/Task.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

// Render Role-Specific Dashboard
export async function showDashboard(req, res) {
  const isManager = req.user.role === 'manager';

  try {
    if (isManager) {
      // MANAGER DASHBOARD DATA
      const allTasks = await Task.find()
        .populate('assignee', 'name userId department')
        .sort({ deadline: 1 });

      const now = new Date();

      // Compute statistics from records
      const totalTasks = allTasks.length;
      const pendingTasks = allTasks.filter(t => t.progressStatus === 'Pending').length;
      const inProgressTasks = allTasks.filter(t => t.progressStatus === 'In Progress').length;
      const submittedTasks = allTasks.filter(t => t.progressStatus === 'Submitted for Review').length;
      const verifiedTasks = allTasks.filter(t => t.reviewStatus === 'Verified').length;
      const overdueTasks = allTasks.filter(t => t.isOverdue).length;

      // Tasks approaching deadline (in next 7 days, unverified)
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const upcomingTasks = allTasks.filter(t => 
        t.reviewStatus !== 'Verified' && 
        t.deadline >= now && 
        t.deadline <= sevenDaysFromNow
      ).slice(0, 5);

      // Tasks requiring manager review
      const reviewQueue = allTasks.filter(t => 
        t.progressStatus === 'Submitted for Review' && 
        t.reviewStatus !== 'Verified'
      );

      // Recent Audit Activity
      const recentAudit = await AuditLog.find()
        .populate('actor', 'name userId')
        .sort({ createdAt: -1 })
        .limit(5);

      // Employee Task Completion Stats
      const employees = await User.find({ role: 'employee', isDeactivated: false });
      const employeeStats = employees.map(emp => {
        const empTasks = allTasks.filter(t => t.assignee && t.assignee._id.toString() === emp._id.toString());
        const empCompleted = empTasks.filter(t => t.reviewStatus === 'Verified').length;
        const empOverdue = empTasks.filter(t => t.isOverdue).length;
        return {
          id: emp._id,
          name: emp.name,
          userId: emp.userId,
          department: emp.department,
          total: empTasks.length,
          completed: empCompleted,
          overdue: empOverdue,
          rate: empTasks.length > 0 ? Math.round((empCompleted / empTasks.length) * 100) : 0
        };
      });

      return res.render('dashboard/manager', {
        title: 'Manager Compliance Dashboard',
        stats: {
          totalTasks,
          pendingTasks,
          inProgressTasks,
          submittedTasks,
          verifiedTasks,
          overdueTasks
        },
        reviewQueue,
        upcomingTasks,
        recentAudit,
        employeeStats
      });

    } else {
      // EMPLOYEE DASHBOARD DATA
      const myTasks = await Task.find({ assignee: req.user._id }).sort({ deadline: 1 });

      const totalTasks = myTasks.length;
      const pendingTasks = myTasks.filter(t => t.progressStatus === 'Pending').length;
      const inProgressTasks = myTasks.filter(t => t.progressStatus === 'In Progress').length;
      const submittedTasks = myTasks.filter(t => t.progressStatus === 'Submitted for Review').length;
      const verifiedTasks = myTasks.filter(t => t.reviewStatus === 'Verified').length;
      const overdueTasks = myTasks.filter(t => t.isOverdue).length;

      // Upcoming deadlines (unverified, next 7 days or overdue)
      const upcomingTasks = myTasks.filter(t => t.reviewStatus !== 'Verified').slice(0, 6);

      // Action needed (Changes requested or pending start)
      const actionNeeded = myTasks.filter(t => 
        t.reviewStatus === 'Changes Requested' || 
        t.progressStatus === 'Pending'
      );

      return res.render('dashboard/employee', {
        title: 'My Compliance Workspace',
        stats: {
          totalTasks,
          pendingTasks,
          inProgressTasks,
          submittedTasks,
          verifiedTasks,
          overdueTasks
        },
        upcomingTasks,
        actionNeeded
      });
    }
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).render('errors/500');
  }
}
