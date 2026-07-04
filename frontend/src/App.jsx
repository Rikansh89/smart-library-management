import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import StudentDashboard from './pages/student/Dashboard';
import BookCatalog from './pages/student/BookCatalog';
import BookDetails from './pages/student/BookDetails';
import MyBooks from './pages/student/MyBooks';
import Reservations from './pages/student/Reservations';
import StudyRoom from './pages/student/StudyRoom';
import DigitalLibrary from './pages/student/DigitalLibrary';
import Notifications from './pages/student/Notifications';
import Profile from './pages/student/Profile';
import LibrarianDashboard from './pages/librarian/Dashboard';
import ManageBooks from './pages/librarian/ManageBooks';
import ManageIssues from './pages/librarian/ManageIssues';
import ManageReservations from './pages/librarian/ManageReservations';
import ManageRooms from './pages/librarian/ManageRooms';
import LibrarianResources from './pages/librarian/Resources';
import AdminDashboard from './pages/admin/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';
import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 transition-page">
        <Routes>
          <Route path="/" element={user ? <DashboardRedirect role={user.role} /> : <Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/student/dashboard" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/books" element={<ProtectedRoute roles={['student']}><BookCatalog /></ProtectedRoute>} />
          <Route path="/student/books/:id" element={<ProtectedRoute roles={['student']}><BookDetails /></ProtectedRoute>} />
          <Route path="/student/my-books" element={<ProtectedRoute roles={['student']}><MyBooks /></ProtectedRoute>} />
          <Route path="/student/reservations" element={<ProtectedRoute roles={['student']}><Reservations /></ProtectedRoute>} />
          <Route path="/student/study-room" element={<ProtectedRoute roles={['student']}><StudyRoom /></ProtectedRoute>} />
          <Route path="/student/digital-library" element={<ProtectedRoute roles={['student']}><DigitalLibrary /></ProtectedRoute>} />
          <Route path="/librarian/dashboard" element={<ProtectedRoute roles={['librarian']}><LibrarianDashboard /></ProtectedRoute>} />
          <Route path="/librarian/books" element={<ProtectedRoute roles={['librarian']}><ManageBooks /></ProtectedRoute>} />
          <Route path="/librarian/issues" element={<ProtectedRoute roles={['librarian']}><ManageIssues /></ProtectedRoute>} />
          <Route path="/librarian/reservations" element={<ProtectedRoute roles={['librarian']}><ManageReservations /></ProtectedRoute>} />
          <Route path="/librarian/rooms" element={<ProtectedRoute roles={['librarian']}><ManageRooms /></ProtectedRoute>} />
          <Route path="/librarian/resources" element={<ProtectedRoute roles={['librarian']}><LibrarianResources /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><ManageUsers /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><Analytics /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><Settings /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function DashboardRedirect({ role }) {
  const dashboards = {
    student: '/student/dashboard',
    librarian: '/librarian/dashboard',
    admin: '/admin/dashboard'
  };
  return <Navigate to={dashboards[role] || '/'} replace />;
}

export default App;
