import React from 'react';
import HodSidebar from './Sidebar';
import { Bell } from 'lucide-react';

const HodNotifications = () => {
    const notifications = []; // Empty as requested

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <HodSidebar />

            <div className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
                        <p className="text-gray-500 mt-1">High-level updates and department alerts.</p>
                    </div>

                    <button className="text-sm text-blue-600 font-medium hover:text-blue-800">
                        Mark all as read
                    </button>
                </div>

                <div className="space-y-4">
                    {notifications.length > 0 ? (
                        notifications.map(notif => (
                            <div key={notif.id}>
                                {/* Notification Card */}
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Bell size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No New Notifications</h3>
                            <p className="text-gray-500 mt-2">You're all caught up! Check back later for updates.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HodNotifications;
