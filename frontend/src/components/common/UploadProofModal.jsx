import React, { useState } from 'react';
import { X, Upload, Loader, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

const UploadProofModal = ({ isOpen, onClose, onSubmit, competitionId, title: initialTitle, defaultProofType = null }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    // Initialize proofType based on defaultProofType
    const [proofType, setProofType] = useState(defaultProofType || 'REGISTERED');

    // Reset/Initialize when modal opens or defaultProofType changes
    React.useEffect(() => {
        if (isOpen) {
            setProofType(defaultProofType || 'REGISTERED');
            setFile(null);
            setPreview(null);
            setError(null);
        }
    }, [isOpen, defaultProofType]);

    if (!isOpen) return null;

    const resetState = () => {
        setFile(null);
        setPreview(null);
        setError(null);
        setProofType(defaultProofType || 'REGISTERED');
    };

    const handleClose = () => {
        resetState();
        onClose();
    };



    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Basic validation
        if (!selectedFile.type.startsWith('image/')) {
            setError('Please upload an image file (PNG, JPG, JPEG)');
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) { // 5MB
            setError('File size must be less than 5MB');
            return;
        }

        setError(null);
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            // Updated: Pass file directly to parent for backend upload (fixes RLS)
            await onSubmit(competitionId, file, proofType);

            // Cleanup and close
            handleClose();

        } catch (err) {
            console.error('Upload failed:', err);
            const errorMessage = typeof err === 'string' ? err : err.message;
            setError(errorMessage || 'Failed to submit proof. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0F1117] rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-white/10">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-white/10">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {proofType === 'REGISTERED' ? 'Upload Registration Proof' : 'Upload Qualification Proof'}
                    </h3>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="grid gap-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {proofType === 'REGISTERED'
                                ? "Please upload a screenshot of your registration confirmation (email or success screen)."
                                : "Please upload a screenshot showing you have been shortlisted or qualified."}
                        </p>

                        {/* Upload Area */}
                        <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors bg-gray-50/50 dark:bg-black/20">
                            {preview ? (
                                <div className="relative w-full">
                                    <img src={preview} alt="Preview" className="w-full h-48 object-contain rounded-lg" />
                                    <button
                                        onClick={() => { setFile(null); setPreview(null); }}
                                        className="absolute top-2 right-2 bg-red-100 text-red-600 p-1 rounded-full hover:bg-red-200"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <label className="cursor-pointer w-full flex flex-col items-center">
                                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-3">
                                        <StoreUploadIcon />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200">Click to upload image</span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG up to 5MB</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            )}
                        </div>

                        {error && (
                            <div className="mt-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-2 rounded-lg border border-red-100 dark:border-red-500/20 flex items-center">
                                ⚠️ {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-black/20 flex justify-end gap-3 border-t border-gray-100 dark:border-white/10">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                        disabled={uploading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        {uploading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Submit Proof
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const StoreUploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);



export default UploadProofModal;
