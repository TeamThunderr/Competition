import React from 'react';
import StudentSidebar from './Sidebar';
import { Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <StudentSidebar />

            <div className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Welcome back, Alex!</h1>
                    <p className="text-gray-500 mt-1">Here's what's happening with your competitions.</p>
                </div>

                {/* Upcoming Deadlines (Empty State) */}
                <section className="mb-10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
                        <button className="text-sm text-blue-600 hover:underline">View All</button>
                    </div>

                    <div className="bg-white p-8 rounded-xl border border-gray-100 text-center shadow-sm">
                        <Clock className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-gray-500">No upcoming deadlines.</p>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Your Competitions List (Empty State) */}
                    <div className="lg:col-span-2">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Competitions</h2>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[300px] flex flex-col items-center justify-center p-8">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                <span className="text-2xl">🏆</span>
                            </div>
                            <h3 className="text-gray-900 font-medium">No active competitions</h3>
                            <p className="text-gray-500 text-sm mt-1 mb-4">You haven't registered for any events yet.</p>
                            <button
                                onClick={() => navigate('/student/competitions')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                            >
                                Browse Competitions
                            </button>
                        </div>
                    </div>

                    {/* OD Status Card */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">On-Duty Status</h2>
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="text-center mb-8">
                                <div className="text-4xl font-bold text-gray-900 mb-1">0%</div>
                                <div className="text-sm text-gray-500">Attendance with OD</div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                                    <span className="text-sm text-gray-700">Pending Requests</span>
                                    <span className="text-sm font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded">0 Pending</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                    <span className="text-sm text-gray-700">Approved (This Sem)</span>
                                    <span className="text-sm font-bold text-green-700">0 Days</span>
                                </div>
                            </div>

                            <button className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition shadow-lg shadow-gray-200">
                                Request New OD
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
