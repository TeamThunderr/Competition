import React from 'react';
import { X, User, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentListModal = ({ isOpen, onClose, title, students }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                        <p className="text-sm text-gray-500 mt-1">{students.length} Students</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {students.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {students.map((student) => (
                                <div
                                    key={student.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 border border-gray-200 shadow-sm">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">{student.name}</h3>
                                            <p className="text-xs text-gray-500 flex gap-2">
                                                <span>{student.regNo}</span>
                                                {student.section && (
                                                    <span className="px-2 py-0.5 bg-gray-200 rounded-full text-gray-600 font-medium text-[10px]">
                                                        Sec {student.section}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/hod/student/${student.id}`)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 translate-x-2 group-hover:translate-x-0"
                                    >
                                        View Profile
                                        <ExternalLink size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No students found in this list.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentListModal;
