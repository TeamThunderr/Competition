import React, { useState } from 'react';
import StudentSidebar from './Sidebar';
import { Users, UserPlus, Search } from 'lucide-react';

const MyTeams = () => {
    const [activeTab, setActiveTab] = useState('create');
    const [teamName, setTeamName] = useState('');
    const [memberEmail, setMemberEmail] = useState('');

    // Empty teams list for "Join Existing Team" to avoid fake details
    const availableTeams = [];

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <StudentSidebar />

            <div className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="mb-8 text-center pt-4">
                    <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-10">
                    <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all shadow-sm ${activeTab === 'create'
                                ? 'bg-white text-gray-900'
                                : 'text-gray-500 hover:text-gray-700 bg-transparent shadow-none'
                                }`}
                        >
                            Create New Team
                        </button>
                        <button
                            onClick={() => setActiveTab('join')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all shadow-sm ${activeTab === 'join'
                                ? 'bg-white text-gray-900'
                                : 'text-gray-500 hover:text-gray-700 bg-transparent shadow-none'
                                }`}
                        >
                            Join Existing Team
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-3xl mx-auto">
                    {activeTab === 'create' ? (
                        <div className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm text-left">
                            <h2 className="text-lg font-bold text-gray-900 mb-8">Team Details</h2>

                            <div className="mb-8">
                                <label className="text-lg font-bold text-gray-900 mb-6">Team Name</label>
                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    placeholder="Enter your cool team name"
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <h2 className="text-lg font-bold text-gray-900 mb-6">Add Members</h2>
                            <div className="flex gap-3 mb-10">
                                <input
                                    type="email"
                                    value={memberEmail}
                                    onChange={(e) => setMemberEmail(e.target.value)}
                                    placeholder="Teammate's Email (college ID)"
                                    className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                <button className="px-6 py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition">
                                    Add
                                </button>
                            </div>

                            <div>
                                <button className="w-full py-3 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed hover:bg-gray-300 transition-colors">
                                    Create Team
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm min-h-[400px]">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Available Teams to Join</h2>

                            {availableTeams.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Team cards would go here */}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <Users className="text-gray-300" size={32} />
                                    </div>
                                    <h3 className="text-gray-900 font-medium">No teams found</h3>
                                    <p className="text-gray-500 text-sm mt-1">There are no open teams to join right now.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyTeams;
