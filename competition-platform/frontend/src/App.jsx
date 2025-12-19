import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import OAuthConsent from './pages/auth/OAuthConsent';
import StudentDashboard from './pages/student/StudentDashboard';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import HodDashboard from './pages/hod/HodDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentSearch from './pages/admin/StudentSearch';
import UploadCompetitions from './pages/admin/UploadCompetitions';
import GlobalRepository from './pages/admin/GlobalRepository';
import DeptPerformance from './pages/admin/DeptPerformance';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/oauth/consent" element={<OAuthConsent />} />

      {/* Role Based Routes - Can protect these later with Middleware */}
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/faculty" element={<FacultyDashboard />} />
      <Route path="/hod" element={<HodDashboard />} />

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
