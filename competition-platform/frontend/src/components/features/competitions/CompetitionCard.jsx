import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Trophy, ExternalLink } from 'lucide-react';

const CompetitionCard = (props) => {
    const { competition, onRegister, onRequestOD, onWonStatusUpdate, showRegister = true, isApplied = false, onToggleApplied } = props;
    const { my_registration, my_status, my_od } = competition;

    const deadlineDate = new Date(competition.registration_deadline);
    deadlineDate.setHours(23, 59, 59, 999);
    const isClosed = deadlineDate < new Date();

    const getDaysLeft = (deadline) => {
        const diffTime = deadline - new Date();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const daysLeft = getDaysLeft(deadlineDate);

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

        // 1. Not Registered - Restrict to REGISTERED proof
        if (!my_registration) {
            return (
                <div className="flex gap-2 flex-1 items-center">
                    <button
                        onClick={() => onRegister(competition.id, 'REGISTERED')}
                        className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                        Upload Proof
                    </button>
                </div>
            );
        }

        // 2. Pending Verification (Manual Upload) - OR if just 'Registered' but not verified (Manual flow)
        if (!my_registration.verified) {
            return (
                <div className="flex-1 bg-yellow-50 border border-yellow-200 text-yellow-700 py-2 px-4 rounded-lg text-sm font-medium text-center">
                    Verification Pending
                </div>
            );
        }

        // 3. Verified / Registered
        if (my_registration.verified) {
            // Check for OD Status first
            const odBadge = my_od ? (
                <div className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium text-center ${my_od.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    my_od.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-purple-50 text-purple-700'
                    }`}>
                    OD: {my_od.status}
                </div>
            ) : null;

            // Allow OD Request ONLY for Shortlisted (or Winner)
            if (my_status?.is_shortlisted || my_status?.is_winner) {
                const isShortlistVerified = my_registration.qualification_verified === true &&
                    my_registration.shortlist_proof_url !== null;

                if (isShortlistVerified) {
                    // Check Winning Status
                    if (my_registration.won_status === 'WON') {
                        if (my_registration.winning_verified) {
                            return (
                                <div className="flex-1 bg-amber-100 text-amber-800 py-2 px-4 rounded-lg text-sm font-bold text-center border border-amber-200">
                                    🏆 WINNER
                                </div>
                            );
                        } else {
                            return (
                                <div className="flex-1 bg-yellow-50 border border-yellow-200 text-yellow-700 py-2 px-4 rounded-lg text-sm font-medium text-center">
                                    Winning Verification Pending
                                </div>
                            );
                        }
                    }

                    if (my_registration.won_status === 'NOT_WON') {
                        return (
                            <div className="flex flex-col gap-2 flex-1">
                                {odBadge}
                                <div className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium text-center border border-gray-200">
                                    Participant
                                </div>
                            </div>
                        );
                    }

                    // Default: Show OD and Update Result
                    return (
                        <div className="flex flex-col gap-2 flex-1">
                            <div className="flex gap-2">
                                {odBadge ? odBadge : (
                                    <button
                                        onClick={() => onRequestOD(competition.id)}
                                        className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm">
                                        Request OD
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    const handler = onWonStatusUpdate || competition.onWonStatusUpdate;
                                    handler?.(competition.id);
                                }}
                                className="flex-1 bg-amber-500 text-white py-2 px-4 rounded-lg text-sm font-bold hover:bg-amber-600 transition-colors shadow-sm">
                                Update Result
                            </button>
                        </div>
                    );
                }

                // If status is 'Qualified' (meaning they uploaded it) but verified is false (or not manual yet):
                if (my_registration.status === 'Qualified' && !my_registration.qualification_verified) {
                    return (
                        <div className="flex-1 bg-yellow-50 border border-yellow-200 text-yellow-700 py-2 px-4 rounded-lg text-sm font-medium text-center">
                            Verification Pending
                        </div>
                    );
                }

                // If here, they are Shortlisted but haven't uploaded Valid Qualified proof yet
                // OR they are just Registered and want to upload Shortlist proof (Progression)
                return (
                    <div className="flex gap-2 flex-1">
                        <div className="flex-1 bg-green-50 text-green-700 py-2 px-2 rounded-lg text-sm font-medium text-center border border-green-200 flex items-center justify-center">
                            {my_status?.is_shortlisted ? 'Qualified' : 'Registered'}
                        </div>
                        <button
                            onClick={() => onRegister(competition.id, 'QUALIFIED')}
                            className="flex-1 bg-purple-600 text-white py-2 px-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm text-center">
                            Upload Proof
                        </button>
                    </div>
                );
            }

            // If not shortlisted, show Registered status BUT allow uploading shortlist proof
            return (
                <div className="flex gap-2 flex-1">
                    <div className="flex-1 bg-green-50 text-green-700 py-2 px-2 rounded-lg text-sm font-medium text-center border border-green-200 flex items-center justify-center">
                        Registered
                    </div>
                    <button
                        onClick={() => onRegister(competition.id, 'QUALIFIED')}
                        className="flex-1 bg-purple-600 text-white py-2 px-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm text-center">
                        Upload Proof
                    </button>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow p-6 relative overflow-hidden flex flex-col h-full">
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
                <>
                    {/* Days Left Badge (Top Left) */}
                    {showRegister && daysLeft > 0 && (
                        <div className={`absolute top-0 left-0 text-xs font-bold px-3 py-1 rounded-br-lg shadow-sm border-r border-b z-10 ${daysLeft <= 3 ? 'bg-red-100 text-red-600 border-red-200' : 'bg-blue-100 text-blue-600 border-blue-200'}`}>
                            {daysLeft} days left
                        </div>
                    )}

                    {/* Open Status Badge (Top Right) */}
                    <div className="absolute top-0 right-0 bg-green-100 text-green-600 text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm border-l border-b border-green-200 z-10">
                        OPEN
                    </div>
                </>
            )}

            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                        {competition.platform || 'Unknown Platform'}
                    </span>

                    <h3 className="text-lg font-semibold text-foreground mt-2">{competition.title || 'Untitled Competition'}</h3>
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

            <p className="text-muted text-sm mb-6 line-clamp-2">
                {competition.description}
            </p>

            <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-muted">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Event Date: {competition.event_date ? new Date(competition.event_date).toLocaleDateString() : 'TBA'}</span>
                </div>
                <div className="flex items-center text-sm text-muted">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Deadline: {new Date(competition.registration_deadline || competition.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-sm text-muted">
                    <Users className="w-4 h-4 mr-2" />
                    <span>Team: {competition.min_team_size}-{competition.max_team_size}</span>
                </div>
                {competition.venue && (
                    <div className="flex items-center text-sm text-muted">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Venue: {competition.venue}</span>
                    </div>
                )}
            </div>

            <div className="mt-auto flex gap-3 flex-col sm:flex-row">
                <Link
                    to={`/competitions/${competition.id}`}
                    className="flex-1 bg-muted/10 text-foreground py-2 px-4 rounded-lg text-sm font-medium hover:bg-muted/20 transition-colors text-center flex items-center justify-center"
                >
                    View Info
                </Link>

                {/* Show Registration Count for Faculty/HOD */}
                {/* Show Registration Count for Faculty/HOD */}
                {!showRegister && (
                    <div className="flex gap-2">
                        <div className="flex items-center text-sm text-muted bg-muted/10 px-3 py-2 rounded-lg border border-border" title="Total Registrations">
                            <Users className="w-4 h-4 mr-2" />
                            <span className="font-medium">
                                {competition.registrations && competition.registrations[0]
                                    ? competition.registrations[0].count
                                    : 0}
                            </span>
                        </div>
                        {!isClosed && (
                            <div className={`flex items-center text-sm px-3 py-2 rounded-lg border ${daysLeft <= 3 ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30' : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900/50'}`} title="Days Left">
                                <span className="font-medium">
                                    {daysLeft} days left
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {renderAction()}
            </div>

            {/* Mark as Applied Toggle - Moved for better alignment */}
            {showRegister && !my_registration && onToggleApplied && (
                <div className="mt-3 flex items-center justify-end gap-3 border-t pt-3 border-border/50">
                    <span className={`text-xs font-medium ${isApplied ? 'text-green-600' : 'text-gray-500'}`}>
                        {isApplied ? 'Temporarily Registered' : 'Temporary Mark Register'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={!!isApplied}
                            onChange={() => onToggleApplied(competition.id)}
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                </div>
            )}
        </div>
    );
};

export default CompetitionCard;
