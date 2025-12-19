// File Name: CreateCompetitionForm.jsx
// Purpose: Form to create a new competition
// Written for beginner developers

import { useState } from 'react';

const CreateCompetitionForm = () => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Creating competition:', title, date);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-6">
            <h3 className="text-lg font-bold mb-4">Create Competition</h3>
            <div className="mb-4">
                <label className="block text-gray-700 mb-2">Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 mb-2">Date</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    required
                />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Create Competition
            </button>
        </form>
    );
};

export default CreateCompetitionForm;
