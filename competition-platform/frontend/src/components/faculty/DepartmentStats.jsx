// File Name: DepartmentStats.jsx
// Purpose: Show simple departmental statistics
// Written for beginner developers

const DepartmentStats = () => {
    return (
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded text-center">
                <h4 className="text-2xl font-bold text-blue-700">15</h4>
                <p className="text-sm text-gray-600">Active Students</p>
            </div>
            <div className="bg-green-50 p-4 rounded text-center">
                <h4 className="text-2xl font-bold text-green-700">3</h4>
                <p className="text-sm text-gray-600">Competitions Won</p>
            </div>
        </div>
    );
};

export default DepartmentStats;
