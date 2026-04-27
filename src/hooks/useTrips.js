import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useLiveQuery } from 'dexie-react-hooks';
import { apiClient } from '../api/client';
import { clearQueuedChecklistReplaces, db, getShoppingDraftKey, getShoppingSessionKey } from '../lib/db';

import { useAppContext } from '../context/AppContext';
import { syncMutationNowOrEnqueue } from './useOfflineSync';
import { createClientId } from '../lib/ids';

let inFlightTripsSync = null;

async function getChecklistBaseUpdatedAt(tripId) {
  const pendingQueue = await db.syncQueue.where('status').anyOf(['pending', 'failed']).toArray();
  const hasPendingTripMutation = pendingQueue.some(
    (item) =>
      item.entity === 'trips' &&
      String(item.payload?.id) === String(tripId)
  );

  if (hasPendingTripMutation) {
    return '';
  }

  const trip = await db.trips.get(tripId);
  return trip?.updated_at || '';
}

function normalizeTrip(trip) {
  return {
    ...trip,
    budget: Number(trip.budget || 0),
    planned_for: trip.planned_for || dayjs().format('YYYY-MM-DD'),
    store_id: trip.store_id || '',
    note: trip.note || '',
    created_at: trip.created_at || new Date().toISOString(),
    completed_at: trip.completed_at || '',
    started_at: trip.started_at || '',
    archived_at: trip.archived_at || '',
    elapsed_ms: trip.elapsed_ms === '' || trip.elapsed_ms === null || trip.elapsed_ms === undefined
      ? ''
      : Math.max(0, Number(trip.elapsed_ms))
  };
}

function normalizeChecklistItem(item) {
  return {
    ...item,
    item_name: item.item_name || '',
    inventory_item_id: item.inventory_item_id || '',
    category_id: item.category_id || '',
    barcode: item.barcode || '',
    quantity: Math.max(1, Number(item.quantity || 1)),
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
    is_ad_hoc: item.is_ad_hoc === true || item.is_ad_hoc === 'true',
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

async function reapplyPendingMutations() {
  const queueItems = await db.syncQueue.toArray();
  const pending = queueItems
    .filter((item) => item.status !== 'synced')
    .sort((left, right) => {
      const leftTime = new Date(left.createdAt || 0).getTime();
      const rightTime = new Date(right.createdAt || 0).getTime();
      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }
      return Number(left.id || 0) - Number(right.id || 0);
    });

  for (const mutation of pending) {
    const { entity, action, payload } = mutation;
    if (!db[entity]) continue;

    if (action === 'delete') {
      await db[entity].delete(payload?.id);
      continue;
    }

    if (action === 'create' || action === 'update') {
      await db[entity].put(payload);
      continue;
    }

    if (action === 'replace' && entity === 'tripChecklist') {
      const tripId = payload.trip_id;
      await db.tripChecklist.where('trip_id').equals(tripId).delete();
      if (payload.items?.length) {
        await db.tripChecklist.bulkPut(payload.items);
      }
    }
  }
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
      db.syncQueue,
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

        await reapplyPendingMutations();
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
      const tripKey = String(item.trip_id || '');

      if (!groups[tripKey]) {
        groups[tripKey] = [];
      }

      const inventoryItem = item.inventory_item_id
        ? inventoryItemsById[String(item.inventory_item_id)] || null
        : null;

      groups[tripKey].push({
        ...item,
        inventory_item: inventoryItem,
        category: inventoryItem?.category || (item.category_id ? categoriesById[String(item.category_id)] || null : null)
      });
      return groups;
    }, {});

    return trips.map((trip) => ({
      ...trip,
      items: checklistByTripId[String(trip.id)] || [],
      store: trip.store_id ? storesById[String(trip.store_id)] || null : null
    }));
  }, []);
  const { showSnackbar, showConflict } = useAppContext();

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
      id: createClientId(),
      ...values,
      status: 'planned',
      created_at: new Date().toISOString()
    });

    await db.trips.put(trip);
    const result = await syncMutationNowOrEnqueue(
      {
        entity: 'trips',
        action: 'create',
        payload: trip
      },
      {
        preferBackground: true,
        onConflict: async (entityName, localData, remoteData) =>
          new Promise((resolve) => {
            showConflict(entityName, localData, remoteData, resolve);
          })
      }
    );

    showSnackbar(
      result.status === 'synced' ? 'Trip saved and synced.' : 'Trip saved locally and queued for sync.',
      'success'
    );

    const persistedTrip = await db.trips.get(trip.id);
    if (persistedTrip) {
      return persistedTrip;
    }

    const syncedTrip =
      (await db.trips.where('created_at').equals(trip.created_at).first()) ||
      (await db.trips
        .where('planned_for')
        .equals(trip.planned_for)
        .filter(
          (item) =>
            item.name === trip.name &&
            String(item.store_id || '') === String(trip.store_id || '') &&
            String(item.note || '') === String(trip.note || '')
        )
        .first());

    return syncedTrip || trip;
  }

  async function updateTrip(id, values, options = {}) {
    const { skipConflictBase = false } = options;
    const existingTrip = await db.trips.get(id);

    if (!existingTrip) {
      throw new Error('Trip not found.');
    }

    const updatedTrip = normalizeTrip({
      ...existingTrip,
      ...values,
      id: existingTrip.id,
      updated_at: existingTrip.updated_at
    });

    await db.trips.put(updatedTrip);
    const result = await syncMutationNowOrEnqueue(
      {
        entity: 'trips',
        action: 'update',
        payload: skipConflictBase ? { ...updatedTrip, updated_at: '' } : updatedTrip
      },
      {
        preferBackground: true,
        onConflict: async (entityName, localData, remoteData) =>
          new Promise((resolve) => {
            showConflict(entityName, localData, remoteData, resolve);
          })
      }
    );

    // If trip is completed, clear any persistent shopping session or draft from localStorage
    if (updatedTrip.status === 'completed' || updatedTrip.status === 'cancelled') {
      window.localStorage.removeItem(getShoppingDraftKey(id));
      window.localStorage.removeItem(getShoppingSessionKey(id));
    }


    showSnackbar(
      result.status === 'synced' ? 'Trip updated and synced.' : 'Trip updated locally and queued for sync.',
      'success'
    );
    return updatedTrip;
  }

  async function replaceTripChecklist(tripId, items, options = {}) {
    const { sync = true, notify = true, skipConflictBase = false } = options;

    // Fetch all inventory items once to optimize enrichment
    const inventoryItems = await db.inventoryItems.toArray();
    const inventoryMap = new Map(inventoryItems.map((inv) => [String(inv.id), inv]));
    const normalizedItems = items.map((item, index) => {
      const { draft_key, ...persistableItem } = item;
      const inventoryRef = item.inventory_item_id ? inventoryMap.get(String(item.inventory_item_id)) : null;
      const nextItemId =
        persistableItem.id === '' || persistableItem.id == null ? createClientId() : persistableItem.id;

      return normalizeChecklistItem({
        ...persistableItem,
        id: nextItemId,
        trip_id: tripId,
        item_name: persistableItem.item_name || inventoryRef?.name || persistableItem.inventory_item?.name || '',
        inventory_item_id: persistableItem.inventory_item_id || '',
        category_id: persistableItem.category_id || inventoryRef?.category_id || '',
        barcode: persistableItem.barcode || inventoryRef?.barcode || persistableItem.inventory_item?.barcode || '',
        quantity: persistableItem.quantity || 1,
        planned_price: persistableItem.planned_price,
        actual_price: persistableItem.actual_price,
        is_purchased: persistableItem.is_purchased,
        is_unplanned: persistableItem.is_unplanned,
        is_ad_hoc: persistableItem.is_ad_hoc,
        sort_order: persistableItem.sort_order ?? index,
        created_at: persistableItem.created_at || new Date().toISOString()
      });
    });

    await db.transaction('rw', db.tripChecklist, async () => {
      const existingItems = await db.tripChecklist.where('trip_id').equals(tripId).toArray();

      if (existingItems.length) {
        await db.tripChecklist.bulkDelete(existingItems.map((item) => item.id));
      }

      if (normalizedItems.length) {
        await db.tripChecklist.bulkPut(normalizedItems);
      }
    });

    await clearQueuedChecklistReplaces(tripId);

    if (sync) {
      const baseUpdatedAt = skipConflictBase ? '' : await getChecklistBaseUpdatedAt(tripId);
      const result = await syncMutationNowOrEnqueue(
        {
          entity: 'tripChecklist',
          action: 'replace',
          payload: {
            trip_id: tripId,
            items: normalizedItems,
            base_updated_at: baseUpdatedAt
          }
        },
        {
          preferBackground: true,
          onConflict: async (entityName, localData, remoteData) =>
            new Promise((resolve) => {
              showConflict(entityName, localData, remoteData, resolve);
            })
        }
      );

      if (notify) {
        showSnackbar(
          result.status === 'synced' ? 'Checklist saved and synced.' : 'Checklist saved locally.',
          'success'
        );
      }

      const latestTrip = await db.trips.get(tripId);
      return {
        items: normalizedItems,
        trip: latestTrip || null,
        status: result.status
      };
    }

    if (notify) {
      showSnackbar('Checklist changes saved on this device.', 'success');
    }
    const latestTrip = await db.trips.get(tripId);
    return {
      items: normalizedItems,
      trip: latestTrip || null,
      status: 'local'
    };
  }

  const stats = useMemo(() => {
    const allTrips = tripsData || [];
    const activeItems = allTrips.filter((trip) => !['archived', 'cancelled'].includes(trip.status));
    const plannedTrips = activeItems.filter((trip) => trip.status === 'planned').length;
    const completedTrips = activeItems.filter((trip) => trip.status === 'completed').length;
    const inProgressTrips = activeItems.filter((trip) => trip.status === 'in_progress').length;
    const totalBudget = activeItems.reduce((sum, trip) => sum + trip.budget, 0);

    const completedList = allTrips.filter((t) => t.status === 'completed');
    const totalActualSpend = completedList.reduce((sum, trip) => {
      return sum + (trip.items || []).reduce((s, i) => s + Number(i.actual_price || 0) * Number(i.quantity || 1), 0);
    }, 0);
    const totalPlannedSpend = completedList.reduce((sum, trip) => {
      return sum + (trip.items || []).reduce((s, i) => s + Number(i.planned_price || 0) * Number(i.quantity || 1), 0);
    }, 0);
    const avgBudget = activeItems.length ? totalBudget / activeItems.length : 0;

    // Most recent completed trip
    const lastCompletedTrip = completedList
      .filter((t) => t.completed_at)
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0] || null;

    // Next upcoming planned trip
    const today = dayjs();
    const nextTrip = activeItems
      .filter((t) => t.status === 'planned' && t.planned_for)
      .sort((a, b) => dayjs(a.planned_for).diff(dayjs(b.planned_for)))[0] || null;

    const thisMonthStart = dayjs().startOf('month');
    const last30DaysStart = dayjs().subtract(30, 'day');

    const thisMonthSpend = completedList
      .filter(t => t.completed_at && dayjs(t.completed_at).isAfter(thisMonthStart))
      .reduce((sum, trip) => {
        return sum + (trip.items || []).reduce((s, i) => s + Number(i.actual_price || 0) * Number(i.quantity || 1), 0);
      }, 0);

    const tripsLast30Days = allTrips
      .filter(t => t.status === 'completed' && t.completed_at && dayjs(t.completed_at).isAfter(last30DaysStart))
      .length;
    
    const avgActualSpend = completedList.length ? totalActualSpend / completedList.length : 0;
    const avgPlannedSpend = completedList.length ? totalPlannedSpend / completedList.length : 0;

    return {
      plannedTrips,
      completedTrips,
      inProgressTrips,
      totalBudget,
      totalActualSpend,
      totalPlannedSpend,
      avgBudget,
      avgActualSpend,
      avgPlannedSpend,
      thisMonthSpend,
      tripsLast30Days,
      totalTrips: activeItems.length,
      lastCompletedTrip,
      nextTrip,
      savingsVsPlan: totalPlannedSpend - totalActualSpend,
    };
  }, [tripsData]);

  return {
    trips: tripsData || [],
    loading,
    error,
    addTrip,
    updateTrip,
    replaceTripChecklist,
    stats
  };
}
