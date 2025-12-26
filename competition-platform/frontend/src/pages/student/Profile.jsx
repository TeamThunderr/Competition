import React from 'react';
import StudentSidebar from './Sidebar';
import { User, Mail, Hash, BookOpen, Calendar, Award, Trophy, Star, Users, GraduationCap } from 'lucide-react';
import { getCurrentUser } from '../../services/authService';

const Profile = () => {
    const user = getCurrentUser();

    // Mock extended user data
    // Use real user data or generic placeholders
    const userData = {
        // Mock extended user data
        // Blanking all personal details as per privacy mode
        name: '',
        email: '',
        role: user?.role || '',
        regNo: '',
        dept: '',
        section: '',
        year: '',
        batch: '',
        cgpa: '',
        phone: '',
        stats: {
            competitions: 0,
            wins: 0,
            participation_points: 0
        },
        competitionsWon: [],
        competitionsQualified: []
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StudentSidebar />
            <div className="flex-1 ml-64 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                        <p className="text-gray-500 mt-1">View your personal information and academic details.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Profile Web Card */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white shadow-sm">
                                            {userData.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">{userData.name}</h2>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                                {userData.role}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                        Edit Details
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Registration Number</label>
                                        <div className="flex items-center text-gray-900 font-medium">
                                            <Hash size={16} className="text-gray-400 mr-2" />
                                            {userData.regNo}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Department</label>
                                        <div className="flex items-center text-gray-900 font-medium">
                                            <BookOpen size={16} className="text-gray-400 mr-2" />
                                            {userData.dept}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Section</label>
                                        <div className="flex items-center text-gray-900 font-medium">
                                            <Users size={16} className="text-gray-400 mr-2" />
                                            {userData.section}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Year / Batch</label>
                                        <div className="flex items-center text-gray-900 font-medium">
                                            <Calendar size={16} className="text-gray-400 mr-2" />
                                            {userData.year} ({userData.batch})
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Email Address</label>
                                        <div className="flex items-center text-gray-900 font-medium">
                                            <Mail size={16} className="text-gray-400 mr-2" />
                                            {userData.email}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">CGPA</label>
                                        <div className="flex items-center text-gray-900 font-medium">
                                            <GraduationCap size={16} className="text-gray-400 mr-2" />
                                            {userData.cgpa}
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Competitions Won & Qualified */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <Trophy size={18} className="text-yellow-500 mr-2" />
                                        Competitions Won
                                    </h3>
                                    {userData.competitionsWon.length > 0 ? (
                                        <ul className="space-y-3">
                                            {userData.competitionsWon.map((comp, index) => (
                                                <li key={index} className="text-gray-600 text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                                    {comp}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-gray-400 text-sm">No competitions won yet.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <Award size={18} className="text-blue-500 mr-2" />
                                        Competitions Qualified
                                    </h3>
                                    {userData.competitionsQualified.length > 0 ? (
                                        <ul className="space-y-3">
                                            {userData.competitionsQualified.map((comp, index) => (
                                                <li key={index} className="text-gray-600 text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                                    {comp}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-gray-400 text-sm">No competitions qualified yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Side Card */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Competition Stats</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-50 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                <Award size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium">Participated</p>
                                                <p className="text-xl font-bold text-gray-900">{userData.stats.competitions}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-yellow-50 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                                                <Trophy size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium">Wins</p>
                                                <p className="text-xl font-bold text-gray-900">{userData.stats.wins}</p>
                                            </div>
                                        </div>
                                    </div>


                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
