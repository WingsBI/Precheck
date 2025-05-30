import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import type { RootState } from '../store/store';

const ADMIN_ROLE = "Admin";
const QC_ROLE = "QC";
const STORE_ROLE = "Store";

// Define route access rules
const routeAccessRules = {
  '/irmsn/generate': [ADMIN_ROLE, QC_ROLE],
  '/irmsn/search-update': [ADMIN_ROLE, QC_ROLE],
  '/qrcode/generate': [ADMIN_ROLE, QC_ROLE],
  '/precheck/make-order': [ADMIN_ROLE, STORE_ROLE],
  '/precheck/make': [ADMIN_ROLE, STORE_ROLE],
  '/precheck/store-in': [ADMIN_ROLE, STORE_ROLE],
};

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading, isInitialized } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  // Show loading spinner while authentication is being initialized or loading
  if (isLoading || !isInitialized) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // If initialized and no user, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access for the current route
  const currentPath = location.pathname;
  const requiredRoles = Object.entries(routeAccessRules).find(([path]) => 
    currentPath.startsWith(path)
  )?.[1];

  if (requiredRoles && !requiredRoles.includes(user?.role || '')) {
    // If user doesn't have required role, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 