# ClearTrack — Compliance Action & Evidence Tracker

> A simple, clear web application for tracking compliance tasks, submitting evidence, and getting manager approvals.

---

## 1. Project Overview

ClearTrack helps teams stay on top of compliance tasks. Managers can assign tasks with deadlines, employees can submit proof (links and notes) when finished, and managers review and approve the work.

Built with **Node.js, Express, MongoDB, and EJS**. The code is simple, clean, and uses standard web technologies without complicated setup.

---

## 2. Problem Statement & Target Users

### The Problem
Small teams often struggle with compliance because:
- Tasks are tracked in spreadsheets and easily forgotten.
- Team members mark tasks as done without showing any proof.
- When an employee is late, tools often lock them out instead of letting them submit.
- When proof is updated, previous submissions get overwritten and lost.

### Target Users
- **Managers / Team Leads**: Create tasks, set deadlines, assign them to team members, review submitted proof, and approve or request changes.
- **Employees / Assignees**: See their assigned tasks, update progress, submit proof links, and resubmit if changes are needed.

---

## 3. Key Features

- **Separate Roles for Managers and Employees**: Managers and employees see clean, customized dashboards suited to their work.
- **Separate Progress and Approval Status**: Employees update progress (`Pending`, `In Progress`, `Submitted for Review`), while only Managers can approve (`Verified`) or ask for updates (`Changes Requested`).
- **Smart Overdue Detection**: Tasks past their deadline automatically show as Overdue. Employees are not locked out and can still submit their work late.
- **Evidence Version History**: If a manager asks for changes, the employee can resubmit. The app creates Version 2 without deleting Version 1, keeping full history.
- **Required Reason for Changes**: A manager must type a clear explanation whenever they request changes on a submission.
- **Activity History (Audit Trail)**: The app keeps a clean record of important actions: task creation, deadline changes, submissions, and approvals.
- **Account Deactivation**: Managers can deactivate an employee account so they can no longer log in, while keeping all their past work intact.
- **First-Time Password Change**: New employees are asked to set a new password the first time they log in.

---

## 4. Technology Stack

- **Backend**: Node.js and Express.js
- **Database**: MongoDB (works with MongoDB Atlas in the cloud or local MongoDB) with Mongoose
- **Templates**: EJS (HTML templates rendered on the server)
- **Styling**: Plain CSS (clean, responsive on mobile and desktop)
- **Login & Sessions**: `express-session` saved in MongoDB
- **Security**: `bcryptjs` (passwords are safely hashed, never saved as plain text)
- **Testing**: Built-in Node.js test runner (`node --test`)

---

## 5. Folder Structure

```text
ClearTrack/
  config/
    database.js         # Connects to MongoDB
  controllers/
    authController.js     # Login, logout, change password
    dashboardController.js# Dashboard statistics and task lists
    employeeController.js # Team list, add employee, deactivate account
    taskController.js     # Create, edit, submit evidence, and review tasks
    auditController.js    # View activity history table
  middleware/
    auth.js             # Checks login status and manager role
  models/
    User.js             # User accounts and roles
    Task.js             # Compliance tasks and deadlines
    EvidenceVersion.js  # Saved versions of submitted evidence
    AuditLog.js         # Activity records
  routes/
    auth.routes.js      # /auth routes (login, logout, password)
    dashboard.routes.js # /dashboard routes
    employee.routes.js  # /employees routes (manager only)
    task.routes.js      # /tasks routes
    audit.routes.js     # /audit-logs routes (manager only)
  services/
    auditService.js     # Helper function to save activity records
  views/
    partials/           # Reusable header, footer, navigation bar, alerts
    auth/               # Login and password change pages
    dashboard/          # Manager and employee dashboard pages
    employees/          # Team list and employee forms
    tasks/              # Task list, task details, and create task pages
    audit/              # Activity log history page
    errors/             # Friendly error pages (403, 404, 500)
  public/
    css/style.css       # Clean styling
  scripts/
    seed.js             # Adds sample data for testing
  tests/
    cleartrack.test.js  # Automated tests
  server.js             # App entry point
```

---

## 6. How to Set Up and Run Locally

### Prerequisites
- Node.js (version 18 or higher)
- A MongoDB database (either local MongoDB or free MongoDB Atlas)

### Step 1: Install Dependencies
Open your terminal in the project folder and run:
```bash
npm install
```

### Step 2: Configure Environment Variables
Create a file named `.env` in the project root (you can copy `.env.example`):
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/cleartrack
SESSION_SECRET=my_secret_key_12345
```
*(If using MongoDB Atlas, paste your Atlas connection string in `MONGODB_URI`)*

### Step 3: Add Sample Demo Data
Run the seed script to set up demo accounts and sample tasks:
```bash
node scripts/seed.js
```

### Step 4: Start the Server
```bash
npm start
```
Then open your browser and go to:
[http://localhost:3000](http://localhost:3000)

---

## 7. Sample Accounts for Testing

After running the seed script, you can log in with any of these accounts:

| Name | Role | User ID | Password | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Rahul Sharma** | Manager | `manager` | `Manager@123` | Full access: assign tasks, review evidence, view audit logs |
| **Rohan Verma** | Employee | `emp101` | `Employee@123` | Has active tasks and an overdue task to test late submission |
| **Sneha Reddy** | Employee | `emp102` | `Employee@123` | Has an approved and verified task |
| **Karthik Iyer** | Employee | `emp103` | `Employee@123` | Has a task waiting for manager review |
| **Priya Sharma** | Employee | `emp104` | `Employee@123` | First-time login (prompts for new password) |
| **Rajesh Gupta** | Employee | `emp105` | `Employee@123` | Deactivated account (shows how login is blocked) |

---

## 8. Automated Tests

ClearTrack comes with an automated test suite that checks all core logic and rules:

```bash
npm test
```

### What the tests verify:
- [x] Password hashing with bcrypt (no plain text passwords)
- [x] Login and session handling
- [x] Security: employees cannot view or edit tasks belonging to others
- [x] Security: only managers can access manager routes
- [x] Tasks automatically show as overdue when deadline passes
- [x] Employees can still submit evidence even if a task is overdue
- [x] Resubmitting evidence creates a new version without deleting previous ones
- [x] Managers must provide a reason when requesting changes
- [x] Task completes when verified by a manager
- [x] Activity logs are saved for changes
- [x] Deactivating a user blocks login while keeping their task history

---

## 9. Known Limitations

- **Evidence Links**: Evidence is submitted as web links (such as Google Drive, Dropbox, AWS S3, or company portals) instead of uploading large files directly to the server.
- **Single Team / Organization**: Built for one company workspace rather than multiple separate companies.
- **In-App Notifications**: Task updates and overdue notices show inside the web app dashboards rather than sending emails or SMS.

---

## 10. Product Write-Up (VComply Submission)

### 1. What problem does your tool solve, and who is the user?
Many teams track compliance tasks in messy spreadsheets where tasks get lost, proof is missing, and nobody knows who verified what. **ClearTrack** fixes this by giving teams a simple, organized website to manage compliance work.
There are two types of users:
- **Managers**: Assign compliance tasks, check deadlines, review submitted proof, and approve or request changes.
- **Employees**: View their assigned tasks, update their progress, and submit proof (links and notes) when done.

### 2. What were the two or three most important product decisions you made, and why?
1. **Only Managers Can Approve**: Employees can update progress and submit proof, but only a Manager can mark a task as `Verified`. This ensures that every completed task has real oversight.
2. **Never Lock Out Late Submissions**: If a deadline passes, the task clearly shows as `Overdue`, but the employee can still submit their work. Deadlines should track timeliness without stopping people from finishing their job.
3. **Keep Past Evidence (Version History)**: When a manager asks for changes and the employee resubmits, the app saves it as Version 2 without deleting Version 1. This keeps a clear history of all submissions.

### 3. What did you cut from scope, and what would you build next if you had more time?
- **What was cut**: Direct file uploads. We decided to accept links (Google Drive, cloud storage) instead. This keeps the server fast, safe from malicious file uploads, and lightweight.
- **What to build next**: Email or Slack alerts when a deadline is coming up, and an option to download task reports as a PDF or Excel sheet for audits.

### 4. What broke or surprised you during development, and how did you handle it?
When connecting to MongoDB Atlas on Windows, the connection initially gave an SSL error. We found that Windows was trying to use IPv6 instead of IPv4. We fixed this simply by adding `{ family: 4 }` to the database connection settings. Also, an arrow symbol (`&rarr;`) on the submit button was showing up as raw text instead of an arrow, so we simplified the button text to plain, clear labels.
