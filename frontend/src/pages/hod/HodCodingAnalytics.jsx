import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { getCodingTopStudents } from '../../services/codingService';
import CodingAnalyticsPanel from '../../components/coding/CodingAnalyticsPanel';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';
import { useNavigate } from 'react-router-dom';

const HodCodingAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/hod/coding/overview');
      setProfiles(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
      const top = await getCodingTopStudents('hod', 'LEETCODE', 10);
      setStudents(Array.isArray(top?.data) ? top.data : (Array.isArray(top) ? top : []));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><RoleBasedLoader role="HOD" /></div>;

  return (
    <div className="space-y-6">
      <CodingAnalyticsPanel role="hod" title="Coding Analytics" profiles={profiles} />
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-4">Top LeetCode Students</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted">
              <tr>
                <th className="py-3 text-left">Student</th>
                <th className="py-3 text-left">Solved</th>
                <th className="py-3 text-left">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.length > 0 ? students.map((row) => (
                <tr key={row.id}>
                  <td className="py-3">{row.users?.full_name || row.username || 'N/A'}</td>
                  <td className="py-3">{row.total_solved ?? 'N/A'}</td>
                  <td className="py-3">{row.contest_rating ?? 'N/A'}</td>
                </tr>
              )) : (
                <tr><td colSpan="3" className="py-6 text-center text-muted">No LeetCode profiles have been connected yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HodCodingAnalytics;
