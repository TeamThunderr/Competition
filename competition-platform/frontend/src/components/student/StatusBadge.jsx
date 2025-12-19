// File Name: StatusBadge.jsx
// Purpose: Display status with consistent colors
// Written for beginner developers

const StatusBadge = ({ status }) => {
    let colorClass = 'bg-gray-100 text-gray-800';

    if (status === 'Approved') colorClass = 'bg-green-100 text-green-800';
    if (status === 'Pending') colorClass = 'bg-yellow-100 text-yellow-800';
    if (status === 'Rejected') colorClass = 'bg-red-100 text-red-800';

    return (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}>
            {status}
        </span>
    );
};

export default StatusBadge;
