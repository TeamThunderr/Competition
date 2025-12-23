import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import StudentCompetitions from './pages/student/StudentCompetitions';
import StudentDashboard from './pages/student/StudentDashboard';

import FacultyDashboard from './pages/faculty/FacultyDashboard';
import StudentList from './pages/faculty/StudentList';
import FacultyAlerts from './pages/faculty/FacultyAlerts';

import HodDashboard from './pages/hod/HodDashboard';
import OdApprovals from './pages/hod/OdApprovals';
import HodAnalytics from './pages/hod/HodAnalytics';
import HodNotifications from './pages/hod/HodNotifications';
import HodCompetitions from './pages/hod/HodCompetitions';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentSearch from './pages/admin/StudentSearch';
import UploadCompetitions from './pages/admin/UploadCompetitions';

import ManualVerification from './pages/faculty/ManualVerification';
import GlobalRepository from './pages/admin/GlobalRepository';

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
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/student/competitions" element={<StudentCompetitions />} />

      <Route path="/faculty/verification" element={<ManualVerification />} />

      <Route path="/faculty" element={<FacultyDashboard />} />
      <Route path="/faculty/students" element={<StudentList />} />
      <Route path="/faculty/alerts" element={<FacultyAlerts />} />


      {/* HOD Routes */}
      <Route path="/hod" element={<HodDashboard />} />
      <Route path="/hod/approvals" element={<OdApprovals />} />
      <Route path="/hod/analytics" element={<HodAnalytics />} />
      <Route path="/hod/notifications" element={<HodNotifications />} />
      <Route path="/hod/competitions" element={<HodCompetitions />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/search" element={<StudentSearch />} />
      <Route path="/admin/upload" element={<UploadCompetitions />} />
      <Route path="/admin/repository" element={<GlobalRepository />} />
      <Route path="/admin/performance" element={<DeptPerformance />} />

      {/* Common Routes */}
      <Route path="/competitions/:id" element={<CompetitionDetails />} />
    </Routes>
  );
}

export default App;
