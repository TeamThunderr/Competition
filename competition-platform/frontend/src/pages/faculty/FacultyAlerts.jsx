import React from 'react';
import Sidebar from './Sidebar';
import { AlertCircle, Clock, Info, CheckCircle2, X } from 'lucide-react';

const FacultyAlerts = () => {

    // Alert Types: 'danger', 'warning', 'info', 'success'
    const alerts = [
        {
            id: 1,
            type: 'danger',
            title: 'Low Attendance',
            message: 'Student (ID) has attendance < 75%.',
            time: '2 hours ago',
            icon: AlertCircle
        },
        {
            id: 2,
            type: 'warning',
            title: 'Deadline Approaching',
            message: 'Competition registration closes in 24 hours. X students pending.',
            time: '5 hours ago',
            icon: Clock
        },
        {
            id: 3,
            type: 'info',
            title: 'New Competition Added',
            message: 'New challenge added to repository.',
            time: 'Yesterday',
            icon: Info
        },
        {
            id: 4,
            type: 'success',
            title: 'Qualification Update',
            message: 'Teams from Section A qualified for next round.',
            time: 'Yesterday',
            icon: CheckCircle2
        }
    ];

    const getAlertStyles = (type) => {
        switch (type) {
            case 'danger':
                return {
                    bg: 'bg-white',
                    border: 'border-l-4 border-red-500',
                    iconBg: 'bg-red-50',
                    iconColor: 'text-red-500',
                    titleColor: 'text-gray-900'
                };
            case 'warning':
                return {
                    bg: 'bg-white',
                    border: 'border-l-4 border-yellow-500',
                    iconBg: 'bg-yellow-50',
                    iconColor: 'text-yellow-600',
                    titleColor: 'text-gray-900'
                };
            case 'success':
                return {
                    bg: 'bg-white',
                    border: 'border-l-4 border-green-500',
                    iconBg: 'bg-green-50',
                    iconColor: 'text-green-600',
                    titleColor: 'text-gray-900'
                };
            case 'info':
            default:
                return {
                    bg: 'bg-white',
                    border: 'border-l-4 border-blue-500',
                    iconBg: 'bg-blue-50',
                    iconColor: 'text-blue-600',
                    titleColor: 'text-gray-900'
                };
        }
    };

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans text-gray-900">
            <Sidebar />

            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">System Alerts</h1>
                    <p className="text-gray-500 mt-2">Important updates regarding your students and competitions.</p>
                </div>

                {/* Alerts List */}
                <div className="max-w-4xl space-y-4">
                    {alerts.map((alert) => {
                        const styles = getAlertStyles(alert.type);
                        return (
                            <div
                                key={alert.id}
                                className={`${styles.bg} ${styles.border} p-6 rounded-r-xl shadow-sm hover:shadow-md transition-shadow relative group`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-lg ${styles.iconBg} ${styles.iconColor} shrink-0`}>
                                        <alert.icon size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold ${styles.titleColor} text-lg mb-1`}>{alert.title}</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">{alert.message}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span className="text-xs text-gray-400 font-medium">{alert.time}</span>
                                        <button className="text-gray-300 hover:text-gray-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default FacultyAlerts;
