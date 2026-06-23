# Frontend Routes

## Public Configuration
| Path | Component | Description |
| :--- | :--- | :--- |
| `/` | `Home` | Landing page |
| `/login` | `Login` | User login page |

## Student Routes
**Base Path:** `/student`
| Path | Component | Description |
| :--- | :--- | :--- |
| `/dashboard` | `StudentDashboard` | Main student dashboard |
| `/competitions` | `StudentCompetitions` | List of available competitions |
| `/profile` | `Profile` | Student profile view/edit |
| `/od-letters` | `ODLetter` | On-Duty request management |
| `/settings` | `Settings` | Account settings |
| `/stats` | `StudentAnalytics` | Personal performance analytics |

## Faculty Routes
**Base Path:** `/faculty`
| Path | Component | Description |
| :--- | :--- | :--- |
| `/` | `FacultyDashboard` | Main faculty dashboard |
| `/students` | `StudentList` | List of assigned students |
| `/students/:id` | `StudentDetail` | Detailed view of a specific student |
| `/verify` | `FacultyVerify` | Verification interface |
| `/verification` | `ManualVerification` | Manual verification interface |
| `/competitions` | `ActiveCompetitions` | View active competitions |

## HOD Routes
**Base Path:** `/hod`
| Path | Component | Description |
| :--- | :--- | :--- |
| `/` | `HodDashboard` | Main HOD dashboard |
| `/approvals` | `OdApprovals` | OD approval management |
| `/analytics` | `HodAnalytics` | Department analytics |
| `/competitions` | `HodCompetitions` | Department competition view |
| `/students/:id` | `HodStudentDetail` | Detailed view of a student |
| `/faculty` | `HodFaculty` | Faculty list and management |
| `/competitions/:id/section/:sectionName` | `CompetitionSectionDetails` | Deep dive into competition sections |

## Admin Routes
**Base Path:** `/admin`
| Path | Component | Description |
| :--- | :--- | :--- |
| `/` | `AdminDashboard` | Main admin dashboard |
| `/search` | `StudentSearch` | Global student search |
| `/upload` | `UploadCompetitions` | Bulk competition upload |
| `/repository` | `GlobalRepository` | Global document repository |
| `/repository/:id` | `CompetitionStats` | Text/Stats for a repository item |
| `/logs` | `ActivityLogs` | System activity logs |
| `/student/:id` | `StudentDetails` | Admin view of student details |
| `/performance` | `DeptPerformance` | Departmental performance metrics |

## Common Routes
| Path | Component | Description |
| :--- | :--- | :--- |
| `/competitions/:id` | `CompetitionDetails` | Public/Shared competition details view |
