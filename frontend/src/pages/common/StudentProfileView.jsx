import React from 'react';
import { Award, CheckCircle, Trophy, User, Clock, Phone, AlertCircle } from 'lucide-react';

const StudentProfileView = ({ student }) => {
    if (!student) return null;

    const { profile, stats, competitions } = student;
    const isActive = stats.registered > 0;

    return (
        <div className="font-sans text-gray-900 dark:text-gray-100">
            {/* Profile Header Card */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm mb-8 transition-colors duration-200">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                {isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-500 dark:text-gray-400 mt-3 text-sm">
                            <span className="flex items-center gap-1.5"><User size={16} className="text-gray-400" /> {profile.rollNo}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>{profile.department} - Section {profile.section}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>{profile.email}</span>
                            {profile.phoneNumber && profile.phoneNumber !== 'N/A' && (
                                <>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <a href={`tel:${profile.phoneNumber}`} className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        <Phone size={14} />
                                        {profile.phoneNumber}
                                    </a>
                                </>
                            )}
                            {profile.batch && (
                                <>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100 font-medium dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                        Batch {profile.batch}
                                    </span>
                                </>
                            )}
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                                <Award size={16} className="text-amber-500" />
                                CGPA: {profile.cgpa}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300 mt-4 text-sm font-medium bg-blue-50/50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-100 dark:border-blue-800 w-fit">
                            <User size={14} />
                            <span>Class Advisor: {profile.classAdvisor || 'Not Assigned'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors duration-200">
                    <div className="flex items-center gap-3 mb-2 text-blue-600 dark:text-blue-400">
                        <Clock size={20} />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Registered</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.registered}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors duration-200">
                    <div className="flex items-center gap-3 mb-2 text-purple-600 dark:text-purple-400">
                        <CheckCircle size={20} />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Qualified</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.qualified}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors duration-200">
                    <div className="flex items-center gap-3 mb-2 text-amber-500">
                        <Trophy size={20} />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Won</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.won || 0}</p>
                </div>

            </div>

            {/* Competition History */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors duration-200">
                <div className="p-6 border-b border-gray-50 dark:border-zinc-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Competition History</h2>
                </div>

                {competitions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 dark:bg-zinc-800/50">
                                <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="px-6 py-4">Competition</th>
                                    <th className="px-6 py-4">Platform</th>
                                    <th className="px-6 py-4">Registered At</th>
                                    <th className="px-6 py-4">Verification</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                                {competitions.map((comp, index) => (
                                    <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-gray-900 dark:text-gray-100 block">{comp.competitionName}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{comp.platform}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(comp.registeredAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center gap-1 text-sm font-medium ${comp.verificationStatus === 'Verified' ? 'text-green-600' : 'text-amber-600'}`}>
                                                {comp.verificationStatus === 'Verified' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                                {comp.verificationStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${comp.status === 'Won' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                comp.status === 'Qualified' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    'bg-gray-50 text-gray-600 border-gray-200'
                                                }`}>
                                                {comp.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        <Award size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-900 dark:text-gray-200">No competitions found</p>
                        <p className="text-gray-400 dark:text-gray-500">This student hasn't participated in any competitions yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentProfileView;
