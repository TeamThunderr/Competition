import { Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { SyncProvider } from './context/SyncContext';

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
import Onboarding from './pages/student/Onboarding';
import StudentCoding from './pages/student/StudentCoding';

import FacultyDashboard from './pages/faculty/FacultyDashboard';
import StudentList from './pages/faculty/StudentList';
import StudentDetail from './pages/faculty/StudentDetail';
import FacultyVerify from './pages/faculty/FacultyVerify';
import ActiveCompetitions from './pages/faculty/ActiveCompetitions';

import HodDashboard from './pages/hod/HodDashboard';
import OdApprovals from './pages/hod/OdApprovals';
import OdRequestDetail from './pages/hod/OdRequestDetail';
import HodAnalytics from './pages/hod/HodAnalytics';
import HodCompetitions from './pages/hod/HodCompetitions';
import HodStudentDetail from './pages/hod/HodStudentDetail';
import HodFaculty from './pages/hod/HodFaculty';
import CompetitionSectionDetails from './pages/hod/CompetitionSectionDetails';
import HodCompetitionDiscovery from './pages/hod/HodCompetitionDiscovery';
import HodCodingAnalytics from './pages/hod/HodCodingAnalytics';

import AdminDashboard from './pages/admin/AdminDashboard';
import StudentSearch from './pages/admin/StudentSearch';
import UploadCompetitions from './pages/admin/UploadCompetitions';
import GlobalRepository from './pages/admin/GlobalRepository';
import ActivityLogs from './pages/admin/ActivityLogs';
import StudentDetails from './pages/admin/StudentDetails';
import CompetitionStats from './pages/admin/CompetitionStats';
import DeptPerformance from './pages/admin/DeptPerformance';
import AdminCompetitionDiscovery from './pages/admin/AdminCompetitionDiscovery';
import AdminCodingAnalytics from './pages/admin/AdminCodingAnalytics';

import CompetitionDetails from './pages/common/CompetitionDetails';
import StudentLayout from './pages/student/StudentLayout';
import FacultyLayout from './pages/faculty/FacultyLayout';
import HodLayout from './pages/hod/HodLayout';
import AdminLayout from './pages/admin/AdminLayout';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Analytics />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Common Protected Routes (any authenticated user) */}
          <Route path="/competitions/:id" element={<CompetitionDetails />} />

          {/* ── Student Routes ─────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="competitions" element={<StudentCompetitions />} />
              <Route path="profile" element={<Profile />} />
              <Route path="coding" element={<StudentCoding />} />
              <Route path="od-letters" element={<ODLetter />} />
              <Route path="settings" element={<Settings />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="stats" element={<StudentAnalytics />} />
              <Route path="od-request/:competitionId" element={<ODRequestPage />} />
              <Route path="od-history" element={<ODHistoryPage />} />
            </Route>
          </Route>

          {/* ── Faculty Routes ─────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['FACULTY']} />}>
            <Route path="/faculty" element={
              <SyncProvider>
                <FacultyLayout />
              </SyncProvider>
            }>
              <Route index element={<FacultyDashboard />} />
              <Route path="students" element={<StudentList />} />
              <Route path="students/:id" element={<StudentDetail />} />
              <Route path="verify" element={<FacultyVerify />} />
              <Route path="competitions" element={<ActiveCompetitions />} />
            </Route>
          </Route>

          {/* ── HOD Routes ─────────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['HOD']} />}>
            <Route path="/hod" element={<HodLayout />}>
              <Route index element={<HodDashboard />} />
              <Route path="od-requests/:id" element={<OdRequestDetail />} />
              <Route path="approvals" element={<OdApprovals />} />
              <Route path="analytics" element={<HodAnalytics />} />
              <Route path="coding" element={<HodCodingAnalytics />} />
              <Route path="competitions" element={<HodCompetitions />} />
              <Route path="discovery" element={<HodCompetitionDiscovery />} />
              <Route path="students/:id" element={<HodStudentDetail />} />
              <Route path="faculty" element={<HodFaculty />} />
              <Route path="competitions/:id/section/:sectionName" element={<CompetitionSectionDetails />} />
            </Route>
          </Route>

          {/* ── Admin Routes ───────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="search" element={<StudentSearch />} />
              <Route path="upload" element={<UploadCompetitions />} />
              <Route path="discovery" element={<AdminCompetitionDiscovery />} />
              <Route path="coding" element={<AdminCodingAnalytics />} />
              <Route path="repository" element={<GlobalRepository />} />
              <Route path="logs" element={<ActivityLogs />} />
              <Route path="repository/:id" element={<CompetitionStats />} />
              <Route path="performance" element={<DeptPerformance />} />
              <Route path="student/:id" element={<StudentDetails />} />
            </Route>
          </Route>

        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
