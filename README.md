# 🎓 College Competition Intelligence Platform

> **Status:** 🚧 Prototype / Demo-Ready  
> **Current Version:** v0.1.0-alpha  
> **Security Level:** ⚠️ **NOT PRODUCTION READY** (See Security Section)

## 1️⃣ Project Overview

**The Problem:** tracking student participation in external hackathons and competitions is currently a manual, chaotic mess of spreadsheets, screenshots, and unverified claims. Colleges struggle to maintain real-time data on student achievements.

**The Solution:** A centralized intelligence platform that:
1.  **Tracks Registrations:** intended to automatically detect competition registrations from student emails (Gmail).
2.  **Verifies Achievements:** Provides a manual fallback for students to upload proofs (screenshots) for Faculty verification.
3.  **Manages Workflows:** Handles On-Duty (OD) requests and approval chains (Faculty → HOD).

**Target Audience:**
*   **Students:** One-click tracking of their competition portfolio.
*   **Faculty:** Simplified verification dashboard.
*   **HODs:** High-level department analytics and OD approvals.

## 🧪 Demo Scope & Limitations

This demo focuses on validating:
*   **Gmail-based detection feasibility**
*   **Faculty verification workflow**
*   **Department-level visibility**

**Out of scope for demo:**
*   Strict authentication enforcement
*   Advanced access control
*   Production-grade security hardening

---

## 2️⃣ Features Audit

| Feature | Status | Notes |
| :--- | :--- | :--- |
| **Student Dashboard** | ✅ Implemented | View competitions, upload manual proof. |
| **Faculty Dashboard** | ✅ Implemented | Stats overview, student list, pending verifications. |
| **HOD Dashboard** | 🟡 Partial | Basic Department stats mockup. |
| **Manual Registration** | ✅ Implemented | User uploads screenshot + details. |
| **Competition Database** | ✅ Implemented | CRUD for Admin to add external events. |
| **Gmail Automation** | 🟡 **In Code / Disconnected** | Logic exists in `gmailService.js`, but OAuth flow is missing. |
| **Authentication** | ⚠️ **Demo Strategy** | "Public Access Mode" enabled for rapid internal validation. |
| **Docker Support** | ❌ **Missing** | No Dockerfiles present despite planned tooling. |

---

## 📧 Gmail-Based Registration Detection (Core Feature)

The platform's primary intelligence feature scans **student competition registration emails** using keyword-based detection.

### Why This Is Safe
*   Only **college-issued Google Workspace accounts** are supported
*   Personal Gmail accounts are NOT allowed
*   Access is scoped to:
    *   Read-only email metadata
    *   Specific keyword matching (competition names, "registered", "confirmation")

### Access Model
*   Students explicitly log in using their college Google account
*   The system does NOT read unrelated personal emails
*   No emails are stored permanently — only extracted registration metadata

### Detection Logic (Current Version)
*   **Keyword matching using:**
    *   Competition names
    *   Registration confirmation terms
    *   Organizer domains
*   **Regex-based parsing** for robustness
*   **Designed to minimize false positives**

> Future versions may introduce ML-based classification, but the current system prioritizes explainability and accuracy.

### Fallback Strategy
*   Manual screenshot upload is always available
*   Faculty verification is mandatory before records become official

---

## 3️⃣ System Architecture

### High-Level Flow
```mermaid
graph LR
    User[User (React)] -->|HTTP + Header Spoofing| API[Node Express API]
    API -->|Anon Key| DB[(Supabase Postgres)]
    
    subgraph "Planned / Disconnected"
        Gmail[Gmail API] -.->|OAuth?| API
    end
```

1.  **Frontend (UI):** React + Vite handles the user interface and interactions.
2.  **Authentication:** **Public Mode (Demo Phase).** The system currently operates in a simplified "Public Mode" where frontend requests include a simple identifier (`x-user-id`). This is intentional for the demo phase to allow rapid testing without complex IAM setup.
3.  **Database:** Supabase (PostgreSQL) stores Users, Competitions, and Registrations.
4.  **Backend Services:** Node.js services handle complex logic (e.g., parsing Gmail snippets, aggregating stats) that can't easily be done in SQL.

---

## 4️⃣ Tech Stack & Justification

| Tech | Choice | Why & Trade-offs |
| :--- | :--- | :--- |
| **Frontend** | **React + Vite** | Standard industry choice. Fast dev cycle. **Trade-off:** Client-side heavy. |
| **Styling** | **Tailwind CSS** | Rapid UI development. **Trade-off:** HTML can get messy. |
| **Backend** | **Node.js + Express** | Simple, JSON-native, huge ecosystem. **Trade-off:** Manual architecture required. |
| **Database** | **Supabase (PostgreSQL)** | Combines SQL power with easy API/Auth. **Trade-off:** Vendor lock-in if using Supabase-specific features. |
| **Parsing** | **Google APIs** | Standard for Gmail integration. **Trade-off:** Complex OAuth setup required. |

---

## 5️⃣ Folder Structure Explained

The project is split into a monorepo-style structure:

### `📂 backend`
*   `src/controllers`: **Input/Output layer**. currently contains placeholders (e.g., `auth.controller.js`).
*   `src/services`: **Business Logic**. Contains the *real* code.
    *   `src/services/gmailService.js`: The "Brain" for parsing emails.
*   `src/middleware`: **Traffic Control**. Contains `authMiddleware.js` (The source of the security vulnerability).
*   `Database`: **SQL Scripts**. `SCHEMA.SQL` defines the tables.

### `📂 frontend`
*   `src/pages`: One folder per role (`student`, `faculty`, `hod`).
*   `src/components`: Reusable UI blocks.
*   `src/services`: API wrappers. `usersService.js` manually attaches the unsafe `x-user-id`.

---

## 6️⃣ Database Design Summary

Key tables in `SCHEMA.SQL`:

*   **`users`**: Stores profile + `role` (ENUM: STUDENT, FACULTY, HOD, ADMIN).
*   **`competitions`**: Central catalog of events.
*   **`registrations`**: Link table between `users` and `competitions`. Contains `proof_url` and `verified` status.
*   **`detected_hackathons`**: (From `SCHEMA_UPDATE_GMAIL.SQL`) Staging table for AI/Regex detected events before they are confirmed.

**Why this works:** It uses standard Relational Normalization. Users are distinct from their registrations, allowing one user to have many competitions.

---

## 7️⃣ Environment Setup

### ⚠️ Prerequisites
*   Node.js (v18+)
*   Supabase Account

### Step 1: Database Setup
1.  Create a new Supabase Project.
2.  Go to **SQL Editor**.
3.  Copy/Paste contents of `backend/Database/SCHEMA.SQL` and run it.
4.  (Optional) Run `backend/Database/SCHEMA_UPDATE_GMAIL.SQL`.

### Step 2: Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
*   **Edit `.env`**:
    *   `port`: 5000
    *   `SUPABASE_URL`: Your Project URL.
    *   `SUPABASE_ANON_KEY`: Your **Service Role Key** (Recommended for Backend) or Anon Key (If RLS specific).

### Step 3: Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
```
*   **Edit `.env`**:
    *   `VITE_SUPABASE_URL`: Your Project URL.
    *   `VITE_SUPABASE_ANON_KEY`: Your **Anon** Key.

### Step 4: Run
*   Backend: `npm start` (Runs on port 5000)
*   Frontend: `npm run dev` (Runs on port 5173)

---

## 8️⃣ Known Limitations & Risks ⚠️

### � Authentication Strategy (Demo Phase)

For the **initial demo and internal validation phase**, the system intentionally operates in **Public Access Mode**. 

**Why Public Mode?**
*   Rapid iteration during early development
*   No exposure to external users
*   Access limited to college-controlled environments

**Important Notes:**
*   This mode is **NOT intended for production**.
*   Role-based authentication using Supabase JWT will be enabled before campus-wide rollout.
*   All demo data is non-sensitive and seeded for testing purposes.

### 🔌 2. Gmail Integration Status
**Status:** Logic implementation (Services) is complete. OAuth Connection is pending.
**Note:** The system uses a safe, read-only scope. See Core Feature section above for privacy details.

### 🏗️ 3. No Docker / DevOps
**The Issue:** The prompt mentioned Docker, but no `Dockerfile` or `docker-compose.yml` exists.
**Result:** "Works on my machine" syndrome is highly likely.

### 🔑 4. Environment Key Misuse
**The Issue:** Backend uses `SUPABASE_ANON_KEY`.
**The Risk:** If you enable RLS on Supabase, the backend will lose access to write data (like detected hackathons) unless specific policies allow "Anon" to write. The backend should ideally use `SUPABASE_SERVICE_ROLE_KEY`.

---

## 9️⃣ What’s Missing / Needs Improvement 🔍

1.  **Validation:** No `Joi` or `Zod` validation on inputs. You can send empty strings or garbage JSON to the API.
2.  **Error Handling:** Basic `try/catch` blocks. No centralized error handler.
3.  **Authentication:** `auth.controller.js` is literally a placeholder returning "Login successful".
4.  **Testing:** No unit tests (`Jest`) or integration tests.
5.  **Pagination:** APIs return `select('*')`. If you have 10,000 students, the dashboard **will crash**.

---

## 🔟 Improvement Roadmap 🚀

### Short-Term (Immediate Fixes)
- [ ] **Fix Auth:** Replace `x-user-id` with proper `Authorization: Bearer <token>` verification.
- [ ] **Dockerize:** Add `Dockerfile` for backend and frontend.
- [ ] **Validation:** Add `Joi` middleware to routes.

### Medium-Term (Feature Complete)
- [ ] **Connect Gmail:** Implement Google OAuth on frontend, pass tokens to backend `gmailService`.
- [ ] **Email Notifications:** Send emails when HOD approves OD.
- [ ] **Pagination:** Implement `page` and `limit` on all API lists.

### Long-Term (Production Vision)
- [ ] **Redis Caching:** For the Faculty Dashboard stats.
- [ ] **Background Jobs:** Move Gmail scanning to a BullMQ queue (don't make the user wait).
- [ ] **Testing:** 80% Code Coverage.

---

## 1️⃣1️⃣ Contribution Guidelines

1.  **Branching:** Use `feature/feature-name`.
2.  **Commits:** Use conventional commits (e.g., `feat: add student stats`).
3.  **Linting:** Please run `eslint` before pushing. (Note: ESLint config is present in frontend).
4.  **Formatting:** Code should be readable.

---

## 1️⃣2️⃣ Final Evaluation Summary

| Criteria | Rating | Verdict |
| :--- | :--- | :--- |
| **Code Structure** | ⭐⭐⭐ | Decent MVC, but some logic leaks. |
| **Security** | ⭐ | **Unsafe.** Do not deploy publicly. |
| **Completeness** | ⭐⭐ | Core CRUD works, "Smart" features mocked. |
| **Beginner Friendly** | ⭐⭐⭐⭐ | Easy to read, standard JS. |

**Is this Production Ready?**
**NO.** The security gaps (Auth bypass) and scalability issues (no pagination) make it unsuitable for real-world deployment with sensitive student data.

**Is this Hackathon Ready?**
**YES** (with caveats). It demos well. If you are presenting to judges, it looks functional. Just don't let a penetration tester look at the headers.
