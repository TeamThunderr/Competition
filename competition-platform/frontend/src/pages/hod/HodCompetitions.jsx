import React, { useState } from 'react';
import HodSidebar from './Sidebar';
import CompetitionListView from '../common/CompetitionListView';
import { api } from '../../services/api';

const HodCompetitions = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchCompetitions = async () => {
            try {
                // api.js handles auth automatically
                const data = await api.get('/api/hod/competitions');
                setCompetitions(data);
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
            Sidebar={HodSidebar}
            competitions={competitions}
            title="Upcoming Competitions"
            subtitle="Discover top programming events."
            loading={loading}
            showRegister={false}
        />
    );
};

export default HodCompetitions;
