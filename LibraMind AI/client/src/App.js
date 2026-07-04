import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Common/ProtectedRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

import StudentDashboard from './pages/student/Dashboard';
import StudentBooks from './pages/student/Books';
import StudentMyBooks from './pages/student/MyBooks';
import StudentChatbot from './pages/student/Chatbot';

import LibrarianDashboard from './pages/librarian/Dashboard';
import BookManagement from './pages/librarian/BookManagement';
import IssueReturn from './pages/librarian/IssueReturn';
import Reservations from './pages/librarian/Reservations';

import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import Analytics from './pages/admin/Analytics';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '10px', background: '#333', color: '#fff' }
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />

          <Route path="books" element={<ProtectedRoute roles={['student']}><StudentBooks /></ProtectedRoute>} />
          <Route path="my-books" element={<ProtectedRoute roles={['student']}><StudentMyBooks /></ProtectedRoute>} />
          <Route path="chatbot" element={<ProtectedRoute roles={['student']}><StudentChatbot /></ProtectedRoute>} />

          <Route path="manage-books" element={<ProtectedRoute roles={['librarian', 'admin']}><BookManagement /></ProtectedRoute>} />
          <Route path="issue-return" element={<ProtectedRoute roles={['librarian', 'admin']}><IssueReturn /></ProtectedRoute>} />
          <Route path="reservations" element={<ProtectedRoute roles={['librarian', 'admin']}><Reservations /></ProtectedRoute>} />

          <Route path="users" element={<ProtectedRoute roles={['admin']}><UserManagement /></ProtectedRoute>} />
          <Route path="analytics" element={<ProtectedRoute roles={['admin']}><Analytics /></ProtectedRoute>} />

          <Route path="*" element={<div className="p-8 text-center"><h1 className="text-4xl font-bold text-gray-400">404</h1><p>Page not found</p></div>} />
        </Route>
      </Routes>
    </>
  );
}

function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'student') return <StudentDashboard />;
  if (user?.role === 'librarian') return <LibrarianDashboard />;
  if (user?.role === 'admin') return <AdminDashboard />;
  return <Navigate to="/login" />;
}

export default App;
