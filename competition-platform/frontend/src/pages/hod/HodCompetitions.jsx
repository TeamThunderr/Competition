import React, { useState } from 'react';
import HodLayout from './HodLayout';
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
        <HodLayout>
            <CompetitionListView
                /* No Sidebar passed, so it uses the 'content-only' mode */
                competitions={competitions}
                title="Upcoming Competitions"
                subtitle="Discover top programming events."
                loading={loading}
                showRegister={false}
                role="HOD"
            />
        </HodLayout>
    );
};

export default HodCompetitions;
