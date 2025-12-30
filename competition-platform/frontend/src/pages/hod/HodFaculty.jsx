import React, { useState, useEffect } from 'react';
import HodSidebar from './Sidebar';
import { Search, Mail, Phone, Users, BookOpen } from 'lucide-react';
import { getDepartmentFaculty } from '../../services/usersService';

const HodFaculty = () => {
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchFaculty = async () => {
            try {
                const data = await getDepartmentFaculty();
                setFaculty(data || []);
            } catch (error) {
                console.error("Failed to load faculty", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFaculty();
    }, []);

    const filteredFaculty = faculty.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <HodSidebar />

            <div className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Faculty Directory</h1>
                        <p className="text-gray-500 mt-1">Manage and view department faculty details</p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search faculty..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFaculty.map((member) => (
                            <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
                                            {member.avatar ? (
                                                <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                member.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                                            <p className="text-sm text-gray-500">{member.designation}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Mail size={16} className="mr-3 text-gray-400" />
                                        <span>{member.email}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Phone size={16} className="mr-3 text-gray-400" />
                                        <span>{member.phone}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Sections</p>
                                        <div className="flex flex-wrap gap-1">
                                            {member.sections.length > 0 ? (
                                                member.sections.map((sec, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">
                                                        {sec}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">None</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Students</p>
                                        <p className="text-lg font-bold text-gray-900">{member.stats.studentsCount}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredFaculty.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No faculty members found matching your search.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HodFaculty;
