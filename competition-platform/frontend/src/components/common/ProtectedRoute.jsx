// File Name: ProtectedRoute.jsx
// Purpose: Protect routes from unauthorized access
// Written for beginner developers

import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, user }) => {
    // If user is not logged in, redirect to login page
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Otherwise, show the content
    return children;
};

export default ProtectedRoute;
