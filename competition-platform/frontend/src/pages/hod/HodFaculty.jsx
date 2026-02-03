import React, { useState, useEffect } from 'react';
import HodLayout from './HodLayout';
import { Search, Mail, Phone, MoreVertical } from 'lucide-react';
import { getDepartmentFaculty } from '../../services/hodService';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';

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
        <HodLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Faculty Directory</h1>
                    <p className="text-muted mt-1">Manage and view all department faculty members</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search faculty..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-background text-foreground"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <RoleBasedLoader role="HOD" />
                </div>
            ) : (
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Faculty Details</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredFaculty.map((member) => (
                                    <tr key={member.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3 dark:bg-blue-900/30 dark:text-blue-300">
                                                    {member.avatar ? (
                                                        <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        member.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-foreground">{member.name}</div>
                                                    <div className="text-xs text-muted">{member.designation}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm text-muted">
                                                    <Mail size={14} className="mr-2 text-muted/70" />
                                                    {member.email}
                                                </div>
                                                <div className="flex items-center text-sm text-muted">
                                                    <Phone size={14} className="mr-2 text-muted/70" />
                                                    {member.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900">
                                                    {member.stats?.studentsCount || 0} Students
                                                </span>
                                                <div className="text-xs text-gray-500 flex gap-2 mt-0.5">
                                                    {member.stats?.yearBreakdown && Object.entries(member.stats.yearBreakdown).map(([year, count]) => (
                                                        <span key={year} title={`${year} Students`}>{count} in {year.replace(' Year', '')}Yr</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center text-xs text-gray-600">
                                                    <Mail size={12} className="mr-2 text-gray-400" />
                                                    <span className="truncate max-w-[150px]" title={member.email}>{member.email}</span>
                                                </div>
                                                <div className="flex items-center text-xs text-gray-600">
                                                    <Phone size={12} className="mr-2 text-gray-400" />
                                                    {member.phone || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredFaculty.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            No faculty members found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </HodLayout>
    );
};

export default HodFaculty;
