import React from 'react';
import Sidebar from './Sidebar';

const AdminPlaceholder = ({ title }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <div className="flex-1 ml-64 p-8">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-500 mt-2">Work in Progress</p>
            </div>
        </div>
    );
};

export default AdminPlaceholder;
