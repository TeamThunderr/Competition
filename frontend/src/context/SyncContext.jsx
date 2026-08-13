import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import facultyService from '../services/facultyService';
import { useAuth } from './AuthContext';

const SyncContext = createContext();

export const useSync = () => useContext(SyncContext);

export const SyncProvider = ({ children }) => {
    const { user } = useAuth();
    const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);
    const [syncProgressMap, setSyncProgressMap] = useState({});

    // Refs to avoid stale closures in setInterval
    const isSyncingRef = useRef(false);
    const intervalRef = useRef(null);

    const fetchSyncStatus = useCallback(async () => {
        if (!user || user.role !== 'FACULTY') return;
        try {
            const raw = await facultyService.getCompetitionSyncStatus();
            const list = Array.isArray(raw) ? raw : (raw?.data || []);

            let anySyncing = false;
            const progressMap = {};

            list.forEach(comp => {
                if (comp.isSyncing) {
                    anySyncing = true;
                    const studentProgress = comp.totalStudents
                        ? ` Students: ${comp.studentsProcessed || 0}/${comp.totalStudents}.`
                        : '';
                    const emailProgress = comp.emailsProcessed
                        ? ` Emails processed: ${comp.emailsProcessed}.`
                        : '';
                    const registrationProgress = comp.registrationsUpdated
                        ? ` Registrations found: ${comp.registrationsUpdated}.`
                        : '';
                    progressMap[comp.id] = `${comp.syncProgress || comp.jobStatus || 'Sync in progress'}${studentProgress}${emailProgress}${registrationProgress}`;
                } else if (comp.syncProgress) {
                    progressMap[comp.id] = comp.syncProgress;
                }
            });

            const wasAlreadySyncing = isSyncingRef.current;
            isSyncingRef.current = anySyncing;

            setIsGlobalSyncing(anySyncing);
            setSyncProgressMap(progressMap);

            // If sync just completed, reschedule the interval at a slower rate
            if (wasAlreadySyncing && !anySyncing) {
                restartInterval(10000);
            }
        } catch (error) {
            console.error('[SyncContext] Error fetching sync status:', error);
        }
    }, [user]); // Only depends on user — no state in deps to avoid re-render loops

    const restartInterval = useCallback((delay) => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(fetchSyncStatus, delay);
    }, [fetchSyncStatus]);

    // Start polling when user is available. Use ref-based interval so we don't
    // recreate it on every state change (which causes request floods).
    useEffect(() => {
        if (!user || user.role !== 'FACULTY') return;

        fetchSyncStatus(); // Initial fetch
        restartInterval(isSyncingRef.current ? 1000 : 10000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [user, fetchSyncStatus, restartInterval]); // fetchSyncStatus is stable (useCallback with [user])

    // When isGlobalSyncing becomes true, switch to fast polling
    useEffect(() => {
        if (isGlobalSyncing) {
            restartInterval(1000);
        }
    }, [isGlobalSyncing, restartInterval]);

    return (
        <SyncContext.Provider value={{ isGlobalSyncing, setIsGlobalSyncing, syncProgressMap, fetchSyncStatus }}>
            {children}
        </SyncContext.Provider>
    );
};
