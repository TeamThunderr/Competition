// File Name: StatusBadge.jsx
// Purpose: Display the status of a competition application
// Written for beginner developers

import React from 'react';

const StatusBadge = ({ status }) => {
    // Status colors
    const colors = {
        PENDING: 'bg-yellow-100 text-yellow-800',
        VERIFIED: 'bg-blue-100 text-blue-800',
        APPROVED: 'bg-green-100 text-green-800',
        REJECTED: 'bg-red-100 text-red-800',
        SHORTLISTED: 'bg-purple-100 text-purple-800',
        OD_APPROVED: 'bg-green-100 text-green-800'
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
};

export default StatusBadge;
