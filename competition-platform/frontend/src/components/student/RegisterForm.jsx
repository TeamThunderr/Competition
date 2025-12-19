// File Name: RegisterForm.jsx
// Purpose: Form to register for a competition
// Written for beginner developers

import { useState } from 'react';

const RegisterForm = ({ competitionId }) => {
    const [teamName, setTeamName] = useState('');

    const handleRegister = (e) => {
        e.preventDefault();
        console.log(`Registering team ${teamName} for competition ${competitionId}`);
    };

    return (
        <form onSubmit={handleRegister} className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-bold mb-3">Register Team</h4>
            <input
                type="text"
                placeholder="Team Name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full mb-3 px-3 py-2 border rounded"
                required
            />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Register
            </button>
        </form>
    );
};

export default RegisterForm;
