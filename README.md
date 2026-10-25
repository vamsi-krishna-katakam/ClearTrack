# ClearTrack — Compliance Action & Evidence Tracker

> A lightweight, audit-ready compliance action and evidence tracking web application designed for small and growing teams.

---

## 1. Project Overview

ClearTrack enables organizations to assign compliance-related obligations, monitor progress, collect versioned completion evidence, and require formal managerial verification before tasks are marked complete.

Built with a clean, explainable **Node.js, Express, MongoDB, and EJS** architecture without unnecessary abstractions or black-box libraries.

---

## 2. Problem Statement & Target Users

### The Problem
Small teams often fail compliance reviews because:
- Compliance items are tracked in ad-hoc spreadsheets.
- Team members self-certify completion without submitting supporting proof.
- When an action is submitted late, systems lock users out or create bottlenecks.
- Revision history is lost when evidence is updated or replaced.

### Target Users
- **Compliance Managers & Team Leads**: Assign compliance tasks, track overdue obligations across the team, review submitted evidence, verify completion, and inspect audit logs.
- **Employees & Assignees**: Review assigned compliance requirements, update task progress, submit evidence URLs, respond to revision requests, and maintain compliance records.

---

## 3. Key Features

- **Role-Based Workflows**: Separate, secure experiences for Managers and Employees.
- **Two-Tier Status Architecture**: Separates employee progress (`Pending`, `In Progress`, `Submitted for Review`) from manager verification (`Not Reviewed`, `Verified`, `Changes Requested`).
- **Dynamic Overdue Tracking**: Overdue is derived at runtime (`now > deadline && unverified`). It identifies late items clearly without blocking employees from submitting late work.
- **Immutable Evidence Versioning**: When evidence is resubmitted, the system creates version `N+1` while preserving previous links, notes, and timestamps.
- **Mandatory Review Reasons**: Managers cannot request corrections without providing an explicit, recorded reason.
- **Append-Only Audit Trail**: All task creations, edits, deadline adjustments, evidence submissions, and review decisions are logged in MongoDB `auditLogs`.
- **Soft Account Deactivation**: Employee accounts can be deactivated to immediately block sign-in without breaking foreign-key references in historical audit logs.
- **First-Login Password Policy**: Newly created employee accounts are issued temporary passwords and prompted to change them on first login.

---

## 4. Technology Stack

- **Runtime**: Node.js
- **Web Framework**: Express.js (v4)
- **Database & ODM**: MongoDB Atlas / Local MongoDB with Mongoose (v8)
- **Templating**: EJS (Embedded JavaScript) with shared partials
- **Styling**: Vanilla CSS (Modern, accessible, responsive design system)
- **Authentication**: `express-session` with `connect-mongo` session persistence
- **Security**: `bcryptjs` for password hashing, session fixation protection, defense-in-depth authorization middleware
- **Testing**: Native Node.js test runner (`node --test`)

---

## 5. Architecture Overview

```text
cleartrack/
  config/
    database.js         # Mongoose connection handler
  controllers/
    authController.js     # Login, logout, session regeneration, password change
    dashboardController.js# Real-time statistics aggregation for both roles
    employeeController.js # Team directory, employee creation, soft deactivation
    taskController.js     # Task CRUD, ownership validation, evidence versioning
    auditController.js    # Immutable audit trail viewer
  middleware/
    auth.js             # isAuthenticated, isManager, locals injector
  models/
    User.js             # Unified user schema with bcrypt pre-save hook
    Task.js             # Task schema with dynamic isOverdue virtual
    EvidenceVersion.js  # Append-only evidence history linked to Task
    AuditLog.js         # Central compliance audit collection
  routes/
    auth.routes.js      # /auth routes
    dashboard.routes.js # /dashboard routes
    employee.routes.js  # /employees routes (Manager only)
    task.routes.js      # /tasks routes
    audit.routes.js     # /audit-logs routes (Manager only)
  services/
    auditService.js     # Centralized audit logging helper
  views/
    partials/           # header, footer, navbar, flash alerts
    auth/               # login, change-password
    dashboard/          # manager and employee dashboards
    employees/          # directory, new, show, edit
    tasks/              # index, new, show, edit
    audit/              # audit trail table
    errors/             # 403, 404, 500 error pages
  public/
    css/style.css       # Clean responsive design system
  scripts/
    seed.js             # Safe demo account seeder
  tests/
    cleartrack.test.js  # Automated test suite
  server.js             # Express application entry point
```

---

## 6. Database Models

1. **`User`**: `userId` (unique), `name`, `email`, `password` (bcrypt hash), `role` (`manager` | `employee`), `department`, `mustChangePassword`, `isDeactivated`.
2. **`Task`**: `title`, `description`, `category`, `priority`, `assignee` (User ref), `createdBy` (User ref), `deadline`, `progressStatus`, `reviewStatus`, `completionNotes`, `latestReviewComment`.
3. **`EvidenceVersion`**: `task` (Task ref), `versionNumber`, `evidenceUrls`, `notes`, `submittedBy` (User ref), `createdAt`.
4. **`AuditLog`**: `actor` (User ref), `action`, `targetType`, `targetId`, `previousValues`, `newValues`, `reason`, `createdAt`.

---

## 7. Installation & Configuration

### Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally or a MongoDB Atlas URI

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd cleartrack
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root folder (or copy `.env.example`):
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/cleartrack
SESSION_SECRET=your_secure_random_session_secret
```

---

## 8. Seeding Demo Accounts

Populate the database with demo accounts and initial compliance tasks:
```bash
node scripts/seed.js
```

### Default Demo Credentials:
| Persona | User ID | Password | Department | Highlighted Test Scenario |
| :--- | :--- | :--- | :--- | :--- |
| **Rahul Sharma (Lead Manager)** | `manager` | `Manager@123` | Compliance Operations | Full manager dashboard, review queue, create tasks, team audit trail |
| **Rohan Verma (Employee 1)** | `emp101` | `Employee@123` | Cloud Security | Overdue task handling (`Encryption at Rest`) & Correction cycle (`PCI-DSS`) |
| **Sneha Reddy (Employee 2)** | `emp102` | `Employee@123` | Finance & Governance | Completed & verified task attestation |
| **Karthik Iyer (Employee 3)** | `emp103` | `Employee@123` | DevOps & Infrastructure | Task waiting in Manager's Review Queue (`Disaster Recovery Drill`) |
| **Priya Sharma (Employee 4)** | `emp104` | `Employee@123` | Legal & Privacy | First-login password change flow & multi-version evidence resubmission |
| **Rajesh Gupta (Contractor)** | `emp105` | `Employee@123` | External Audits | Deactivated account (login blocked, historical tasks preserved) |

---

## 9. Running the Application

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

Open your browser and navigate to:
[http://localhost:3000](http://localhost:3000)

---

## 10. Automated Tests

ClearTrack includes an automated test suite verifying all 19 functional and security requirements:

```bash
npm test
```

### Verified Test Cases:
- [x] Password hashing with bcrypt
- [x] Login credential verification
- [x] Session regeneration and logout
- [x] Task ownership enforcement (cross-employee access rejected)
- [x] Manager-only route protection
- [x] Dynamic overdue calculation (without cron jobs)
- [x] Non-blocking late submissions
- [x] Immutable evidence version incrementation
- [x] Mandatory manager correction reasons
- [x] Task completion upon managerial verification
- [x] Real-time audit log generation
- [x] Soft deactivation preserving historical integrity

---

## 11. Deployment Guide (MongoDB Atlas & Node Hosting)

1. **MongoDB Atlas**:
   - Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
   - Under **Network Access**, add your hosting platform's IP (or `0.0.0.0/0` for cloud services like Render/Railway).
   - Under **Database Access**, create a user and copy the connection string.
2. **Environment Variables on Host**:
   - `MONGODB_URI`: Atlas connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/cleartrack?retryWrites=true&w=majority`).
   - `SESSION_SECRET`: A strong 64-character random string.
   - `NODE_ENV`: `production`.
3. **Run Seed on First Deploy**: Run `node scripts/seed.js` to create the initial manager account.

---

## 12. Known Limitations

- **Evidence Hosted via URLs**: Supporting evidence is tracked via validated HTTPS URLs (e.g., Google Drive, AWS S3, SharePoint, internal dashboards) rather than direct binary file uploads to avoid server storage bloat and malware vectors.
- **Single-Tenant Workspace**: Designed for a single organization's compliance operations; multi-tenant multi-organization isolation is not included in this release.
- **In-App Notifications**: Deadline alerts and review notifications are rendered in real-time within user dashboards and audit feeds rather than third-party email/SMS gateways.
- **Session-Based Authentication**: Built for server-side rendered browser sessions with secure HTTP-only cookies rather than a public headless REST API with JWT access tokens.

---

## 13. Product Write-Up (VComply Submission)

### 1. What problem does your tool solve, and who is the user?
Small and mid-sized teams struggle with compliance readiness because regulatory tasks are tracked in ad-hoc spreadsheets, evidence is lost in email threads, and assignees often "check off" tasks without verifiable proof. **ClearTrack** provides an audit-ready action tracker for **Compliance Managers** (who assign obligations, review evidence, and verify completion) and **Employees/Assignees** (who execute controls, submit versioned evidence, and handle correction cycles).

### 2. Two or three most important product decisions made:
1. **Separation of Execution and Verification**: Employees control progress status (`Pending` → `In Progress` → `Submitted for Review`), while only Managers can issue verification (`Verified` or `Changes Requested`). Employees can never self-certify compliance.
2. **Dynamic, Non-Blocking Overdue Calculation**: Rather than running stale background cron jobs or locking users out when deadlines pass, overdue is derived dynamically (`now > deadline && unverified`). Assignees can still submit late work while overdue status remains transparently flagged.
3. **Immutable Evidence Versioning**: Revising evidence never overwrites past records. Every submission creates version `N+1`, preserving all historic URLs, notes, and timestamps for auditors.

### 3. What was cut from scope, and what to build next:
- **Cut from Scope**: Direct file uploads were replaced with validated external URLs (Google Drive, AWS S3, dashboards) to eliminate security vulnerabilities (malware) and storage bloat. Multi-step deadline extension approval workflows were cut in favor of direct manager deadline editing with audit logging.
- **Build Next**: Automated Slack/Microsoft Teams webhook reminders for upcoming deadlines and one-click PDF/CSV compliance packet export for external auditors.

### 4. What broke or surprised us, and how it was handled:
During cloud database seeding on Windows, the Node.js TLS handshake to MongoDB Atlas intermittently failed with `SSL alert number 80` due to Windows attempting IPv6 resolution on newly provisioned Atlas clusters. We diagnosed the network layer and resolved it by enforcing IPv4 DNS resolution (`family: 4`) in Mongoose connection options. Additionally, an HTML entity (`&rarr;`) was being escaped by EJS within dynamic button tags; we corrected it to clean plain text.

---

