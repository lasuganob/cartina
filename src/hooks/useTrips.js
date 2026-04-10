import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useLiveQuery } from 'dexie-react-hooks';
import { apiClient } from '../api/client';
import { queueMutation, db } from '../lib/db';
import { useAppContext } from '../context/AppContext';

let inFlightTripsSync = null;

function normalizeTrip(trip) {
  return {
    ...trip,
    budget: Number(trip.budget || 0),
    planned_for: trip.planned_for || dayjs().format('YYYY-MM-DD'),
    store_id: trip.store_id || '',
    note: trip.note || '',
    created_at: trip.created_at || new Date().toISOString(),
    completed_at: trip.completed_at || ''
  };
}

function normalizeChecklistItem(item) {
  return {
    ...item,
    inventory_item_id: item.inventory_item_id || '',
    planned_price:
      item.planned_price === '' || item.planned_price === null || item.planned_price === undefined
        ? null
        : Number(item.planned_price),
    actual_price:
      item.actual_price === '' || item.actual_price === null || item.actual_price === undefined
        ? null
        : Number(item.actual_price),
    is_purchased: item.is_purchased === true || item.is_purchased === 'true',
    is_unplanned: item.is_unplanned === true || item.is_unplanned === 'true',
    sort_order: Number(item.sort_order || 0),
    created_at: item.created_at || new Date().toISOString()
  };
}

function normalizeStore(store) {
  return {
    ...store,
    logo_path: store.logo_path || ''
  };
}

async function syncTripsFromApi() {
  if (inFlightTripsSync) {
    return inFlightTripsSync;
  }

  inFlightTripsSync = (async () => {
    const data = await apiClient.getTrips();
    const normalizedTrips = (data.items || []).map(normalizeTrip);
    const normalizedChecklistItems = (data.trip_checklist || []).map(normalizeChecklistItem);
    const normalizedStores = (data.stores || []).map(normalizeStore);
    const normalizedInventoryItems = data.inventory_items || [];
    const normalizedCategories = data.categories || [];

    await db.transaction(
      'rw',
      db.trips,
      db.tripChecklist,
      db.stores,
      db.inventoryItems,
      db.categories,
      async () => {
        await db.trips.clear();
        await db.tripChecklist.clear();
        await db.stores.clear();
        await db.inventoryItems.clear();
        await db.categories.clear();

        await db.trips.bulkPut(normalizedTrips);

        if (normalizedChecklistItems.length) {
          await db.tripChecklist.bulkPut(normalizedChecklistItems);
        }

        if (normalizedStores.length) {
          await db.stores.bulkPut(normalizedStores);
        }

        if (normalizedInventoryItems.length) {
          await db.inventoryItems.bulkPut(normalizedInventoryItems);
        }

        if (normalizedCategories.length) {
          await db.categories.bulkPut(normalizedCategories);
        }
      }
    );
  })().finally(() => {
    inFlightTripsSync = null;
  });

  return inFlightTripsSync;
}

export function useTrips() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const tripsData = useLiveQuery(async () => {
    const [trips, checklistItems, stores, inventoryItems, categories] = await Promise.all([
      db.trips.orderBy('planned_for').reverse().toArray(),
      db.tripChecklist.orderBy('sort_order').toArray(),
      db.stores.toArray(),
      db.inventoryItems.toArray(),
      db.categories.toArray()
    ]);

    const storesById = stores.reduce((accumulator, store) => {
      accumulator[store.id] = store;
      return accumulator;
    }, {});

    const categoriesById = categories.reduce((accumulator, category) => {
      accumulator[category.id] = category;
      return accumulator;
    }, {});

    const inventoryItemsById = inventoryItems.reduce((accumulator, inventoryItem) => {
      accumulator[inventoryItem.id] = {
        ...inventoryItem,
        category: inventoryItem.category_id ? categoriesById[inventoryItem.category_id] || null : null
      };
      return accumulator;
    }, {});

    const checklistByTripId = checklistItems.reduce((groups, item) => {
      if (!groups[item.trip_id]) {
        groups[item.trip_id] = [];
      }

      groups[item.trip_id].push({
        ...item,
        inventory_item: item.inventory_item_id
          ? inventoryItemsById[item.inventory_item_id] || null
          : null
      });
      return groups;
    }, {});

    return trips.map((trip) => ({
      ...trip,
      items: checklistByTripId[trip.id] || [],
      store: trip.store_id ? storesById[trip.store_id] || null : null
    }));
  }, []);
  const { showSnackbar } = useAppContext();

  useEffect(() => {
    if (tripsData !== undefined) {
      setLoading(false);
    }
  }, [tripsData]);

  useEffect(() => {
    let cancelled = false;

    async function loadTrips() {
      try {
        const shouldBlockOnNetwork = tripsData === undefined;

        if (shouldBlockOnNetwork) {
          setLoading(true);
        }

        await syncTripsFromApi();

        if (cancelled) {
          return;
        }
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

  async function updateTrip(id, values) {
    const existingTrip = await db.trips.get(id);

    if (!existingTrip) {
      throw new Error('Trip not found.');
    }

    const updatedTrip = normalizeTrip({
      ...existingTrip,
      ...values,
      id: existingTrip.id
    });

    await db.trips.put(updatedTrip);
    await queueMutation('trips', 'update', updatedTrip);
    showSnackbar('Trip updated locally and queued for sync.', 'success');
    return updatedTrip;
  }

  const stats = useMemo(() => {
    const items = tripsData || [];
    const plannedTrips = items.filter((trip) => trip.status === 'planned').length;
    const completedTrips = items.filter((trip) => trip.status === 'completed').length;
    const totalBudget = items.reduce((sum, trip) => sum + trip.budget, 0);

    return {
      plannedTrips,
      completedTrips,
      totalBudget,
      totalTrips: items.length
    };
  }, [tripsData]);

  return {
    trips: tripsData || [],
    loading,
    error,
    addTrip,
    updateTrip,
    stats
  };
}
