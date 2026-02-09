import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import StudentCompetitions from './pages/student/StudentCompetitions';
import StudentDashboard from './pages/student/StudentDashboard';
import ODLetter from './pages/student/ODLetter';
import ODRequestPage from './pages/student/ODRequestPage';
import ODHistoryPage from './pages/student/ODHistoryPage';
import Settings from './pages/student/Settings';
import Profile from './pages/student/Profile';
import StudentAnalytics from './pages/student/StudentAnalytics';

import FacultyDashboard from './pages/faculty/FacultyDashboard';
import StudentList from './pages/faculty/StudentList';
import StudentDetail from './pages/faculty/StudentDetail';
import FacultyVerify from './pages/faculty/FacultyVerify';
import FacultyTeamVerify from './pages/faculty/FacultyTeamVerify';
import ActiveCompetitions from './pages/faculty/ActiveCompetitions';

import HodDashboard from './pages/hod/HodDashboard';
import OdApprovals from './pages/hod/OdApprovals';
import OdRequestDetail from './pages/hod/OdRequestDetail'; // Import
import HodAnalytics from './pages/hod/HodAnalytics';

import HodCompetitions from './pages/hod/HodCompetitions';
import HodStudentDetail from './pages/hod/HodStudentDetail';

import HodFaculty from './pages/hod/HodFaculty';
import CompetitionSectionDetails from './pages/hod/CompetitionSectionDetails';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentSearch from './pages/admin/StudentSearch';
import UploadCompetitions from './pages/admin/UploadCompetitions';

import ManualVerification from './pages/faculty/ManualVerification';
import GlobalRepository from './pages/admin/GlobalRepository';
import ActivityLogs from './pages/admin/ActivityLogs';
import StudentDetails from './pages/admin/StudentDetails';
import CompetitionStats from './pages/admin/CompetitionStats';

import DeptPerformance from './pages/admin/DeptPerformance';
import CompetitionDetails from './pages/common/CompetitionDetails';
import './App.css';

function App() {
  // Simple Auth Check on Mount (Optional)
  // Since we use localStorage in Login.jsx, we can just rely on protected routes or component checks.
  // For now, removing Supabase Auth Listener completely.

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />


      {/* Role Based Routes - Can protect these later with Middleware */}
      <Route path="/student" element={<Navigate to="/student/competitions" replace />} />
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/student/competitions" element={<StudentCompetitions />} />
      <Route path="/student/profile" element={<Profile />} />
      <Route path="/student/od-letters" element={<ODLetter />} />
      <Route path="/student/settings" element={<Settings />} />
      <Route path="/student/stats" element={<StudentAnalytics />} />
      <Route path="/student/od-request/:competitionId" element={<ODRequestPage />} />
      <Route path="/student/od-history" element={<ODHistoryPage />} />

      <Route path="/faculty/verification" element={<ManualVerification />} />

      <Route path="/faculty" element={<FacultyDashboard />} />
      <Route path="/faculty/students" element={<StudentList />} />
      <Route path="/faculty/students/:id" element={<StudentDetail />} />
      <Route path="/faculty/verify" element={<FacultyVerify />} />
      <Route path="/faculty/verify-teams" element={<FacultyTeamVerify />} />
      <Route path="/faculty/competitions" element={<ActiveCompetitions />} />



      {/* HOD Routes */}
      <Route path="/hod" element={<HodDashboard />} />
      <Route path="/hod/approvals" element={<OdApprovals />} />
      <Route path="/hod/od-requests/:id" element={<OdRequestDetail />} /> {/* New Route */}
      <Route path="/hod/analytics" element={<HodAnalytics />} />
      <Route path="/hod/competitions" element={<HodCompetitions />} />
      <Route path="/hod/students/:id" element={<HodStudentDetail />} />
      <Route path="/hod/students/:id" element={<HodStudentDetail />} />
      <Route path="/hod/faculty" element={<HodFaculty />} />
      <Route path="/hod/competitions/:id/section/:sectionName" element={<CompetitionSectionDetails />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/search" element={<StudentSearch />} />
      <Route path="/admin/upload" element={<UploadCompetitions />} />
      <Route path="/admin/repository" element={<GlobalRepository />} />
      <Route path="/admin/logs" element={<ActivityLogs />} />
      <Route path="/admin/repository/:id" element={<CompetitionStats />} />
      <Route path="/admin/student/:id" element={<StudentDetails />} />
      <Route path="/admin/performance" element={<DeptPerformance />} />

      {/* Common Routes */}
      <Route path="/competitions/:id" element={<CompetitionDetails />} />
    </Routes>
  );
}

export default App;
