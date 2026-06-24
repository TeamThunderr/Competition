# 🎓 College Competition Intelligence Platform

A centralized intelligence platform designed to track, manage, and verify student participation in external hackathons and competitions. This platform replaces chaotic spreadsheets and manual tracking with a streamlined, role-based dashboard system for Students, Faculty, HODs, and College Administrators.

---

## 1️⃣ Project Overview

**The Problem:** Tracking student participation in external events is currently a manual process. Colleges struggle to maintain real-time data on student achievements, and managing On-Duty (OD) requests is cumbersome.

**The Solution:** This centralized platform provides a seamless workflow:
1.  **Students:** Track their competition portfolio, apply for ODs, and upload proof of participation/achievements.
2.  **Faculty:** A simplified dashboard to verify student claims and oversee their mentored students.
3.  **HODs (Head of Department):** High-level department analytics, section-wise performance tracking, and final OD approvals.
4.  **Admins:** Manage the global repository of competitions, track college-wide performance, and maintain the student database.

---

## 2️⃣ Key Features by Role

### 🧑‍🎓 Student Module
*   **Competition Discovery:** View active and upcoming competitions added by the college.
*   **Portfolio Tracking:** Log participation in external hackathons and events.
*   **OD Management:** Request On-Duty letters directly through the platform and track approval status.
*   **Analytics:** View personal participation stats and achievements.

### 👨‍🏫 Faculty / Mentor Module
*   **Verification Queue:** Review and verify student participation proofs (certificates/screenshots).
*   **Student Roster:** View details and competition history of all assigned students.
*   **OD Review:** Initial review and forwarding of OD requests to the HOD.

### 🏛️ HOD (Head of Department) Module
*   **Department Analytics:** View real-time participation statistics across different sections and batches.
*   **OD Approvals:** Final authority to approve or reject pending OD requests.
*   **Faculty & Student Directory:** Oversee all department members and their activities.

### ⚙️ Admin Module
*   **Global Repository:** Centralized database of all competitions.
*   **Event Management:** Upload and broadcast new competitions to the student body.
*   **College-Wide Insights:** Generate reports and view activity logs across all departments.

---

## 3️⃣ System Architecture & Tech Stack

The application is built using a modern, scalable JavaScript stack:

### Frontend
*   **Framework:** React 19 + Vite
*   **Styling:** Tailwind CSS (with responsive, mobile-first design)
*   **Icons & UI:** Lucide React, Framer Motion
*   **Routing:** React Router v7

### Backend
*   **Runtime:** Node.js with Express.js
*   **Database:** Supabase (PostgreSQL)
*   **Architecture:** Modular MVC pattern with separate routes, controllers, and services.

---

## 4️⃣ Environment Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   A Supabase Account & Project

### Step 1: Database Setup
1.  Create a new Supabase Project.
2.  Go to the **SQL Editor** in your Supabase dashboard.
3.  Copy the contents of `backend/Database/SCHEMA.SQL` and run it to generate the necessary tables.

### Step 2: Backend Setup
Open a terminal and navigate to the `backend` directory:
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder based on `.env.example`:
```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
Start the backend server:
```bash
npm run dev
```

### Step 3: Frontend Setup
Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend` folder:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
Start the frontend development server:
```bash
npm run dev
```

### Step 4: Access the Application
Once both servers are running, open your browser and navigate to `http://localhost:5173`. 
*(Note: The backend API runs on `http://localhost:5000`)*

---

## 5️⃣ Contribution Guidelines

1.  **Branching:** Create a new branch for your feature (`feature/your-feature-name`).
2.  **Commits:** Use clear, descriptive commit messages.
3.  **Code Style:** Ensure your code follows the existing formatting and run `npm run lint` before submitting.
4.  **Pull Requests:** Submit a PR with a summary of your changes for review.
