import React, { useEffect, useState } from 'react';
import StudentSidebar from './Sidebar';
import { User, Mail, Hash, BookOpen, Calendar, Award, Trophy, Star, Users, GraduationCap, Edit, Check, X, Phone } from 'lucide-react';
import { getCurrentUser } from '../../services/authService';
import { api } from '../../services/api';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [newPhone, setNewPhone] = useState('');

    const fetchProfile = async () => {
        try {
            const response = await api.get('/api/student/profile');
            console.log("Profile Fetch Response:", response); // Debug log
            if (response.data) {
                setUserData(response.data);
                setNewPhone(response.data.phone || '');
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchProfile();
    }, []);

    const handleUpdatePhone = async () => {
        try {
            await api.put('/api/student/profile', { phone_number: newPhone });
            setUserData({ ...userData, phone: newPhone });
            setIsEditingPhone(false);
            alert("Phone number updated successfully!");
        } catch (err) {
            console.error('Update failed:', err);
            alert("Failed to update phone number.");
        }
    };

    if (loading) {
        return (
            <div className="flex bg-background min-h-screen items-center justify-center transition-colors duration-200">
                <RoleBasedLoader role="STUDENT" />
            </div>
        );
    }

    if (!userData) return <div className="text-center p-8">Failed to load profile.</div>;

    return (
        <div className="min-h-screen bg-background flex transition-colors duration-200">
            <StudentSidebar />
            <div className="flex-1 md:ml-sidebar p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
                        <p className="text-muted mt-1">View your personal information and academic details.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Profile Web Card */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-card rounded-xl border border-border shadow-sm p-6 transition-colors duration-200">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white dark:border-card shadow-sm">
                                            {userData.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-foreground">{userData.name || 'Unknown User'}</h2>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mt-1">
                                                {userData.role}
                                            </span>
                                        </div>
                                    </div>
                                    {/* <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                        Edit Details
                                    </button> */}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border">
                                    <div>
                                        <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1">Registration Number</label>
                                        <div className="flex items-center text-foreground font-medium">
                                            <Hash size={16} className="text-muted mr-2" />
                                            {userData.regNo}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1">Department</label>
                                        <div className="flex items-center text-foreground font-medium">
                                            <BookOpen size={16} className="text-muted mr-2" />
                                            {userData.dept}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1">Section</label>
                                        <div className="flex items-center text-foreground font-medium">
                                            <Users size={16} className="text-muted mr-2" />
                                            {userData.section}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1">Batch</label>
                                        <div className="flex items-center text-foreground font-medium">
                                            <Calendar size={16} className="text-muted mr-2" />
                                            {userData.batch}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1">Email Address</label>
                                        <div className="flex items-center text-foreground font-medium">
                                            <Mail size={16} className="text-muted mr-2" />
                                            {userData.email}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1">CGPA</label>
                                        <div className="flex items-center text-foreground font-medium">
                                            <GraduationCap size={16} className="text-muted mr-2" />
                                            {userData.cgpa}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1">Phone Number</label>
                                        <div className="flex items-center text-foreground font-medium group">
                                            <Phone size={16} className="text-muted mr-2" />
                                            {isEditingPhone ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={newPhone}
                                                        onChange={(e) => setNewPhone(e.target.value)}
                                                        className="border border-input rounded px-2 py-1 text-sm w-32 focus:outline-none focus:border-blue-500 bg-background text-foreground"
                                                    />
                                                    <button onClick={handleUpdatePhone} className="text-green-600 hover:text-green-700 dark:text-green-400"><Check size={16} /></button>
                                                    <button onClick={() => setIsEditingPhone(false)} className="text-red-600 hover:text-red-700 dark:text-red-400"><X size={16} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span>{userData.phone || 'Not Set'}</span>
                                                    <button onClick={() => setIsEditingPhone(true)} className="opacity-0 group-hover:opacity-100 text-muted hover:text-blue-600 dark:hover:text-blue-400 transition-opacity">
                                                        <Edit size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Competitions Won & Qualified */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-card rounded-xl border border-border shadow-sm p-6 transition-colors duration-200">
                                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                                        <Trophy size={18} className="text-yellow-500 mr-2" />
                                        Competitions Won
                                    </h3>
                                    {userData.competitionsWon && userData.competitionsWon.length > 0 ? (
                                        <ul className="space-y-3">
                                            {userData.competitionsWon.map((comp, index) => (
                                                <li key={index} className="text-muted text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                                                    {comp}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-muted text-sm">No competitions won yet.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-card rounded-xl border border-border shadow-sm p-6 transition-colors duration-200">
                                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                                        <Award size={18} className="text-blue-500 mr-2" />
                                        Competitions Qualified
                                    </h3>
                                    {userData.competitionsQualified && userData.competitionsQualified.length > 0 ? (
                                        <ul className="space-y-3">
                                            {userData.competitionsQualified.map((comp, index) => (
                                                <li key={index} className="text-muted text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                                                    {comp}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-muted text-sm">No competitions qualified yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Side Card */}
                        <div className="space-y-6">
                            <div className="bg-card rounded-xl border border-border shadow-sm p-6 transition-colors duration-200">
                                <h3 className="text-lg font-semibold text-foreground mb-4">Competition Stats</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg">
                                                <Award size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted font-medium">Participated</p>
                                                <p className="text-xl font-bold text-foreground">{userData.stats?.competitions || 0}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300 rounded-lg">
                                                <Trophy size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted font-medium">Wins</p>
                                                <p className="text-xl font-bold text-foreground">{userData.stats?.wins || 0}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-lg">
                                                <Star size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted font-medium">Points</p>
                                                <p className="text-xl font-bold text-foreground">{userData.stats?.participation_points || 0}</p>
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
