import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentCompetitions from './pages/student/StudentCompetitions';
import StudentProfile from './pages/student/StudentProfile';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import HodDashboard from './pages/hod/HodDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  // Mock user for now
  const user = { role: 'student' };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Student Routes */}
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/competitions" element={<StudentCompetitions />} />
        <Route path="/student/profile" element={<StudentProfile />} />

        {/* Faculty Routes */}
        <Route path="/faculty" element={<FacultyDashboard />} />

        {/* HOD Routes */}
        <Route path="/hod" element={<HodDashboard />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}

export default App;
