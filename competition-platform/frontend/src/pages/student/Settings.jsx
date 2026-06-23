import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import StudentSidebar from './Sidebar';
import { User, Bell, Lock, Save, Mail, Loader } from 'lucide-react';
import { getCurrentUser } from '../../services/authService';
import studentService from '../../services/studentService';

const Settings = () => {
    const user = getCurrentUser();
    const [searchParams, setSearchParams] = useSearchParams();

    // Mock user data if not found (for dev/testing)
    // Use real user data or generic placeholders
    const userData = user || {
        email: 'N/A',
        role: 'N/A',
        id: 'N/A'
    };

    const [notifications, setNotifications] = useState({
        email: true,
        odUpdates: true,
        newCompetitions: false
    });

    const [gmailConnected, setGmailConnected] = useState(false);
    const [gmailLoading, setGmailLoading] = useState(true);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const checkGmail = async () => {
            try {
                const res = await studentService.checkGmailStatus();
                setGmailConnected(res.data?.connected || false);
            } catch (err) {
                console.error("Failed to fetch gmail status");
            } finally {
                setGmailLoading(false);
            }
        };

        checkGmail();

        // Handle OAuth callback success
        if (searchParams.get('gmail') === 'connected') {
            setToast('Gmail connected successfully!');
            searchParams.delete('gmail');
            setSearchParams(searchParams);
            
            // Clear toast after 3s
            setTimeout(() => setToast(null), 3000);
        } else if (searchParams.get('gmail') === 'error') {
            setToast('Error connecting Gmail. Please try again.');
            searchParams.delete('gmail');
            setSearchParams(searchParams);
            setTimeout(() => setToast(null), 3000);
        }
    }, []);

    const handleConnectGmail = async () => {
        try {
            const res = await studentService.getGmailAuthUrl();
            if (res?.authUrl) {
                window.location.href = res.authUrl; // Redirect to Google Consent
            }
        } catch (error) {
            console.error("Failed to get auth url:", error);
            alert("Failed to connect to Google.");
        }
    };

    const handleDisconnectGmail = async () => {
        if (!window.confirm("Are you sure you want to disconnect your Gmail? Auto-detection of competitions will stop.")) return;
        
        try {
            setGmailLoading(true);
            await studentService.revokeGmailAccess();
            setGmailConnected(false);
            setToast('Gmail disconnected successfully.');
            setTimeout(() => setToast(null), 3000);
        } catch (error) {
            console.error("Failed to disconnect gmail:", error);
            alert("Failed to disconnect.");
        } finally {
            setGmailLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex transition-colors duration-200 relative">
            {toast && (
                <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
                    {toast}
                </div>
            )}
            <StudentSidebar />
            <div className="flex-1 md:ml-sidebar p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                        <p className="text-gray-500 mt-1">Manage your profile and application preferences.</p>
                    </div>

                    <div className="space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                <User size={20} className="text-blue-600" />
                                Profile Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                                    <div className="text-foreground font-medium p-3 bg-muted/5 rounded-lg border border-border">
                                        {userData.email}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                                    <div className="text-foreground font-medium p-3 bg-muted/5 rounded-lg border border-border">
                                        {userData.role}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">User ID</label>
                                    <div className="text-foreground font-medium p-3 bg-muted/5 rounded-lg border border-border">
                                        {userData.id}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gmail Connection Card */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                <Mail size={20} className="text-blue-600" />
                                Gmail Connection
                            </h2>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="mb-4 sm:mb-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-3 h-3 rounded-full ${gmailConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <h3 className="font-medium text-gray-900">
                                            {gmailConnected ? 'Gmail connected' : 'Gmail not connected'}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {gmailConnected 
                                            ? "Your Gmail is being scanned for competition emails."
                                            : "Connect to enable automatic competition detection from your Gmail inbox."}
                                    </p>
                                </div>
                                <div>
                                    {gmailLoading ? (
                                        <Loader className="w-5 h-5 animate-spin text-gray-400" />
                                    ) : gmailConnected ? (
                                        <button 
                                            onClick={handleDisconnectGmail}
                                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                                        >
                                            Disconnect Gmail
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleConnectGmail}
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                                        >
                                            Connect Gmail Account
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notifications Card */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                <Bell size={20} className="text-blue-600" />
                                Notification Preferences
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <h3 className="font-medium text-gray-900">Email Notifications</h3>
                                        <p className="text-xs text-gray-500">Receive updates via email.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={notifications.email}
                                            onChange={() => setNotifications({ ...notifications, email: !notifications.email })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <h3 className="font-medium text-gray-900">OD Approval Updates</h3>
                                        <p className="text-xs text-gray-500">Get notified when OD status changes.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={notifications.odUpdates}
                                            onChange={() => setNotifications({ ...notifications, odUpdates: !notifications.odUpdates })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <h3 className="font-medium text-gray-900">New Competitions</h3>
                                        <p className="text-xs text-gray-500">Alerts for new competitions.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={notifications.newCompetitions}
                                            onChange={() => setNotifications({ ...notifications, newCompetitions: !notifications.newCompetitions })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Password Card */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 opacity-60 relative">
                            {/* Overlay for "coming soon" effect since backend isn't ready */}
                            {/* <div className="absolute inset-0 bg-white/50 z-10 cursor-not-allowed"></div> */}

                            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                <Lock size={20} className="text-blue-600" />
                                Security
                            </h2>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                    <input type="password" disabled className="w-full px-4 py-2 border border-border rounded-lg bg-muted/5 text-muted cursor-not-allowed" placeholder="••••••••" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                        <input type="password" disabled className="w-full px-4 py-2 border border-border rounded-lg bg-muted/5 text-muted cursor-not-allowed" placeholder="••••••••" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                        <input type="password" disabled className="w-full px-4 py-2 border border-border rounded-lg bg-muted/5 text-muted cursor-not-allowed" placeholder="••••••••" />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <button disabled className="px-6 py-2 bg-gray-300 text-white rounded-lg font-medium cursor-not-allowed">
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
