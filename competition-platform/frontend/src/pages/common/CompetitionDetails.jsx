import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, ExternalLink, ArrowLeft, Globe, Clock, MessageSquare } from 'lucide-react';

const CompetitionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [competition, setCompetition] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/competitions/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setCompetition(data);
                }
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
    if (!competition) return <div className="p-8 text-center text-red-500">Competition not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
                <ArrowLeft size={20} className="mr-2" />
                Back to Dashboard
            </button>

            {/* Header Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6">
                <div className="flex justify-between items-start">
                    <div className="flex gap-6">
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-2xl font-bold">
                            {competition.platform?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{competition.title}</h1>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                    DETAILS VIEW
                                </span>
                                <span className="text-gray-500 text-sm flex items-center gap-1">
                                    <Globe size={14} />
                                    {competition.platform}
                                </span>
                            </div>
                        </div>
                    </div>

                    {competition.external_link && (
                        <a
                            href={competition.external_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <ExternalLink size={18} />
                            Open Website
                        </a>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Description & Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">About this Event</h2>
                        <div className="prose text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {competition.description || "No description provided."}
                        </div>
                    </div>

                    {/* Timeline (Mocked for now, as DB only has dates) */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Updates Timeline</h2>
                        <div className="border-l-2 border-gray-100 pl-6 space-y-8">
                            <div className="relative">
                                <span className="absolute -left-[29px] top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white ring-1 ring-blue-100"></span>
                                <h3 className="font-semibold text-gray-900">Registration Detected</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    System detected this competition from {competition.platform}.
                                </p>
                            </div>
                            {competition.registration_deadline && (
                                <div className="relative">
                                    <span className="absolute -left-[29px] top-1 w-3 h-3 bg-red-400 rounded-full border-2 border-white ring-1 ring-red-100"></span>
                                    <h3 className="font-semibold text-gray-900">Registration Deadline</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {new Date(competition.registration_deadline).toDateString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Key Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h2 className="font-bold text-gray-900 mb-4">Event Information</h2>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Clock size={16} /> Registration Ends
                                </span>
                                <span className="font-medium text-gray-900">
                                    {competition.registration_deadline
                                        ? new Date(competition.registration_deadline).toLocaleDateString()
                                        : "TBA"}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Calendar size={16} /> Event Date
                                </span>
                                <span className="font-medium text-gray-900">
                                    {competition.event_date
                                        ? new Date(competition.event_date).toLocaleDateString()
                                        : "TBA"}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Users size={16} /> Team Size
                                </span>
                                <span className="font-medium text-gray-900">
                                    {competition.min_team_size} - {competition.max_team_size} Members
                                </span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <MessageSquare size={16} /> Mode
                                </span>
                                <span className="font-medium text-gray-900">
                                    {competition.mode || "Online"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompetitionDetails;
