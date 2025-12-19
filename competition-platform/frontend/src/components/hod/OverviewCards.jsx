// File Name: OverviewCards.jsx
// Purpose: High-level overview stats
// Written for beginner developers

const OverviewCards = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500">
                <h4 className="text-gray-500 text-sm uppercase">Total Students</h4>
                <p className="text-3xl font-bold mt-2">120</p>
            </div>
            <div className="bg-white p-6 rounded shadow border-l-4 border-green-500">
                <h4 className="text-gray-500 text-sm uppercase">Achievements</h4>
                <p className="text-3xl font-bold mt-2">15</p>
            </div>
            <div className="bg-white p-6 rounded shadow border-l-4 border-yellow-500">
                <h4 className="text-gray-500 text-sm uppercase">Pending Approvals</h4>
                <p className="text-3xl font-bold mt-2">5</p>
            </div>
        </div>
    );
};

export default OverviewCards;
