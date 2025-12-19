// File Name: CompetitionCard.jsx
// Purpose: Display competition details in a card
// Written for beginner developers

const CompetitionCard = ({ competition }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{competition.title}</h3>
            <p className="text-gray-600 mb-4">{competition.description}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Date: {competition.date}</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{competition.status}</span>
            </div>
            <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                View Details
            </button>
        </div>
    );
};

export default CompetitionCard;
