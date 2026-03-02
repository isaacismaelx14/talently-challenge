import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { useAuth, AuthProvider } from '../providers/AuthProvider';
import { ROUTES } from '../lib/constants';

// Layouts
import AppLayout from '../components/layout/AppLayout';

// Pages
import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import JobOffersPage from '../features/job-offers/JobOffersPage';
import JobOfferDetailPage from '../features/job-offers/JobOfferDetailPage';
import CandidatesPage from '../features/candidates/CandidatesPage';
import CandidateDetailPage from '../features/candidates/CandidateDetailPage';
import ScoringDetailPage from '../features/scorings/ScoringDetailPage';

function AuthGuard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  console.log('[AuthGuard]', { user: !!user, isLoading, isAuthenticated, path: window.location.pathname });
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    console.log('[AuthGuard] No user, redirecting to login');
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}

function GuestGuard() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (user) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      {
        path: '/',
        element: <Navigate to={ROUTES.DASHBOARD} replace />,
      },
      {
        element: <GuestGuard />,
        children: [
          {
            path: ROUTES.LOGIN,
            element: <LoginPage />,
          },
        ],
      },
      {
        element: <AuthGuard />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: ROUTES.DASHBOARD, element: <DashboardPage /> },
              { path: ROUTES.JOB_OFFERS, element: <JobOffersPage /> },
              { path: '/job-offers/:id', element: <JobOfferDetailPage /> },
              { path: ROUTES.CANDIDATES, element: <CandidatesPage /> },
              { path: '/candidates/:id', element: <CandidateDetailPage /> },
              { path: '/scorings/:id', element: <ScoringDetailPage /> },
            ]
          }
        ],
      },
      {
        path: '*',
        element: <div className="flex flex-col items-center justify-center h-screen">404 - Not Found</div>,
      }
    ]
  }
]);
