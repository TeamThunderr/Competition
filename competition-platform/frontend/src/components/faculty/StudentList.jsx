// File Name: StudentList.jsx
// Purpose: List students under faculty mentorship
// Written for beginner developers

const StudentList = () => {
    const students = [
        { id: 1, name: 'Alice Smith', email: 'alice@example.com' },
        { id: 2, name: 'Bob Jones', email: 'bob@example.com' },
    ];

    return (
        <div className="bg-white p-6 rounded shadow mb-6">
            <h3 className="text-lg font-bold mb-4">My Students</h3>
            <ul className="divide-y divide-gray-200">
                {students.map(student => (
                    <li key={student.id} className="py-2">
                        <span className="font-medium">{student.name}</span> - <span className="text-gray-500 text-sm">{student.email}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default StudentList;
