// File Name: ParticipationTable.jsx
// Purpose: Table showing student participation history
// Written for beginner developers

const ParticipationTable = () => {
    return (
        <div className="bg-white p-6 rounded shadow overflow-x-auto">
            <h3 className="text-lg font-bold mb-4">Participation History</h3>
            <table className="min-w-full text-left">
                <thead>
                    <tr className="bg-gray-100 border-b">
                        <th className="p-2">Student</th>
                        <th className="p-2">Competition</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Result</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b">
                        <td className="p-2">Alice Smith</td>
                        <td className="p-2">Hackathon 2024</td>
                        <td className="p-2">2024-12-25</td>
                        <td className="p-2 text-green-600">Winner</td>
                    </tr>
                    <tr>
                        <td className="p-2">Bob Jones</td>
                        <td className="p-2">Robotics Meet</td>
                        <td className="p-2">2025-01-10</td>
                        <td className="p-2 text-gray-500">Participating</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default ParticipationTable;
