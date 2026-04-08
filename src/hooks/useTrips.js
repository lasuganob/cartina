import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useLiveQuery } from 'dexie-react-hooks';
import { apiClient } from '../api/client';
import { queueMutation, db } from '../lib/db';
import { useAppContext } from '../context/AppContext';

function normalizeTrip(trip) {
  return {
    ...trip,
    budget: Number(trip.budget || 0),
    planned_for: trip.planned_for || dayjs().format('YYYY-MM-DD'),
    store_id: trip.store_id || '',
    created_at: trip.created_at || new Date().toISOString(),
    completed_at: trip.completed_at || ''
  };
}

export function useTrips() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const trips = useLiveQuery(() => db.trips.orderBy('planned_for').reverse().toArray(), []);
  const { showSnackbar } = useAppContext();

  useEffect(() => {
    let cancelled = false;

    async function loadTrips() {
      try {
        setLoading(true);
        const data = await apiClient.getTrips();
        if (cancelled) {
          return;
        }

        const normalizedTrips = (data.items || []).map(normalizeTrip);
        await db.trips.clear();
        await db.trips.bulkPut(normalizedTrips);
        setError('');
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTrips();

    return () => {
      cancelled = true;
    };
  }, []);

  async function addTrip(values) {
    const trip = normalizeTrip({
      id: crypto.randomUUID(),
      ...values,
      status: 'planned',
      created_at: new Date().toISOString(),
      completed_at: ''
    });

    await db.trips.put(trip);
    await queueMutation('trips', 'create', trip);
    showSnackbar('Trip saved locally and queued for sync.', 'success');
  }

  const stats = useMemo(() => {
    const items = trips || [];
    const plannedTrips = items.filter((trip) => trip.status === 'planned').length;
    const completedTrips = items.filter((trip) => trip.status === 'completed').length;
    const totalBudget = items.reduce((sum, trip) => sum + trip.budget, 0);

    return {
      plannedTrips,
      completedTrips,
      totalBudget,
      totalTrips: items.length
    };
  }, [trips]);

  return {
    trips: trips || [],
    loading,
    error,
    addTrip,
    stats
  };
}
