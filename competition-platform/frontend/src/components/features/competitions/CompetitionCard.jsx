import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Trophy, ExternalLink } from 'lucide-react';

const CompetitionCard = ({ competition, onRegister, onRequestOD, onVerifyGmail, showRegister = true }) => {
    const { my_registration, my_status, my_od } = competition;
    const isClosed = new Date(competition.registration_deadline) < new Date();
    const [isVerifying, setIsVerifying] = React.useState(false);

    const handleVerifyClick = async () => {
        setIsVerifying(true);
        try {
            await onVerifyGmail(competition.id);
        } catch (error) {
            console.error(error);
        } finally {
            setIsVerifying(false); // Restore state after (or let parent unmount/update logic handle it)
        }
    };

    const getDaysLeft = (deadline) => {
        const diffTime = new Date(deadline) - new Date();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const daysLeft = getDaysLeft(competition.registration_deadline);

    const renderAction = () => {
        // If showRegister is false (Faculty/HOD), do not show any actionable buttons (actions are for students)
        if (!showRegister) {
            return null;
        }

        // 0. Closed & Not Registered -> Show "Closed" button state
        if (isClosed && !my_registration) {
            return (
                <div className="flex-1 bg-gray-100 text-gray-500 py-2 px-4 rounded-lg text-sm font-medium text-center border border-gray-200 cursor-not-allowed">
                    Registration Closed
                </div>
            );
        }

        // 1. Not Registered
        if (!my_registration) {
            return (
                <div className="flex gap-2 flex-1">
                    <button
                        onClick={() => onRegister(competition.id)}
                        disabled={isVerifying}
                        className="flex-1 bg-white border border-blue-600 text-blue-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50">
                        Mark Register
                    </button>
                    <button
                        onClick={handleVerifyClick}
                        disabled={isVerifying}
                        className={`flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium shadow-sm transition-all ${isVerifying ? 'opacity-70 cursor-wait' : 'hover:from-red-600 hover:to-red-700'}`}
                        title="Check Gmail for confirmation email"
                    >
                        {isVerifying ? 'Checking...' : 'Verify via Gmail'}
                    </button>
                </div>
            );
        }

        // 2. Pending Verification (Manual Upload)
        if (my_registration.source === 'MANUAL_SCREENSHOT' && !my_registration.verified) {
            return (
                <div className="flex-1 bg-yellow-50 border border-yellow-200 text-yellow-700 py-2 px-4 rounded-lg text-sm font-medium text-center">
                    Verification Pending
                </div>
            );
        }

        // 3. Pending Gmail (should technically be instant, but just in case)
        if (my_registration.source === 'AUTO_GMAIL' && !my_registration.verified) {
            return (
                <div className="flex-1 bg-blue-50 text-blue-700 py-2 px-4 rounded-lg text-sm font-medium text-center">
                    Gmail Detected (Verifying...)
                </div>
            );
        }

        // 4. Verified / Registered
        if (my_registration.verified) {
            // Check for OD Status first
            if (my_od) {
                return (
                    <div className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium text-center ${my_od.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        my_od.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-purple-50 text-purple-700'
                        }`}>
                        OD: {my_od.status}
                    </div>
                );
            }

            // Check if Shortlisted -> Can Request OD
            if (my_status?.is_shortlisted) {
                return (
                    <button
                        onClick={() => onRequestOD(competition.id)}
                        className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors animate-pulse">
                        Shortlisted! Request OD
                    </button>
                );
            }

            return (
                <div className="flex-1 bg-green-50 text-green-700 py-2 px-4 rounded-lg text-sm font-medium text-center flex items-center justify-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Registered & Verified
                </div>
            );
        }

        return null;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 relative overflow-hidden">
            {my_status?.is_winner && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm z-10">
                    WINNER
                </div>
            )}

            {!my_status?.is_winner && isClosed && (
                <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm border-l border-b border-red-200 z-10">
                    CLOSED
                </div>
            )}

            {!my_status?.is_winner && !isClosed && (
                <div className="absolute top-0 right-0 bg-green-100 text-green-600 text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm border-l border-b border-green-200 z-10">
                    OPEN
                </div>
            )}

            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                        {competition.platform || 'Unknown Platform'}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 mt-2">{competition.title || 'Untitled Competition'}</h3>
                </div>

                <div className="flex items-center gap-3">
                    {/* External Link Logic */}
                    {competition.external_link && showRegister && (
                        <a
                            href={competition.external_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                            title="Visit External Site"
                        >
                            <ExternalLink className="w-5 h-5" />
                        </a>
                    )}

                    {/* Status Indicator Dot */}
                    {my_registration && (
                        <div className={`w-3 h-3 rounded-full ${my_registration.verified ? 'bg-green-500' : 'bg-yellow-400'}`} title={my_registration.verified ? "Verified" : "Pending"} />
                    )}
                </div>
            </div>

            <p className="text-gray-500 text-sm mb-6 line-clamp-2">
                {competition.description}
            </p>

            <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Deadline: {new Date(competition.registration_deadline || competition.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-2" />
                    <span>Team: {competition.min_team_size}-{competition.max_team_size}</span>
                </div>
            </div>

            <div className="flex gap-3 flex-col sm:flex-row">
                <Link
                    to={`/competitions/${competition.id}`}
                    className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center"
                >
                    View Info
                </Link>

                {/* Show Registration Count for Faculty/HOD */}
                {/* Show Registration Count for Faculty/HOD */}
                {!showRegister && (
                    <div className="flex gap-2">
                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100" title="Total Registrations">
                            <Users className="w-4 h-4 mr-2" />
                            <span className="font-medium">
                                {competition.registrations && competition.registrations[0]
                                    ? competition.registrations[0].count
                                    : 0}
                            </span>
                        </div>
                        {!isClosed && (
                            <div className={`flex items-center text-sm px-3 py-2 rounded-lg border ${daysLeft <= 3 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`} title="Days Left">
                                <span className="font-medium">
                                    {daysLeft} days left
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {renderAction()}
            </div>
        </div>
    );
};

export default CompetitionCard;
