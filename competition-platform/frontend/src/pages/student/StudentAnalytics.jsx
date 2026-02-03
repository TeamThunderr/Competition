import React from 'react';
import StudentSidebar from './Sidebar';

const StudentAnalytics = () => {
    return (
        <div className="flex bg-gray-50 min-h-screen font-sans text-gray-900">
            <StudentSidebar isOpen={false} /> {/* Mobile toggle state management might be needed here usually, but for now simple render */}

            <div className="flex-1 flex flex-col min-w-0 md:ml-64 p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Analytics</h1>
                    <p className="text-gray-500 mt-1">Track your performance and participation stats.</p>
                </header>

                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-lg font-medium text-gray-900">Analytics Coming Soon</h3>
                    <p className="text-gray-500 mt-1">We are working on visualizing your participation data.</p>
                </div>
            </div>
        </div>
    );
};

export default StudentAnalytics;
