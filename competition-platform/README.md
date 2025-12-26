# 🎓 College Competition Intelligence Platform

> **"Where marks are born 😌🔥"**

## 🎯 About The Project

This projects is a specialized platform designed to automate and simplify how student achievements are tracked and verified. It bridges the gap between students, faculty, and HODs by providing a centralized system for managing hackathon and competition records.

**The Real Problem It Solves:**
Students participate in numerous external events but struggle to keep track of proofs and get OD (On-Duty) approvals. Faculty find it hard to verify generic screenshots. This platform automates detection using official college email and provides a verified workflow for approvals.

---

## 🧱 Tech Stack

We used a modern, industry-standard stack to ensure performance and reliability:

-   **Frontend:** `React` + `Vite` for a blazing fast UI, styled with `Tailwind CSS` for a premium look.
-   **Backend:** `Node.js` + `Express` for a robust and scalable API.
-   **Database:** `Supabase (PostgreSQL)` for real-time data and reliable storage.
-   **Auth:** `Google OAuth` restricted to the **@citchennai.net** domain to ensure only authorized college users can access the system.
-   **Automation:** `Gmail API` (ReadOnly) to automatically detect registration emails from platforms like Devfolio or Unstop.

---

## 📂 Project Structure

This project is organized to be clean, modular, and easy for new developers to understand.

### 🌳 Directory Tree

```text
/
├── backend/                  # Server-side logic
│   ├── Database/            # SQL Schemas and migrations
│   ├── src/
│   │   ├── config/          # Supabase & Env configurations
│   │   ├── controllers/     # Route logic (Feature-separated)
│   │   │   ├── auth/        # Login & Role handling
│   │   │   ├── faculty/     # Verification & Student lists
│   │   │   ├── hod/         # Dept stats & Approvals
│   │   │   ├── student/     # Dashboard & Registration
│   │   │   └── gmail/       # Email scanning logic
│   │   ├── middleware/      # Auth & Role guards
│   │   ├── routes/          # API Route definitions
│   │   ├── services/        # Business logic (Gmail, Stats)
│   │   ├── utils/           # Helpers (Response formatters)
│   │   ├── app.js           # Express App setup
│   │   └── server.js        # Entry point
│
├── frontend/                 # Client-side React app
│   ├── src/
│   │   ├── assets/          # Images & Icons
│   │   ├── components/      # Reusable UI cards & buttons
│   │   ├── pages/           # Full page views
│   │   │   ├── auth/        # Login Screen
│   │   │   ├── student/     # Student Dashboard
│   │   │   ├── faculty/     # Faculty Dashboard
│   │   │   └── hod/         # HOD Dashboard
│   │   ├── services/        # API Client functions
│   │   ├── App.jsx          # Main Router
│   │   └── main.jsx         # React Entry point
│   ├── vite.config.js       # Build config
│   └── tailwind.config.js   # Style config
```

### 🧠 Key Directories Explained

-   **`backend/src/controllers`**: The brain of the API. We separated controllers by role (`student`, `faculty`, `hod`) so you don’t get lost in one massive file.
-   **`backend/src/services/gmailService.js`**: The magic implementation. This service connects to Google, reads the last few emails, and uses keywords to find hackathon confirmations.
-   **`frontend/src/services`**: Contains lightweight wrappers like `authService.js` and `api.js` to handle fetch requests cleanly.

---

## 🔐 Auth & Security

Security is built-in, not an afterthought.

1.  **Workspace Restriction**: Login is strictly limited to **`@citchennai.net`** emails. Personal Gmail accounts cannot log in.
2.  **Role Guarding**: The backend verifies your role (Student, Faculty, HOD) on *every* protected request. You cannot access HOD routes just by changing the URL.
3.  **Gmail Safety**: We use `gmail.readonly` scope. The app *only* reads email metadata (Subject/Snippet) to find specific keywords like "Registration Confirmed" or "Shortlisted". It ignores your personal conversations.
4.  **No Storage**: We do **not** store your emails. We only save the extracted competition details (Name, Date, Status) into the database.

---

## 🧠 Core Feature: Gmail Autopilot

1.  **Login**: User logs in via Google.
2.  **Scan**: The app silently scans recent emails in the background.
3.  **Detect**: It looks for patterns like:
    -   Subject: *"Registration Confirmed"*
    -   Sender: *devfolio.co, unstop.com*
4.  **Action**:
    -   If found, it adds the competition to your "My Competitions" list automatically.
    -   The status is updated (e.g., from `Registered` to `Selected`).
5.  **Fallback**: If email detection fails, students can manually upload a screenshot, which Faculty will then verify.

---

## 🧪 Demo Mode & Seeded Data

**Why do we have this?**
Real-world data is messy, and sometimes you need things to look perfect for a presentation.

-   **Seeded Competitions**: The database comes pre-loaded with upcoming hackathons so the dashboard isn't empty (e.g., "Smart India Hackathon", "Google Solution Challenge").
-   **Manual Upload Fallback**: If the Gmail scan finds nothing (because it's a demo account), the "Mark Registered" button allows you to upload a proof image directly to simulate the workflow.
-   **Testing Accounts**: We use specific test accounts where data can be safely reset.

*Note: The current version runs on the **Real Gmail API**. If you log in with a real participating account, it will pull actual data!*

---

## 🧑‍💻 Coding Philosophy

-   **Beginner-Friendly**: Code is written to be read. Variable names are descriptive (`isVerified`, `hasRole`) rather than cryptic (`v`, `flag`).
-   **Modular**: One file, one job. You won't find 1000-line files here.
-   **Commented**: Critical logic (like the regex for email parsing) is explained in comments.
-   **No Over-engineering**: We used standard SQL and REST APIs instead of complex graph layers or microservices, keeping it easy to deploy and debug.

---

## 🚀 How to Run

Follow these steps to get the project running locally.

### Prerequisites
-   Node.js installed
-   A Supabase project set up (or ask team for credentials)
-   Google Cloud Credentials (for OAuth)

### 1. Clone the Repo
```bash
git clone https://github.com/TeamThunderr/Competition.git
cd competition-platform
```

### 2. Setup Backend
```bash
cd backend
npm install
# Create a .env file with your Supabase & Google keys
npm start
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
# Create a .env file with VITE_SUPABASE_URL etc.
npm run dev
```

### 4. Verification
Open `http://localhost:5173`. Login with your college email.

---

## 🔮 Future Scope

-   **AI-Based Parsing**: Move from keyword matching to using LLMs (Gemini/OpenAI) to understand email context better.
-   **Team Management**: Allow students to form teams and register members directly from the platform.
-   **WhatsApp Notifications**: Send alerts for upcoming deadlines.
-   **Admin Analytics**: Heatmaps showing which departments participate the most.

---

## 🏁 Conclusion

This platform isn't just a tracker; it's a culture builder. By verifying achievements and streamlining permissions, we encourage more students to participate in global events without the bureaucratic hassle.

**Use it. Win it. We track it.** 🏆
