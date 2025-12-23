import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Trophy, ExternalLink } from 'lucide-react';

const CompetitionCard = ({ competition, onCheckStatus, onUploadProof, onRequestOD, showRegister = true }) => {
    const { my_registration, my_status, my_od } = competition;

    const renderAction = () => {
        // If showRegister is false (Faculty/HOD), do not show any actionable buttons (actions are for students)
        if (!showRegister) {
            return (
                <Link
                    to={`/competitions/${competition.id}`}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center"
                >
                    View Details
                </Link>
            );
        }

        // 1. Not Registered
        if (!my_registration) {
            return (
                <button
                    onClick={() => onCheckStatus(competition.id)}
                    className="flex-1 bg-white border border-blue-600 text-blue-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                    I Registered Externally
                </button>
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
                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm">
                    WINNER
                </div>
            )}

            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                        {competition.platform || 'Unknown Platform'}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 mt-2">{competition.title || 'Untitled Competition'}</h3>
                </div>
                {/* Status Indicator Dot */}
                {my_registration && (
                    <div className={`w-3 h-3 rounded-full ${my_registration.verified ? 'bg-green-500' : 'bg-yellow-400'}`} title={my_registration.verified ? "Verified" : "Pending"} />
                )}
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
                {renderAction()}

                {competition.external_link && showRegister && (
                    <a
                        href={competition.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 flex items-center justify-center"
                        title="Visit External Site"
                    >
                        <ExternalLink className="w-5 h-5" />
                    </a>
                )}
            </div>
        </div>
    );
};

export default CompetitionCard;
