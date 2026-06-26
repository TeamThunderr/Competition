// File Name: ProtectedRoute.jsx
// Purpose: Guards routes based on authentication and role.
//
// Usage in App.jsx:
//   <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
//     <Route path="dashboard" element={<StudentDashboard />} />
//   </Route>
//
// - If not authenticated → redirect to /login
// - If authenticated but wrong role → redirect to /login with an error message
// - If loading (auth state being determined) → show a spinner
// - If authorized → render <Outlet /> (child routes)

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, role, isLoading } = useAuth();
    const location = useLocation();

    // Still determining auth state from localStorage — show a neutral loader
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-gray-300 dark:border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Verifying session…</p>
                </div>
            </div>
        );
    }

    // Not logged in at all
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location, reason: 'unauthenticated' }} replace />;
    }

    // Logged in but wrong role
    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/login" state={{ from: location, reason: 'unauthorized', userRole: role }} replace />;
    }

    // All good — render children
    return <Outlet />;
};

export default ProtectedRoute;
