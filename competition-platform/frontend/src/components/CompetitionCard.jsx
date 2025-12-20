import React from 'react';
import { Calendar, Users, Trophy, ExternalLink } from 'lucide-react';

const CompetitionCard = ({ competition, showRegister = false }) => {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                        {competition.platform}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 mt-2">{competition.title}</h3>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                    <Trophy className="w-5 h-5" />
                </div>
            </div>

            <p className="text-gray-500 text-sm mb-6 line-clamp-2">
                {competition.description}
            </p>

            <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Deadline: {new Date(competition.deadline || competition.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-2" />
                    <span>Team Size: {competition.min_team_size} - {competition.max_team_size} Members</span>
                </div>
            </div>

            <div className="flex gap-3">
                {showRegister ? (
                    <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Register
                    </button>
                ) : (
                    <div className="flex-1 bg-gray-100 text-gray-500 py-2 px-4 rounded-lg text-sm font-medium text-center cursor-not-allowed">
                        View Only
                    </div>
                )}

                {competition.link && (
                    <a
                        href={competition.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                    >
                        <ExternalLink className="w-5 h-5" />
                    </a>
                )}
            </div>
        </div>
    );
};

export default CompetitionCard;
