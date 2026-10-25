import User from '../models/User.js';
import Task from '../models/Task.js';
import { logAudit } from '../services/auditService.js';

// List all team employees
export async function listEmployees(req, res) {
  try {
    const employees = await User.find({ role: 'employee' }).sort({ createdAt: -1 });
    res.render('employees/index', {
      title: 'Employee Directory',
      employees
    });
  } catch (err) {
    console.error('List employees error:', err);
    res.status(500).render('errors/500');
  }
}

// Show Create Employee Form
export function showCreateForm(req, res) {
  res.render('employees/new', { title: 'Create Employee Account' });
}

// Process Employee Creation
export async function createEmployee(req, res) {
  const { userId, name, email, department, temporaryPassword } = req.body;

  if (!userId || !name || !email || !temporaryPassword) {
    req.session.errorMsg = 'All required fields must be filled.';
    return res.redirect('/employees/new');
  }

  try {
    const existing = await User.findOne({ userId: userId.trim().toLowerCase() });
    if (existing) {
      req.session.errorMsg = `User ID "${userId}" is already taken.`;
      return res.redirect('/employees/new');
    }

    const newEmployee = await User.create({
      userId: userId.trim().toLowerCase(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      department: department ? department.trim() : 'General',
      password: temporaryPassword,
      role: 'employee',
      mustChangePassword: true
    });

    await logAudit({
      actorId: req.user._id,
      action: 'EMPLOYEE_CREATED',
      targetType: 'User',
      targetId: newEmployee._id,
      newValues: { userId: newEmployee.userId, name: newEmployee.name, department: newEmployee.department }
    });

    req.session.successMsg = `Employee ${newEmployee.name} created successfully with temporary password.`;
    res.redirect('/employees');
  } catch (err) {
    console.error('Create employee error:', err);
    req.session.errorMsg = 'Failed to create employee account: ' + err.message;
    res.redirect('/employees/new');
  }
}

// Show Single Employee Profile and Assigned Tasks
export async function showEmployee(req, res) {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).render('errors/404');
    }

    const tasks = await Task.find({ assignee: employee._id }).sort({ deadline: 1 });

    res.render('employees/show', {
      title: `${employee.name} — Profile`,
      employee,
      tasks
    });
  } catch (err) {
    console.error('Show employee error:', err);
    res.status(500).render('errors/500');
  }
}

// Show Edit Employee Form
export async function showEditForm(req, res) {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).render('errors/404');
    }
    res.render('employees/edit', {
      title: `Edit ${employee.name}`,
      employee
    });
  } catch (err) {
    console.error('Show edit employee error:', err);
    res.status(500).render('errors/500');
  }
}

// Update Permitted Profile Fields
export async function updateEmployee(req, res) {
  const { name, email, department } = req.body;
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).render('errors/404');
    }

    const previousValues = {
      name: employee.name,
      email: employee.email,
      department: employee.department
    };

    employee.name = name.trim();
    employee.email = email.trim().toLowerCase();
    if (department) employee.department = department.trim();

    await employee.save();

    await logAudit({
      actorId: req.user._id,
      action: 'EMPLOYEE_UPDATED',
      targetType: 'User',
      targetId: employee._id,
      previousValues,
      newValues: { name: employee.name, email: employee.email, department: employee.department }
    });

    req.session.successMsg = 'Employee profile updated.';
    res.redirect(`/employees/${employee._id}`);
  } catch (err) {
    console.error('Update employee error:', err);
    res.status(500).render('errors/500');
  }
}

// Soft Deactivate Employee Account
export async function deactivateEmployee(req, res) {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).render('errors/404');
    }

    employee.isDeactivated = true;
    await employee.save();

    await logAudit({
      actorId: req.user._id,
      action: 'EMPLOYEE_DEACTIVATED',
      targetType: 'User',
      targetId: employee._id,
      reason: req.body.reason || 'Deactivated by manager'
    });

    req.session.successMsg = `Account for ${employee.name} deactivated. Historical records preserved.`;
    res.redirect('/employees');
  } catch (err) {
    console.error('Deactivate employee error:', err);
    res.status(500).render('errors/500');
  }
}
