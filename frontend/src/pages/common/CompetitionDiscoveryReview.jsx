import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Edit3, ExternalLink, Loader2, RefreshCw, Search, ShieldAlert, Sparkles, ThumbsDown, ThumbsUp, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import ConfirmModal from '../../components/common/ConfirmModal';
import AlertModal from '../../components/common/AlertModal';
import { approveCandidate, getCandidates, rejectCandidate, startDiscovery, updateCandidate } from '../../services/competitionDiscoveryService';

const STATUS_OPTIONS = ['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ALL'];

const pillClassByStatus = {
    PENDING_REVIEW: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
    ALL: 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-white/5 dark:text-slate-300 dark:border-white/10',
};

const emptyStats = [
    { label: 'Pending Review', value: '0' },
    { label: 'Approved', value: '0' },
    { label: 'Rejected', value: '0' },
    { label: 'Total Loaded', value: '0' },
];

const normalizeStatus = (candidate) => (candidate?.status || candidate?.review_status || 'PENDING_REVIEW').toUpperCase();

const getCandidateTitle = (candidate) => candidate?.title || candidate?.competition_title || candidate?.subject || 'Untitled competition';
const getCandidateOrganizer = (candidate) => candidate?.organizer || candidate?.source_organizer || candidate?.from_name || 'Unknown organizer';
const getCandidateDeadline = (candidate) => candidate?.registration_deadline || candidate?.deadline || candidate?.due_at || candidate?.event_date || '';
const getCandidateMatch = (candidate) => candidate?.match_score ?? candidate?.confidence_score ?? candidate?.score ?? null;
const getCandidateWarnings = (candidate) => {
    const warnings = [];
    if (candidate?.duplicate_match) warnings.push('Possible duplicate');
    if ((getCandidateMatch(candidate) ?? 1) < 0.65) warnings.push('Low confidence');
    if (candidate?.needs_manual_review) warnings.push('Manual review');
    return warnings;
};

const competitionPayloadFromCandidate = (candidate, overrides = {}) => ({
    title: candidate?.title || candidate?.competition_title || '',
    organizer: candidate?.organizer || '',
    platform: candidate?.platform || 'Unstop',
    mode: candidate?.mode || 'Online',
    venue: candidate?.venue || '',
    description: candidate?.description || candidate?.summary || '',
    link: candidate?.link || candidate?.url || '',
    registration_deadline: getCandidateDeadline(candidate) || '',
    event_date: candidate?.event_date || '',
    team_allowed: !!candidate?.team_allowed,
    min_team_size: candidate?.min_team_size || 1,
    max_team_size: candidate?.max_team_size || 1,
    departments: candidate?.departments || [],
    ...overrides,
});

const CandidateCard = ({ candidate, onOpen, onApprove, onReject }) => {
    const warnings = getCandidateWarnings(candidate);

    return (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground truncate">{getCandidateTitle(candidate)}</h3>
                    <p className="text-sm text-muted truncate">{getCandidateOrganizer(candidate)}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${pillClassByStatus[normalizeStatus(candidate)] || pillClassByStatus.ALL}`}>
                    {normalizeStatus(candidate).replace('_', ' ')}
                </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                {warnings.map((warning) => (
                    <span key={warning} className="text-[10px] font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300">
                        {warning}
                    </span>
                ))}
            </div>

            <div className="mt-4 space-y-1 text-sm text-muted">
                <div className="flex items-center gap-2"><Clock3 size={14} /> {getCandidateDeadline(candidate) || 'No deadline detected'}</div>
                <div className="flex items-center gap-2"><Sparkles size={14} /> {candidate?.platform || 'Platform not set'}</div>
                <div className="flex items-center gap-2"><ExternalLink size={14} /> {candidate?.source || candidate?.origin || 'Email discovery'}</div>
            </div>

            <div className="mt-4 flex gap-2">
                <button onClick={() => onOpen(candidate)} className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/10">
                    <Edit3 size={14} /> Review
                </button>
                <button onClick={() => onApprove(candidate)} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
                    <ThumbsUp size={14} /> Approve
                </button>
                <button onClick={() => onReject(candidate)} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700">
                    <ThumbsDown size={14} /> Reject
                </button>
            </div>
        </div>
    );
};

const CompetitionDiscoveryReview = () => {
    const navigate = useNavigate();
    const { role } = useAuth();
    const { addToast } = useToast();

    const [status, setStatus] = useState('PENDING_REVIEW');
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [discovering, setDiscovering] = useState(false);
    const [candidates, setCandidates] = useState([]);
    const [selected, setSelected] = useState(null);
    const [reviewForm, setReviewForm] = useState({});
    const [confirmState, setConfirmState] = useState({ open: false, action: null, candidate: null });
    const [alertState, setAlertState] = useState({ open: false, title: '', message: '', type: 'info' });

    const loadCandidates = async () => {
        setLoading(true);
        try {
            const data = await getCandidates(role, status);
            setCandidates(Array.isArray(data) ? data : (data?.data || []));
        } catch (error) {
            console.error('Failed to load competition candidates', error);
            addToast('Unable to load discovery review items', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCandidates();
    }, [role, status]);

    useEffect(() => {
        if (selected) {
            setReviewForm(competitionPayloadFromCandidate(selected));
        }
    }, [selected]);

    const stats = useMemo(() => {
        const pending = candidates.filter((c) => normalizeStatus(c) === 'PENDING_REVIEW').length;
        const approved = candidates.filter((c) => normalizeStatus(c) === 'APPROVED').length;
        const rejected = candidates.filter((c) => normalizeStatus(c) === 'REJECTED').length;
        return [
            { label: 'Pending Review', value: pending.toString() },
            { label: 'Approved', value: approved.toString() },
            { label: 'Rejected', value: rejected.toString() },
            { label: 'Total Loaded', value: candidates.length.toString() },
        ];
    }, [candidates]);

    const filteredCandidates = useMemo(() => {
        const q = query.trim().toLowerCase();
        return candidates.filter((candidate) => {
            if (!q) return true;
            const haystack = [
                getCandidateTitle(candidate),
                getCandidateOrganizer(candidate),
                candidate?.platform,
                candidate?.link,
                candidate?.description,
            ].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(q);
        });
    }, [candidates, query]);

    const openReview = (candidate) => setSelected(candidate);
    const closeReview = () => setSelected(null);

    const handleSave = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            await updateCandidate(role, selected.id, reviewForm);
            addToast('Competition candidate updated', 'success');
            setSelected(null);
            await loadCandidates();
        } catch (error) {
            console.error(error);
            addToast('Failed to save candidate changes', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleApprove = (candidate) => setConfirmState({ open: true, action: 'approve', candidate });
    const handleReject = (candidate) => setConfirmState({ open: true, action: 'reject', candidate });
    const handleStartDiscovery = async () => {
        setDiscovering(true);
        try {
            await startDiscovery(role);
            addToast('Discovery sync started', 'success');
            await loadCandidates();
        } catch (error) {
            console.error(error);
            addToast('Failed to start discovery', 'error');
        } finally {
            setDiscovering(false);
        }
    };

    const handleConfirm = async () => {
        const { action, candidate } = confirmState;
        setConfirmState({ open: false, action: null, candidate: null });
        if (!candidate) return;
        try {
            if (action === 'approve') {
                await approveCandidate(role, candidate.id, reviewForm);
                addToast('Candidate approved', 'success');
            } else {
                await rejectCandidate(role, candidate.id, 'Rejected from review board');
                addToast('Candidate rejected', 'success');
            }
            await loadCandidates();
        } catch (error) {
            console.error(error);
            addToast(`Failed to ${action} candidate`, 'error');
        }
    };

    return (
        <div className="w-full min-w-0">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate(-1)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-muted/10">
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Competition Discovery Review</h1>
                                <p className="text-sm text-muted">Review email-discovered competitions before they enter the catalog.</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={handleStartDiscovery} disabled={discovering} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">
                            {discovering ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                            Sync Discovery
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                            <div className="text-[10px] uppercase tracking-wider text-muted font-bold">{stat.label}</div>
                            <div className="mt-1 text-2xl font-black text-foreground">{stat.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm p-4 md:p-5 mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_OPTIONS.map((item) => (
                            <button
                                key={item}
                                onClick={() => setStatus(item)}
                                className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${status === item ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-muted border-border hover:bg-muted/10'}`}
                            >
                                {item.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    <div className="relative md:w-80">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search title, organizer, platform"
                            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="bg-card border border-border rounded-xl p-10 text-center text-muted">Loading discovery candidates...</div>
            ) : filteredCandidates.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-10 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/10 text-muted">
                        <ShieldAlert size={22} />
                    </div>
                    <div className="text-lg font-semibold text-foreground">No candidates found</div>
                    <p className="mt-2 text-sm text-muted">Try syncing discovery, or switch review status filters.</p>
                </div>
            ) : (
                <>
                    <div className="hidden md:block bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableHead>Competition</TableHead>
                                <TableHead>Organizer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Deadline</TableHead>
                                <TableHead>Match</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableHeader>
                            <TableBody>
                                {filteredCandidates.map((candidate) => (
                                    <TableRow key={candidate.id}>
                                        <TableCell className="font-medium max-w-[320px] truncate">
                                            <div className="flex items-center gap-2">
                                                {normalizeStatus(candidate) === 'APPROVED' ? <CheckCircle2 size={14} className="text-emerald-600" /> : <AlertCircle size={14} className="text-amber-500" />}
                                                <div className="min-w-0">
                                                    <div className="truncate text-foreground">{getCandidateTitle(candidate)}</div>
                                                    <div className="truncate text-xs text-muted">{candidate?.platform || 'Platform unknown'}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getCandidateOrganizer(candidate)}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-bold ${pillClassByStatus[normalizeStatus(candidate)] || pillClassByStatus.ALL}`}>
                                                {normalizeStatus(candidate).replace('_', ' ')}
                                            </span>
                                        </TableCell>
                                        <TableCell>{getCandidateDeadline(candidate) || '-'}</TableCell>
                                        <TableCell>{getCandidateMatch(candidate) != null ? `${Math.round(getCandidateMatch(candidate) * 100)}%` : '—'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="inline-flex gap-2">
                                                <button onClick={() => openReview(candidate)} className="px-3 py-2 rounded-lg border border-border hover:bg-muted/10">
                                                    Review
                                                </button>
                                                <button onClick={() => handleApprove(candidate)} className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                                                    Approve
                                                </button>
                                                <button onClick={() => handleReject(candidate)} className="px-3 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700">
                                                    Reject
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="grid gap-3 md:hidden">
                        {filteredCandidates.map((candidate) => (
                            <CandidateCard key={candidate.id} candidate={candidate} onOpen={openReview} onApprove={handleApprove} onReject={handleReject} />
                        ))}
                    </div>
                </>
            )}

            <ConfirmModal
                isOpen={confirmState.open}
                onClose={() => setConfirmState({ open: false, action: null, candidate: null })}
                onConfirm={handleConfirm}
                title={confirmState.action === 'approve' ? 'Approve candidate?' : 'Reject candidate?'}
                message={confirmState.candidate ? `${getCandidateTitle(confirmState.candidate)} will be marked as ${confirmState.action === 'approve' ? 'approved' : 'rejected'}.` : ''}
                confirmText={confirmState.action === 'approve' ? 'Approve' : 'Reject'}
                type={confirmState.action === 'approve' ? 'success' : 'danger'}
            />

            <AlertModal
                isOpen={alertState.open}
                onClose={() => setAlertState({ open: false, title: '', message: '', type: 'info' })}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />

            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeReview} />
                    <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-hidden">
                        <div className="p-5 border-b border-border flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-foreground">{getCandidateTitle(selected)}</h2>
                                <p className="text-sm text-muted">{getCandidateOrganizer(selected)}</p>
                            </div>
                            <button onClick={closeReview} className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:bg-muted/10">Close</button>
                        </div>

                        <div className="p-5 overflow-y-auto max-h-[calc(90vh-78px)]">
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="text-sm">
                                    <span className="mb-1 block font-semibold text-foreground">Title</span>
                                    <input value={reviewForm.title || ''} onChange={(e) => setReviewForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
                                </label>
                                <label className="text-sm">
                                    <span className="mb-1 block font-semibold text-foreground">Organizer</span>
                                    <input value={reviewForm.organizer || ''} onChange={(e) => setReviewForm((prev) => ({ ...prev, organizer: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
                                </label>
                                <label className="text-sm">
                                    <span className="mb-1 block font-semibold text-foreground">Platform</span>
                                    <input value={reviewForm.platform || ''} onChange={(e) => setReviewForm((prev) => ({ ...prev, platform: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
                                </label>
                                <label className="text-sm">
                                    <span className="mb-1 block font-semibold text-foreground">Deadline</span>
                                    <input value={reviewForm.registration_deadline || ''} onChange={(e) => setReviewForm((prev) => ({ ...prev, registration_deadline: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
                                </label>
                                <label className="text-sm md:col-span-2">
                                    <span className="mb-1 block font-semibold text-foreground">Link</span>
                                    <input value={reviewForm.link || ''} onChange={(e) => setReviewForm((prev) => ({ ...prev, link: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
                                </label>
                                <label className="text-sm md:col-span-2">
                                    <span className="mb-1 block font-semibold text-foreground">Description</span>
                                    <textarea value={reviewForm.description || ''} onChange={(e) => setReviewForm((prev) => ({ ...prev, description: e.target.value }))} rows={6} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
                                </label>
                            </div>

                            <div className="mt-5 rounded-xl border border-border bg-muted/10 p-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-bold ${pillClassByStatus[normalizeStatus(selected)] || pillClassByStatus.ALL}`}>
                                        {normalizeStatus(selected).replace('_', ' ')}
                                    </span>
                                    {getCandidateWarnings(selected).map((warning) => (
                                        <span key={warning} className="inline-flex items-center px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold dark:bg-amber-500/10 dark:text-amber-300">
                                            {warning}
                                        </span>
                                    ))}
                                </div>
                                <p className="mt-3 text-sm text-muted">You can adjust the scraped fields, then approve or reject this candidate from the same review surface.</p>
                            </div>

                            <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-end">
                                <button onClick={closeReview} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted/10">
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60">
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Wrench size={16} />}
                                    Save Draft
                                </button>
                                <button onClick={() => handleApprove(selected)} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
                                    <ThumbsUp size={16} />
                                    Approve
                                </button>
                                <button onClick={() => handleReject(selected)} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700">
                                    <ThumbsDown size={16} />
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompetitionDiscoveryReview;
