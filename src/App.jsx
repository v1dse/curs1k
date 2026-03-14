import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';
import { AuthProvider, useAuth } from './elements/AuthContext';
import LoginPage from './pages/LoginPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import WatchPage from './pages/WatchPage';
import ProgressPage from './pages/ProgressPage';
import AdminPage from './pages/AdminPage';
import AdminCourseEditPage from './pages/AdminCourseEditPage';
import './App.css';

function PrivateRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#0a0a0a',
      }}>
        <div className="spinner" />
      </div>
    );
  }
  return token ? children : <Navigate to="/login" replace />;
}


function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/courses" replace />} />
      <Route path="/courses" element={<PrivateRoute><CoursesPage /></PrivateRoute>} />
      <Route path="/course/:id" element={<PrivateRoute><CourseDetailPage /></PrivateRoute>} />
      <Route path="/course/:id/watch/:videoId" element={<PrivateRoute><WatchPage /></PrivateRoute>} />
      <Route path="/progress" element={<PrivateRoute><ProgressPage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
      <Route path="/admin/course/:id/edit" element={<PrivateRoute><AdminCourseEditPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/courses" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
