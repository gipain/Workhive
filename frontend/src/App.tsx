import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/layout/Layout';
import { PublicLayout } from './components/layout/PublicLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { lazy, Suspense } from 'react';
import { PageLoader } from './components/ui/Skeleton';

// Lazy-loaded pages
const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

// Student pages
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const BrowseProjects = lazy(() => import('./pages/student/BrowseProjects'));
const ProjectDetail = lazy(() => import('./pages/student/ProjectDetail'));
const MyApplications = lazy(() => import('./pages/student/MyApplications'));
const StudentInvitations = lazy(() => import('./pages/student/StudentInvitations'));
const StudentProfilePage = lazy(() => import('./pages/student/StudentProfilePage'));
const StudentCertificates = lazy(() => import('./pages/student/StudentCertificates'));
const StudentSubmissions = lazy(() => import('./pages/student/StudentSubmissions'));
const StudentMyProjects = lazy(() => import('./pages/student/MyProjects'));

// Company pages
const CompanyDashboard = lazy(() => import('./pages/company/CompanyDashboard'));
const MyProjects = lazy(() => import('./pages/company/MyProjects'));
const CreateProject = lazy(() => import('./pages/company/CreateProject'));
const ProjectManagement = lazy(() => import('./pages/company/ProjectManagement'));
const BrowseStudents = lazy(() => import('./pages/company/BrowseStudents'));
const CompanyProfilePage = lazy(() => import('./pages/company/CompanyProfilePage'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminComplaints = lazy(() => import('./pages/admin/AdminComplaints'));
const AdminStudents = lazy(() => import('./pages/admin/AdminStudents'));
const AdminCompanies = lazy(() => import('./pages/admin/AdminCompanies'));
const AdminProjects = lazy(() => import('./pages/admin/AdminProjects'));

// Shared
const NotificationsPage = lazy(() => import('./pages/shared/NotificationsPage'));

function App() {
  const { isAuthenticated, fetchUser } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token && !isAuthenticated) {
      fetchUser();
    }
  }, []);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes – no container constraint */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* App routes – with max-w-7xl container */}
        <Route element={<Layout />}>

          {/* Student routes */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/projects" element={<BrowseProjects />} />
            <Route path="/student/projects/:id" element={<ProjectDetail />} />
            <Route path="/student/applications" element={<MyApplications />} />
            <Route path="/student/invitations" element={<StudentInvitations />} />
            <Route path="/student/profile" element={<StudentProfilePage />} />
            <Route path="/student/certificates" element={<StudentCertificates />} />
            <Route path="/student/submissions/:projectId" element={<StudentSubmissions />} />
            <Route path="/student/my-projects" element={<StudentMyProjects />} />
            <Route path="/student/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Company routes */}
          <Route element={<ProtectedRoute allowedRoles={['company']} />}>
            <Route path="/company/dashboard" element={<CompanyDashboard />} />
            <Route path="/company/projects" element={<MyProjects />} />
            <Route path="/company/projects/new" element={<CreateProject />} />
            <Route path="/company/projects/:id" element={<ProjectManagement />} />
            <Route path="/company/students" element={<BrowseStudents />} />
            <Route path="/company/profile" element={<CompanyProfilePage />} />
            <Route path="/company/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Admin routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/companies" element={<AdminCompanies />} />
            <Route path="/admin/projects" element={<AdminProjects />} />
            <Route path="/admin/complaints" element={<AdminComplaints />} />
            <Route path="/admin/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
