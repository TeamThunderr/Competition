import React, { useState } from 'react';
import { X, Upload, Loader, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

const UploadProofModal = ({ isOpen, onClose, onSubmit, competitionId }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

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
            const fileExt = file.name.split('.').pop();
            const fileName = `${competitionId}_${Date.now()}.${fileExt}`;
            const filePath = `proofs/${fileName}`;

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('proofs')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('proofs')
                .getPublicUrl(filePath);

            // 3. Submit URL to backend
            await onSubmit(competitionId, publicUrl);

            // Cleanup and close
            setFile(null);
            setPreview(null);
            onClose();

        } catch (err) {
            console.error('Upload failed:', err);
            const errorMessage = typeof err === 'string' ? err : err.message;

            if (errorMessage === 'Supabase not configured') {
                setError('System Error: Database connection not configured. Please contact the administrator.');
            } else {
                setError(errorMessage || 'Failed to upload image. Please try again.');
            }
        } finally {
            setUploading(false);
        }

    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Upload Registration Proof</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">
                        Please upload a screenshot of your registration confirmation (email or success screen).
                    </p>

                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors bg-gray-50/50">
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
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                                    <StoreUploadIcon />
                                </div>
                                <span className="text-sm font-medium text-gray-900">Click to upload image</span>
                                <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
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
                        <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 flex items-center">
                            ⚠️ {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
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
