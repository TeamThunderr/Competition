import React, { useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { getMyCodingProfiles, syncCodingProfile, updateCodeChefProfile, updateLeetCodeProfile } from '../../services/codingService';
import RoleBasedLoader from '../../components/common/RoleBasedLoader';
import CodingAnalyticsPanel from '../../components/coding/CodingAnalyticsPanel';

const StudentCoding = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({ LEETCODE: false, CODECHEF: false });
  const [profiles, setProfiles] = useState([]);
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [codechefUsername, setCodechefUsername] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyCodingProfiles();
      const list = Array.isArray(data) ? data : (data?.data || []);
      setProfiles(list);
      setLeetcodeUsername(list.find(p => p.platform === 'LEETCODE')?.username || '');
      setCodechefUsername(list.find(p => p.platform === 'CODECHEF')?.username || '');
    } catch (e) {
      addToast('Unable to load coding profiles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (platform) => {
    const username = platform === 'LEETCODE' ? leetcodeUsername.trim() : codechefUsername.trim();
    if (!username) return addToast('Please enter a username', 'error');
    setSaving((prev) => ({ ...prev, [platform]: true }));
    try {
      if (platform === 'LEETCODE') await updateLeetCodeProfile(username);
      else await updateCodeChefProfile(username);
      addToast(`${platform === 'LEETCODE' ? 'LeetCode' : 'CodeChef'} profile saved`, 'success');
      await load();
    } catch (e) {
      addToast('Unable to save profile', 'error');
    } finally {
      setSaving((prev) => ({ ...prev, [platform]: false }));
    }
  };

  const onSync = async (profile) => {
    try {
      const result = await syncCodingProfile(profile.id);
      if (result?.queued) addToast('Sync started. Your profile will update shortly.', 'success');
      else addToast('Sync requested', 'success');
      await load();
    } catch (e) {
      addToast('Unable to start sync', 'error');
    }
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><RoleBasedLoader role="STUDENT" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Coding Profiles</h1>
        <p className="text-muted mt-1">Connect your public LeetCode and CodeChef profiles so your stats can sync in the background.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">LeetCode username</label>
            <div className="flex gap-2">
              <input value={leetcodeUsername} onChange={(e) => setLeetcodeUsername(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground" placeholder="username" />
              <button onClick={() => save('LEETCODE')} disabled={saving.LEETCODE} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                {saving.LEETCODE ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">CodeChef username</label>
            <div className="flex gap-2">
              <input value={codechefUsername} onChange={(e) => setCodechefUsername(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground" placeholder="username" />
              <button onClick={() => save('CODECHEF')} disabled={saving.CODECHEF} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                {saving.CODECHEF ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CodingAnalyticsPanel
        role="student"
        title="My Coding Dashboard"
        profiles={profiles}
        onSync={onSync}
      />
    </div>
  );
};

export default StudentCoding;
