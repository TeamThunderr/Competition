import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ArrowLeft, Award, CheckCircle, Trophy, User, Clock, AlertCircle, Phone } from 'lucide-react';
import { getStudentById } from '../../services/adminService';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

const StudentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Using Admin service to get details (which now returns rich data matching Faculty view)
                const data = await getStudentById(id);
                setStudent(data);
            } catch (err) {
                console.error("Failed to fetch student details", err);
                const msg = err.response?.data?.message || err.message || "Failed to load student details.";
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDetails();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <RoleBasedLoader role="ADMIN" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex bg-gray-50 min-h-screen">
                <Sidebar />
                <main className="flex-1 ml-64 p-8">
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} /> Back to Search
                    </button>
                </main>
            </div>
        );
    }

    if (!student) return null;

    const { profile, stats, competitions } = student;

    // Determine Activity Status
    const isActive = stats.registered > 0;

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans text-gray-900">
            <Sidebar />

            <main className="flex-1 md:ml-64 p-4 md:p-8 pt-16 md:pt-8">
                <div className="w-[95%] mx-auto">
                    {/* Header with Back Button */}
                    <div className="mb-8 text-center relative">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                        >
                            <ArrowLeft size={18} /> Back to Search
                        </button>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                            {isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-500 mt-3 text-sm">
                                        <span className="flex items-center gap-1.5"><User size={16} className="text-gray-400" /> {profile.rollNo}</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span>{profile.department} - Section {profile.section}</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span>{profile.email}</span>
                                        {profile.phoneNumber && profile.phoneNumber !== 'N/A' && (
                                            <>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <a href={`tel:${profile.phoneNumber}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                                                    <Phone size={14} />
                                                    {profile.phoneNumber}
                                                </a>
                                            </>
                                        )}
                                        {profile.batch && (
                                            <>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100 font-medium">
                                                    Batch {profile.batch}
                                                </span>
                                            </>
                                        )}
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span className="flex items-center gap-1.5 font-medium text-gray-700">
                                            <Award size={16} className="text-amber-500" />
                                            CGPA: {profile.cgpa}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-blue-600 mt-4 text-sm font-medium bg-blue-50/50 px-3 py-2 rounded-lg border border-blue-100 w-fit">
                                        <User size={14} />
                                        <span>Class Advisor: {profile.classAdvisor || 'Not Assigned'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2 text-blue-600">
                                <Clock size={20} />
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Registered</h3>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stats.registered}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2 text-purple-600">
                                <CheckCircle size={20} />
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Qualified</h3>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stats.qualified}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2 text-amber-500">
                                <Trophy size={20} />
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Won</h3>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stats.won}</p>
                        </div>
                    </div>

                    {/* Competition History */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">Competition History</h2>
                        </div>

                        {competitions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50/50">
                                        <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            <th className="px-6 py-4">Competition</th>
                                            <th className="px-6 py-4">Platform</th>
                                            <th className="px-6 py-4">Registered At</th>
                                            <th className="px-6 py-4">Verification</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {competitions.map((comp, index) => (
                                            <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-gray-900 block">{comp.competitionName}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{comp.platform}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(comp.registeredAt).toLocaleDateString()}</td>
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
                            <div className="p-12 text-center text-gray-500">
                                <Award size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-lg font-medium text-gray-900">No competitions found</p>
                                <p className="text-gray-400">This student hasn't participated in any competitions yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentDetails;
