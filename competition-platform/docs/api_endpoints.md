# API Endpoints

## Base URL
All endpoints are prefixed with the server URL (e.g., `http://localhost:5000` or production URL).

## Authentication
**Base Path:** `/api/auth`
| Method | Endpoint | Controller Function | Description |
| :--- | :--- | :--- | :--- |
| POST | `/login` | `authController.login` | Login via email (Development/Insecure) |
| POST | `/save-token` | `authController.saveGoogleToken` | Save Google OAuth token |

## Student Features
**Base Path:** `/api/student`
| Method | Endpoint | Controller Function | Description |
| :--- | :--- | :--- | :--- |
| GET | `/competitions` | `competitionController.getAllCompetitions` | List all competitions |
| GET | `/competition/:id` | `competitionController.getCompetitionDetails` | Get competition details |
| POST | `/check-status` | `registrationController.checkRegistrationStatus` | Check registration status |
| POST | `/upload-proof` | `registrationController.uploadProof` | Upload payment/registration proof |
| POST | `/request-od` | `odController.requestOD` | Request On-Duty (OD) |
| GET | `/od-requests` | `odController.getMyODRequests` | Get my OD requests |
| GET | `/profile` | `profileController.getProfile` | Get student profile |
| PUT | `/profile` | `profileController.updateProfile` | Update student profile |

## Faculty Features
**Base Path:** `/api/faculty`
| Method | Endpoint | Controller Function | Description |
| :--- | :--- | :--- | :--- |
| GET | `/students` | `facultyController.getMyStudents` | Get students under faculty |
| GET | `/students/:studentId` | `facultyController.getStudentDetails` | Get specific student details |
| GET | `/stats` | `facultyController.getStats` | Get legacy stats |
| GET | `/dashboard-stats` | `facultyController.getDashboardStats` | Get dashboard stats (V2) |
| GET | `/registrations` | `facultyController.getRecentRegistrations` | Get recent registrations |
| GET | `/competitions` | `facultyCompetitionController.getAllCompetitions` | View competitions |
| GET | `/competition/:id` | `facultyCompetitionController.getCompetitionDetails` | View competition details |
| GET | `/competition/:id/students` | `facultyCompetitionController.getCompetitionStudents` | View students in competition |
| POST | `/competition/:competitionId/sync`| `facultyController.syncCompetition` | Sync competition data |
| POST | `/sync-competition/:competitionId`| `facultyController.syncCompetition` | Sync competition data (Alias) |
| GET | `/competition-sync-status` | `facultyController.getCompetitionSyncStatus` | Get sync status |
| GET | `/pending-verifications` | `verificationController.getPendingVerifications`| Get pending verifications |
| POST | `/verify-registration` | `verificationController.verifyRegistration` | Verify registration |

## HOD Features
**Base Path:** `/api/hod`
| Method | Endpoint | Controller Function | Description |
| :--- | :--- | :--- | :--- |
| GET | `/stats` | `hodController.getDepartmentStats` | Get department stats |
| GET | `/users` | `hodController.getDepartmentUsers` | Get department users |
| GET | `/analytics` | `hodController.getDepartmentAnalytics` | Get department analytics |
| GET | `/dashboard-analysis` | `hodController.getDashboardAnalysis` | Get dashboard analysis |
| GET | `/stats/export-winners` | `hodController.exportWinnersCsv` | Export winners CSV |
| GET | `/students/:studentId` | `hodController.getStudentDetails` | Get student details |
| GET | `/faculty` | `hodController.getDepartmentFaculty` | Get faculty list |
| GET | `/competitions` | `hodCompetitionController.getAllCompetitions` | View all competitions |
| GET | `/competition/:id` | `hodCompetitionController.getCompetitionDetails` | View competition details |
| GET | `/competition/:id/stats` | `hodCompetitionController.getCompetitionStats` | View competition stats |
| GET | `/pending-od` | `odController.getPendingODRequests` | Get pending OD requests |
| POST | `/manage-od` | `odController.manageODRequest` | Approve/Reject OD request |

## Admin Features
**Base Path:** `/api/admin`
| Method | Endpoint | Controller Function | Description |
| :--- | :--- | :--- | :--- |
| POST | `/competition` | `adminController.addCompetition` | Add manual competition |
| PUT | `/competition/:id` | `adminController.editCompetition` | Edit competition |
| DELETE | `/competition/:id` | `adminController.deleteCompetition` | Delete competition |
| POST | `/competition/upload` | `adminController.uploadCompetitions` | Upload competitions (only excel/csv) |
| GET | `/stats` | `statsController.getDepartmentStats` | Get department stats |
| GET | `/competition/:id/stats` | `statsController.getCompetitionStats` | Get competition stats |
| GET | `/students` | `usersController.getStudents` | Get all students |
| GET | `/student/:id` | `usersController.getStudentDetails` | Get student details |
| GET | `/faculty` | `usersController.getFaculty` | Get all faculty |

## core: Competitions (Public/Common)
**Base Path:** `/api/competitions`
| Method | Endpoint | Controller Function | Description |
| :--- | :--- | :--- | :--- |
| GET | `/` | `competitionController.getAllCompetitions` | List all competitions |
| POST | `/` | `competitionController.createCompetition` | Create competition |
| GET | `/:id` | `competitionController.getCompetitionById` | Get competition details |

## core: Teams
**Base Path:** `/api/teams`
| Method | Endpoint | Controller Function | Description |
| :--- | :--- | :--- | :--- |
| POST | `/create` | `teamController.createTeam` | Create a team |
| POST | `/invite` | `teamController.inviteMember` | Invite member to team |
| POST | `/accept` | `teamController.acceptInvite` | Accept team invitation |

## core: Approvals
**Base Path:** `/api/approvals`
| Method | Endpoint | Controller Function | Description |
| :--- | :--- | :--- | :--- |
| POST | `/request` | `approvalController.requestApproval` | Student requests permission |
| POST | `/faculty` | `approvalController.updateFacultyStatus` | Faculty update status |
| POST | `/hod` | `approvalController.updateHodStatus` | HOD update status |
| GET | `/list` | `approvalController.getDepartmentApprovals` | Get approval list |
