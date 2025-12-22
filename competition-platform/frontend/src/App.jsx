import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import OAuthConsent from './pages/auth/OAuthConsent';
import StudentCompetitions from './pages/student/competitionDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import MyTeams from './pages/student/MyTeams';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import StudentList from './pages/faculty/StudentList';
import FacultyAlerts from './pages/faculty/FacultyAlerts';
import ActiveCompetitions from './pages/faculty/ActiveCompetitions';
import HodDashboard from './pages/hod/HodDashboard';
import OdApprovals from './pages/hod/OdApprovals';
import HodAnalytics from './pages/hod/HodAnalytics';
import HodNotifications from './pages/hod/HodNotifications';
import HodCompetitions from './pages/hod/HodCompetitions';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentSearch from './pages/admin/StudentSearch';
import UploadCompetitions from './pages/admin/UploadCompetitions';
import GlobalRepository from './pages/admin/GlobalRepository';
import DeptPerformance from './pages/admin/DeptPerformance';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/oauth/consent" element={<OAuthConsent />} />

      {/* Role Based Routes - Can protect these later with Middleware */}
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/student/competitions" element={<StudentCompetitions />} />
      <Route path="/student/teams" element={<MyTeams />} />
      <Route path="/faculty" element={<FacultyDashboard />} />
      <Route path="/faculty/students" element={<StudentList />} />
      <Route path="/faculty/alerts" element={<FacultyAlerts />} />
      <Route path="/faculty/competitions" element={<ActiveCompetitions />} />

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
    </Routes>
  );
}

export default App;
