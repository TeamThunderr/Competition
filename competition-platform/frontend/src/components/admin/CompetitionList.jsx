// File Name: CompetitionList.jsx
// Purpose: Manage existing competitions
// Written for beginner developers

const CompetitionList = () => {
    const competitions = [
        { id: 1, title: 'Hackathon 2024', status: 'Active' },
        { id: 2, title: 'Robotics Meet', status: 'Upcoming' },
    ];

    return (
        <div className="bg-white p-6 rounded shadow mb-6">
            <h3 className="text-lg font-bold mb-4">Manage Competitions</h3>
            <ul className="divide-y divide-gray-200">
                {competitions.map(comp => (
                    <li key={comp.id} className="py-2 flex justify-between items-center">
                        <span>{comp.title}</span>
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded">{comp.status}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CompetitionList;
