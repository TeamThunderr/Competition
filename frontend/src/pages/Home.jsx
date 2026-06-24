import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const Home = () => {
    const location = useLocation();
    // Redirect all landing page traffic to the unified login gateway
    // Ensure we preserve any OAuth hash fragments or search params
    return <Navigate to={`/login${location.search}${location.hash}`} replace />;
};

export default Home;
