# Database Tables Documentation

This document explains the purpose of each table in the Competition Platform database and identifies potential redundancies.

---

## Core Tables

### `users`
**Purpose**: Stores all user accounts (students, faculty, HODs, admins).

| Key Fields | Description |
|------------|-------------|
| `role` | User type (student, faculty, hod, admin) |
| `department_id` | Links to department |
| `registration_no` | Student registration number |
| `cgpa`, `attendance` | Academic metrics |
| `assigned_sections` | For faculty - sections they manage |
| `google_refresh_token` | For Gmail integration/sync |

---

### `departments`
**Purpose**: Master list of departments (CSE, ECE, etc.).

| Key Fields | Description |
|------------|-------------|
| `name` | Department name (unique) |

---

### `competitions`
**Purpose**: Stores all competition/hackathon details.

| Key Fields | Description |
|------------|-------------|
| `title`, `description` | Competition info |
| `organizer`, `platform` | Who's hosting it |
| `registration_deadline`, `event_date` | Key dates |
| `team_allowed`, `min/max_team_size` | Team configuration |
| `departments` | Which departments can participate |
| `created_by` | Faculty/admin who added it |

---

## Participation & Registration Tables

### `registrations`
**Purpose**: Tracks when a student **registers** for a competition.

| Key Fields | Description |
|------------|-------------|
| `user_id`, `competition_id` | Who registered for what |
| `source` | How they registered (manual, gmail sync) |
| `proof_url` | Screenshot/proof of registration |
| `verified`, `verified_by` | Faculty verification |
| `status` | Registration status |

---

### `participation`
**Purpose**: Tracks the **full lifecycle** of a student's participation (registration → completion).

| Key Fields | Description |
|------------|-------------|
| `student_id`, `competition_id` | Who participated in what |
| `status` | NOT_REGISTERED, REGISTERED, COMPLETED, etc. |
| `verification_source` | MANUAL, GMAIL, FACULTY |
| `gmail_message_id`, `matched_keyword` | Gmail sync tracking |
| `confidence_score` | Auto-detection confidence |

> [!WARNING]
> **Potential Redundancy**: `registrations` and `participation` tables have overlapping purposes. Consider merging them.

---

### `competition_status`
**Purpose**: Tracks if a student was **shortlisted** or **won** a competition.

| Key Fields | Description |
|------------|-------------|
| `user_id`, `competition_id` | Who and which competition |
| `is_shortlisted` | Made it to next round |
| `is_winner` | Won the competition |

> [!IMPORTANT]
> **Potential Redundancy**: This could be fields in `participation` table instead of a separate table.

---

## Team Tables

### `teams`
**Purpose**: Stores team information for team-based competitions.

| Key Fields | Description |
|------------|-------------|
| `competition_id` | Which competition |
| `leader_id` | Team leader (user) |
| `team_name` | Team name |

---

### `team_members`
**Purpose**: Junction table linking users to teams (many-to-many).

| Key Fields | Description |
|------------|-------------|
| `team_id`, `user_id` | Which user in which team |

---

## Administrative Tables

### `od_requests`
**Purpose**: On-Duty (OD) requests for students to attend competitions.

| Key Fields | Description |
|------------|-------------|
| `user_id`, `competition_id` | Who needs OD for what |
| `reason` | Why they need OD |
| `status` | PENDING, APPROVED, REJECTED |
| `approved_by`, `approved_at` | Approval tracking |
| `approved_days`, `time_slot` | Duration of OD |

---

## Summary: Actual Usage Analysis

Based on codebase analysis:

### Current Architecture (V2 Design)

```
┌──────────────────────────────────────────────────────────────────┐
│                         FACT TABLE                                │
│  registrations → "Did the student register?" (binary fact)       │
│  - Source: Manual registration, Gmail sync                       │
│  - Used by: All dashboards, stats, verification                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                     PROGRESSION TABLE                             │
│  competition_status → "What happened after registration?"        │
│  - is_shortlisted, is_winner                                     │
│  - Used by: All dashboards, HOD analytics, faculty verification  │
└──────────────────────────────────────────────────────────────────┘
```

### The `participation` Table Issue

| Table | Usage Count | Status |
|-------|-------------|--------|
| `registrations` | **~50+ references** | ✅ Heavily used |
| `competition_status` | **~40+ references** | ✅ Heavily used |
| `participation` | **~20 references** | ⚠️ Legacy/Duplicate |

> [!CAUTION]
> The `participation` table appears to be **legacy** or was part of an older design. It's only used by:
> - `gmailToRegistration.service.js` (Gmail sync writes here)
> - Some cleanup scripts
> - A few controllers reading from both tables
>
> **This creates data fragmentation** - same data may exist in both `registrations` AND `participation`.

---

## Recommended Action

### Option A: Remove `participation` Table (Recommended)
1. Migrate any unique data from `participation` → `registrations`
2. Update Gmail sync to write to `registrations` instead
3. Drop `participation` table

### Option B: Keep Current Design
If intentional separation:
- `registrations` = Manual registrations only
- `participation` = Gmail auto-detected only

But this requires clear documentation and consistent query logic.

---

## Final Table Necessity Summary

| Table | Verdict | Notes |
|-------|---------|-------|
| `users` | ✅ **KEEP** | Core table |
| `departments` | ✅ **KEEP** | Master data |
| `competitions` | ✅ **KEEP** | Core table |
| `registrations` | ✅ **KEEP** | Primary registration tracking |
| `competition_status` | ✅ **KEEP** | Tracks shortlisted/winner status |
| `teams` | ✅ **KEEP** | Team support |
| `team_members` | ✅ **KEEP** | Junction table |
| `od_requests` | ✅ **KEEP** | OD workflow |
| `participation` | ❌ **CONSIDER REMOVING** | Overlaps with `registrations` |
