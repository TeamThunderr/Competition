import React, { useMemo } from 'react';
import { ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Clock3 } from 'lucide-react';

const fmt = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  return value;
};

const fmtDate = (value) => {
  if (!value) return 'Not synced yet';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

const Stat = ({ label, value, hint }) => (
  <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
    <div className="text-[10px] uppercase tracking-wider text-muted font-bold">{label}</div>
    <div className="mt-1 text-2xl font-black text-foreground">{value}</div>
    {hint ? <div className="mt-1 text-xs text-muted">{hint}</div> : null}
  </div>
);

const ProfileCard = ({ title, profile, stats, onSync, onConnect, onOpen }) => {
  const status = (profile?.sync_status || 'PENDING').toUpperCase();
  const hasProfile = !!profile?.username;
  const profileUrl = profile?.profile_url;
  const badges = stats?.badge_count;
  const note = 'Data is collected from publicly available platform profile information and may be delayed or unavailable when the platform changes its public interface.';

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted">
            {hasProfile ? `@${profile.username}` : 'No profile connected.'}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
          status === 'VALID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
            : status === 'NOT_FOUND' ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20'
            : status === 'ERROR' || status === 'UNAVAILABLE' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
            : 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-white/5 dark:text-slate-300 dark:border-white/10'
        }`}>
          {status === 'VALID' ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
          {status.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="text-muted">{hasProfile ? `Last synced: ${fmtDate(profile?.last_synced_at)}` : 'Not connected yet'}</div>
        {profile?.last_sync_error ? <div className="text-rose-600 text-sm flex items-center gap-2"><AlertCircle size={14} /> Unable to sync profile.</div> : null}
        {profileUrl ? (
          <a href={profileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium hover:underline">
            View profile <ExternalLink size={14} />
          </a>
        ) : null}
      </div>

      {hasProfile && stats ? (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="bg-muted/10 rounded-xl p-3 border border-border/60">
              <div className="text-[10px] uppercase tracking-wider text-muted font-bold">{key.replace(/_/g, ' ')}</div>
              <div className="mt-1 font-bold text-foreground">{fmt(value)}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!hasProfile && onConnect ? (
          <button onClick={onConnect} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
            Connect Profile
          </button>
        ) : null}
        {hasProfile && onSync ? (
          <button onClick={onSync} className="px-3 py-2 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted/10 inline-flex items-center gap-2">
            <RefreshCw size={14} /> Sync Now
          </button>
        ) : null}
        {profileUrl && onOpen ? (
          <button onClick={onOpen} className="px-3 py-2 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted/10">
            View Profile
          </button>
        ) : null}
      </div>

      <p className="text-xs text-muted leading-relaxed">{note}</p>
      {badges !== null && badges !== undefined ? <p className="text-xs text-muted">Badges earned: {badges}</p> : null}
    </div>
  );
};

export const CodingAnalyticsPanel = ({ role = 'student', title = 'Coding Analytics', profiles = [], onConnectLeetCode, onConnectCodeChef, onSync }) => {
  const normalized = useMemo(() => {
    const map = { LEETCODE: null, CODECHEF: null };
    (profiles || []).forEach((p) => {
      map[String(p.platform || '').toUpperCase()] = p;
    });
    return map;
  }, [profiles]);

  const leetcodeStats = normalized.LEETCODE?.leetcode_profile_stats?.[0] || normalized.LEETCODE?.stats || normalized.LEETCODE?.leetcode_stats || {};
  const codechefStats = normalized.CODECHEF?.codechef_profile_stats?.[0] || normalized.CODECHEF?.stats || normalized.CODECHEF?.codechef_stats || {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted mt-1">Public profile data cached from our backend. Not real-time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProfileCard
          title="LeetCode"
          profile={normalized.LEETCODE}
          stats={normalized.LEETCODE ? {
            solved: leetcodeStats.total_solved,
            easy: leetcodeStats.easy_solved,
            medium: leetcodeStats.medium_solved,
            hard: leetcodeStats.hard_solved,
            contest_rating: leetcodeStats.contest_rating,
            contest_participation: leetcodeStats.contest_participation_count,
          } : null}
          onSync={normalized.LEETCODE ? () => onSync?.(normalized.LEETCODE) : null}
          onConnect={onConnectLeetCode}
          onOpen={normalized.LEETCODE?.profile_url ? () => window.open(normalized.LEETCODE.profile_url, '_blank', 'noopener,noreferrer') : null}
        />

        <ProfileCard
          title="CodeChef"
          profile={normalized.CODECHEF}
          stats={normalized.CODECHEF ? {
            rating: codechefStats.current_rating,
            highest_rating: codechefStats.highest_rating,
            stars: codechefStats.stars,
            global_rank: codechefStats.global_rank,
            country_rank: codechefStats.country_rank,
            contest_participation: codechefStats.contest_participation_count,
          } : null}
          onSync={normalized.CODECHEF ? () => onSync?.(normalized.CODECHEF) : null}
          onConnect={onConnectCodeChef}
          onOpen={normalized.CODECHEF?.profile_url ? () => window.open(normalized.CODECHEF.profile_url, '_blank', 'noopener,noreferrer') : null}
        />
      </div>
    </div>
  );
};

export default CodingAnalyticsPanel;
