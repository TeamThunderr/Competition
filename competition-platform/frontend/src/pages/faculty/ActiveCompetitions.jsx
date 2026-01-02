import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import CompetitionListView from '../common/CompetitionListView';
import { api } from '../../services/api';

const ActiveCompetitions = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompetitions = async () => {
            try {
                const response = await api.get('/api/faculty/competitions');
                setCompetitions(response.data || response);
            } catch (err) {
                console.error("Failed to fetch competitions", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCompetitions();
    }, []);

    return (
        <CompetitionListView
            Sidebar={Sidebar}
            competitions={competitions}
            title="All Competitions"
            subtitle="View history of all competitions."
            loading={loading}
            showRegister={false}
            role="FACULTY"
        />
    );
};

export default ActiveCompetitions;
