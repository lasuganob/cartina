import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import { db, queueMutation } from '../lib/db';
import { useAppContext } from '../context/AppContext';

let inFlightQueueSync = null;

async function reconcileCreatedInventoryItem(localItem, syncedItem) {
  if (!localItem || !syncedItem) {
    return;
  }

  if (String(localItem.id) === String(syncedItem.id)) {
    await db.inventoryItems.put(syncedItem);
    return;
  }

  await db.transaction('rw', db.inventoryItems, db.tripChecklist, db.syncQueue, async () => {
    await db.inventoryItems.delete(localItem.id);
    await db.inventoryItems.put({ ...syncedItem });

    const checklistItems = await db.tripChecklist.where('inventory_item_id').equals(localItem.id).toArray();
    for (const checklistItem of checklistItems) {
      await db.tripChecklist.put({
        ...checklistItem,
        inventory_item_id: syncedItem.id
      });
    }

    const queueItems = await db.syncQueue.toArray();
    const updates = queueItems
      .filter((queueItem) => queueItem.status !== 'synced')
      .map((queueItem) => {
        let nextPayload = queueItem.payload;
        let changed = false;

        if (String(queueItem.payload?.id) === String(localItem.id)) {
          nextPayload = { ...nextPayload, id: syncedItem.id };
          changed = true;
        }

        if (String(queueItem.payload?.inventory_item_id) === String(localItem.id)) {
          nextPayload = { ...nextPayload, inventory_item_id: syncedItem.id };
          changed = true;
        }

        if (Array.isArray(queueItem.payload?.items)) {
          const nextItems = queueItem.payload.items.map((item) =>
            String(item.inventory_item_id) === String(localItem.id)
              ? { ...item, inventory_item_id: syncedItem.id }
              : item
          );

          if (
            nextItems.some(
              (item, index) =>
                String(item.inventory_item_id || '') !== String(queueItem.payload.items[index].inventory_item_id || '')
            )
          ) {
            nextPayload = { ...nextPayload, items: nextItems };
            changed = true;
          }
        }

        return changed ? { id: queueItem.id, payload: nextPayload } : null;
      })
      .filter(Boolean);

    for (const update of updates) {
      await db.syncQueue.update(update.id, { payload: update.payload });
    }
  });
}

async function reconcileUpdatedRecord(entity, syncedItem) {
  if (!syncedItem) {
    return;
  }

  if (entity === 'trips') {
    await db.trips.put(syncedItem);
    return;
  }

  if (entity === 'inventoryItems') {
    await db.inventoryItems.put(syncedItem);
    return;
  }

  if (entity === 'stores') {
    await db.stores.put(syncedItem);
    return;
  }

  if (entity === 'categories') {
    await db.categories.put(syncedItem);
  }
}

async function reconcileDeletedRecord(entity, payload) {
  if (!payload?.id) {
    return;
  }

  if (entity === 'inventoryItems') {
    await db.inventoryItems.delete(payload.id);
    return;
  }

  if (entity === 'stores') {
    await db.stores.delete(payload.id);
    return;
  }

  if (entity === 'categories') {
    await db.categories.delete(payload.id);
  }
}

async function reconcileCreatedTrip(localTrip, syncedTrip) {
  if (!localTrip || !syncedTrip) {
    return;
  }

  if (String(localTrip.id) === String(syncedTrip.id)) {
    await db.trips.put(syncedTrip);
    return;
  }

  await db.transaction('rw', db.trips, db.tripChecklist, db.syncQueue, async () => {
    await db.trips.delete(localTrip.id);
    await db.trips.put({ ...syncedTrip });

    const checklistItems = await db.tripChecklist.where('trip_id').equals(localTrip.id).toArray();
    if (checklistItems.length) {
      await db.tripChecklist.bulkDelete(checklistItems.map((item) => item.id));
      await db.tripChecklist.bulkPut(
        checklistItems.map((item) => ({
          ...item,
          trip_id: syncedTrip.id
        }))
      );
    }

    const queueItems = await db.syncQueue.toArray();
    const updates = queueItems
      .filter((queueItem) => queueItem.status !== 'synced')
      .map((queueItem) => {
        let nextPayload = queueItem.payload;
        let changed = false;

        if (String(queueItem.payload?.id) === String(localTrip.id)) {
          nextPayload = { ...nextPayload, id: syncedTrip.id };
          changed = true;
        }

        if (String(queueItem.payload?.trip_id) === String(localTrip.id)) {
          nextPayload = { ...nextPayload, trip_id: syncedTrip.id };
          changed = true;
        }

        if (Array.isArray(queueItem.payload?.items)) {
          const nextItems = queueItem.payload.items.map((item) =>
            String(item.trip_id) === String(localTrip.id)
              ? { ...item, trip_id: syncedTrip.id }
              : item
          );

          if (
            nextItems.some((item, index) => String(item.trip_id) !== String(queueItem.payload.items[index].trip_id))
          ) {
            nextPayload = { ...nextPayload, items: nextItems };
            changed = true;
          }
        }

        return changed ? { id: queueItem.id, payload: nextPayload } : null;
      })
      .filter(Boolean);

    for (const update of updates) {
      await db.syncQueue.update(update.id, { payload: update.payload });
    }
  });
}

async function reconcileReplacedChecklist(tripId, localItems, syncedItems) {
  if (!tripId || !Array.isArray(syncedItems)) {
    return;
  }

  await db.transaction('rw', db.tripChecklist, db.syncQueue, async () => {
    const existingItems = await db.tripChecklist.where('trip_id').equals(tripId).toArray();

    if (existingItems.length) {
      await db.tripChecklist.bulkDelete(existingItems.map((item) => item.id));
    }

    if (syncedItems.length) {
      await db.tripChecklist.bulkPut(
        syncedItems.map((item) => ({
          ...item,
          trip_id: tripId
        }))
      );
    }

    const queueItems = await db.syncQueue.toArray();
    const updates = queueItems
      .filter((queueItem) => queueItem.status !== 'synced' && String(queueItem.payload?.trip_id) === String(tripId))
      .map((queueItem) => {
        if (!Array.isArray(queueItem.payload?.items)) {
          return null;
        }

        const nextItems = queueItem.payload.items.map((item, index) => ({
          ...item,
          id: syncedItems[index]?.id ?? item.id,
          trip_id: tripId
        }));

        return {
          id: queueItem.id,
          payload: {
            ...queueItem.payload,
            items: nextItems
          }
        };
      })
      .filter(Boolean);

    for (const update of updates) {
      await db.syncQueue.update(update.id, { payload: update.payload });
    }
  });
}

async function reconcileCreatedStore(localItem, syncedItem) {
  if (!localItem || !syncedItem) {
    return;
  }

  if (String(localItem.id) === String(syncedItem.id)) {
    await db.stores.put(syncedItem);
    return;
  }

  await db.transaction('rw', db.stores, db.trips, db.syncQueue, async () => {
    await db.stores.delete(localItem.id);
    await db.stores.put({ ...syncedItem });
    await db.trips.where('store_id').equals(localItem.id).modify({ store_id: syncedItem.id });

    const queueItems = await db.syncQueue.toArray();
    const updates = queueItems
      .filter((queueItem) => queueItem.status !== 'synced')
      .map((queueItem) => {
        let nextPayload = queueItem.payload;
        let changed = false;

        if (String(queueItem.payload?.id) === String(localItem.id)) {
          nextPayload = { ...nextPayload, id: syncedItem.id };
          changed = true;
        }

        if (String(queueItem.payload?.store_id) === String(localItem.id)) {
          nextPayload = { ...nextPayload, store_id: syncedItem.id };
          changed = true;
        }

        return changed ? { id: queueItem.id, payload: nextPayload } : null;
      })
      .filter(Boolean);

    for (const update of updates) {
      await db.syncQueue.update(update.id, { payload: update.payload });
    }
  });
}

async function reconcileCreatedCategory(localItem, syncedItem) {
  if (!localItem || !syncedItem) {
    return;
  }

  if (String(localItem.id) === String(syncedItem.id)) {
    await db.categories.put(syncedItem);
    return;
  }

  await db.transaction('rw', db.categories, db.inventoryItems, db.syncQueue, async () => {
    await db.categories.delete(localItem.id);
    await db.categories.put({ ...syncedItem });
    await db.inventoryItems.where('category_id').equals(localItem.id).modify({ category_id: syncedItem.id });

    const queueItems = await db.syncQueue.toArray();
    const updates = queueItems
      .filter((queueItem) => queueItem.status !== 'synced')
      .map((queueItem) => {
        let nextPayload = queueItem.payload;
        let changed = false;

        if (String(queueItem.payload?.id) === String(localItem.id)) {
          nextPayload = { ...nextPayload, id: syncedItem.id };
          changed = true;
        }

        if (String(queueItem.payload?.category_id) === String(localItem.id)) {
          nextPayload = { ...nextPayload, category_id: syncedItem.id };
          changed = true;
        }

        return changed ? { id: queueItem.id, payload: nextPayload } : null;
      })
      .filter(Boolean);

    for (const update of updates) {
      await db.syncQueue.update(update.id, { payload: update.payload });
    }
  });
}

async function applyRemoteRecord(entity, remoteData) {
  if (!remoteData) {
    return;
  }

  if (entity === 'trips') {
    await db.trips.put(remoteData);
    return;
  }

  if (entity === 'inventoryItems') {
    await db.inventoryItems.put(remoteData);
    return;
  }

  if (entity === 'stores') {
    await db.stores.put(remoteData);
    return;
  }

  if (entity === 'categories') {
    await db.categories.put(remoteData);
  }
}

async function updateLocalBaseVersion(item, remoteData) {
  if (!remoteData?.updated_at) {
    return;
  }

  if (item.entity === 'tripChecklist') {
    const trip = await db.trips.get(item.payload?.trip_id);
    if (trip) {
      await db.trips.put({ ...trip, updated_at: remoteData.updated_at });
    }
    return;
  }

  const nextRecord = { ...item.payload, updated_at: remoteData.updated_at };
  await reconcileUpdatedRecord(item.entity, nextRecord);
}

function buildConflictRetryPayload(item, remoteData) {
  if (item.entity === 'tripChecklist') {
    return {
      ...item.payload,
      base_updated_at: remoteData?.updated_at || item.payload?.base_updated_at || ''
    };
  }

  return { ...item.payload, updated_at: remoteData?.updated_at || item.payload?.updated_at || '' };
}

async function executeRemoteMutation(item) {
  if (item.entity === 'trips' && item.action === 'create') {
    const response = await apiClient.createTrip(item.payload);
    if (!response?.conflict) {
      await reconcileCreatedTrip(item.payload, response.item);
    }
    return response;
  }

  if (item.entity === 'trips' && item.action === 'update') {
    const response = await apiClient.updateTrip(item.payload);
    if (!response?.conflict) {
      await reconcileUpdatedRecord('trips', response.item);
    }
    return response;
  }

  if (item.entity === 'tripChecklist' && item.action === 'replace') {
    const response = await apiClient.replaceTripChecklist(item.payload);
    if (response && !response.conflict) {
      await reconcileReplacedChecklist(item.payload.trip_id, item.payload.items, response.items);
      if (response.trip) {
        await reconcileUpdatedRecord('trips', response.trip);
      }
    }
    return response;
  }

  if (item.entity === 'inventoryItems' && item.action === 'create') {
    const response = await apiClient.createInventoryItem(item.payload);
    if (!response?.conflict) {
      await reconcileCreatedInventoryItem(item.payload, response.item);
    }
    return response;
  }

  if (item.entity === 'inventoryItems' && item.action === 'update') {
    const response = await apiClient.updateInventoryItem(item.payload);
    if (!response?.conflict) {
      await reconcileUpdatedRecord('inventoryItems', response.item);
    }
    return response;
  }

  if (item.entity === 'inventoryItems' && item.action === 'delete') {
    const response = await apiClient.deleteInventoryItem(item.payload);
    if (!response?.conflict) {
      await reconcileDeletedRecord('inventoryItems', item.payload);
    }
    return response;
  }

  if (item.entity === 'stores' && item.action === 'create') {
    const response = await apiClient.createStore(item.payload);
    if (!response?.conflict) {
      await reconcileCreatedStore(item.payload, response.item);
    }
    return response;
  }

  if (item.entity === 'stores' && item.action === 'update') {
    const response = await apiClient.updateStore(item.payload);
    if (!response?.conflict) {
      await reconcileUpdatedRecord('stores', response.item);
    }
    return response;
  }

  if (item.entity === 'stores' && item.action === 'delete') {
    const response = await apiClient.deleteStore(item.payload);
    if (!response?.conflict) {
      await reconcileDeletedRecord('stores', item.payload);
    }
    return response;
  }

  if (item.entity === 'categories' && item.action === 'create') {
    const response = await apiClient.createCategory(item.payload);
    if (!response?.conflict) {
      await reconcileCreatedCategory(item.payload, response.item);
    }
    return response;
  }

  if (item.entity === 'categories' && item.action === 'update') {
    const response = await apiClient.updateCategory(item.payload);
    if (!response?.conflict) {
      await reconcileUpdatedRecord('categories', response.item);
    }
    return response;
  }

  if (item.entity === 'categories' && item.action === 'delete') {
    const response = await apiClient.deleteCategory(item.payload);
    if (!response?.conflict) {
      await reconcileDeletedRecord('categories', item.payload);
    }
    return response;
  }

  throw new Error(`Unsupported mutation: ${item.entity}/${item.action}`);
}

function isConnectivityError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return (
    message.includes('could not reach google apps script') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed')
  );
}

async function resolveConflictResponse(item, response, onConflict) {
  if (!response?.conflict) {
    return { status: 'synced', response };
  }

  if (!onConflict) {
    throw new Error(response.message || 'Sync conflict detected.');
  }

  const remoteData = response.remote_trip || response.remote_item;
  const choice = await onConflict(item.entity, item.payload, remoteData);

  if (choice === 'remote') {
    if (item.entity === 'tripChecklist') {
      await pullAndMerge();
      return { status: 'synced', response };
    }

    await applyRemoteRecord(item.entity, remoteData);
    return { status: 'synced', response };
  }

  const nextPayload = buildConflictRetryPayload(item, remoteData);
  await updateLocalBaseVersion(item, remoteData);
  await queueMutation(item.entity, item.action, nextPayload);
  return { status: 'queued', response };
}

export async function syncMutationNowOrEnqueue(item, options = {}) {
  const { onConflict } = options;

  if (!navigator.onLine) {
    await queueMutation(item.entity, item.action, item.payload);
    return { status: 'queued' };
  }

  try {
    const response = await executeRemoteMutation(item);
    return await resolveConflictResponse(item, response, onConflict);
  } catch (error) {
    if (isConnectivityError(error)) {
      await queueMutation(item.entity, item.action, item.payload);
      return { status: 'queued', error };
    }

    throw error;
  }
}

export async function processQueue(options = {}) {
  const { onConflict } = options;
  if (inFlightQueueSync) {
    return inFlightQueueSync;
  }

  inFlightQueueSync = (async () => {
    const pendingItems = await db.syncQueue.where('status').anyOf(['pending', 'failed']).toArray();

    for (const item of pendingItems) {
      try {
        await db.syncQueue.update(item.id, { status: 'pending', error: null });
        const response = await executeRemoteMutation(item);

        if (response && response.conflict && onConflict) {
          const remoteData = response.remote_trip || response.remote_item;
          const choice = await onConflict(item.entity, item.payload, remoteData);
          
          if (choice === 'remote') {
            if (item.entity === 'tripChecklist') {
              await pullAndMerge();
            } else {
              await applyRemoteRecord(item.entity, remoteData);
            }
            await db.syncQueue.update(item.id, { status: 'synced' });
            continue;
          } else {
            const nextPayload = buildConflictRetryPayload(item, remoteData);
            await updateLocalBaseVersion(item, remoteData);
            await db.syncQueue.update(item.id, { payload: nextPayload, status: 'failed' });
            continue;
          }
        }

        await db.syncQueue.update(item.id, { status: 'synced' });
      } catch (error) {
        await db.syncQueue.update(item.id, { status: 'failed', error: error.message });
      }
    }
  })().finally(() => {
    inFlightQueueSync = null;
  });

  return inFlightQueueSync;
}

/**
 * Pulls all canonical data from Google Sheets and merges it into the local
 * IndexedDB. Items that have pending/failed queue entries are NOT overwritten
 * (local wins). Everything else is updated from remote (remote wins).
 */
async function pullAndMerge() {
  const [tripsRes, inventoryRes, storesRes, categoriesRes] = await Promise.all([
    apiClient.getTrips(),
    apiClient.getInventoryItems(),
    apiClient.getStores(),
    apiClient.getCategories(),
  ]);

  const needsFullPull = localStorage.getItem('cartina:needs_full_pull') === 'true';

  // Collect IDs of locally-pending items — these must NOT be overwritten
  const pendingQueue = await db.syncQueue
    .where('status').anyOf(['pending', 'failed'])
    .toArray();

  const pendingIds = {
    trips: new Set(pendingQueue.filter(q => q.entity === 'trips').map(q => String(q.payload?.id))),
    inventoryItems: new Set(pendingQueue.filter(q => q.entity === 'inventoryItems').map(q => String(q.payload?.id))),
    stores: new Set(pendingQueue.filter(q => q.entity === 'stores').map(q => String(q.payload?.id))),
    categories: new Set(pendingQueue.filter(q => q.entity === 'categories').map(q => String(q.payload?.id))),
  };

  const safeItems = (items, pendingSet) =>
    (items || []).filter(item => !pendingSet.has(String(item.id)));

  await db.transaction('rw', db.trips, db.inventoryItems, db.stores, db.categories, db.tripChecklist, async () => {
    // 1. Handle Trips
    if (tripsRes?.items) {
      if (needsFullPull) await db.trips.clear();
      await db.trips.bulkPut(safeItems(tripsRes.items, pendingIds.trips));
    }

    // 2. Handle Trip Checklist (Essential fix!)
    if (tripsRes?.trip_checklist) {
      const remoteChecklist = tripsRes.trip_checklist;
      
      if (needsFullPull) {
        await db.tripChecklist.clear();
        await db.tripChecklist.bulkPut(remoteChecklist);
      } else {
        // Only update checklist items for trips that don't have pending changes
        const pendingTripChecklistIds = new Set(
          pendingQueue.filter(q => q.entity === 'tripChecklist').map(q => String(q.payload?.trip_id))
        );

        const remoteGroups = remoteChecklist.reduce((acc, item) => {
          acc[item.trip_id] = acc[item.trip_id] || [];
          acc[item.trip_id].push(item);
          return acc;
        }, {});

        for (const [tripId, items] of Object.entries(remoteGroups)) {
          if (!pendingTripChecklistIds.has(String(tripId))) {
            await db.tripChecklist.where('trip_id').equals(Number(tripId)).delete();
            await db.tripChecklist.bulkPut(items);
          }
        }
      }
    }

    // 3. Handle Inventory Items
    if (inventoryRes?.items) {
      if (needsFullPull) await db.inventoryItems.clear();
      await db.inventoryItems.bulkPut(safeItems(inventoryRes.items, pendingIds.inventoryItems));
    }

    // 4. Handle Stores
    if (storesRes?.items) {
      if (needsFullPull) await db.stores.clear();
      await db.stores.bulkPut(safeItems(storesRes.items, pendingIds.stores));
    }

    // 5. Handle Categories
    if (categoriesRes?.items) {
      if (needsFullPull) await db.categories.clear();
      await db.categories.bulkPut(safeItems(categoriesRes.items, pendingIds.categories));
    }

    // Clear the full pull flag after successful transaction
    if (needsFullPull) {
      localStorage.removeItem('cartina:needs_full_pull');
    }
  });
}

/**
 * Full bidirectional sync:
 *   1. Push all pending local changes to Google Sheets
 *   2. Pull canonical data from Google Sheets and merge locally
 */
export async function syncBidirectional(options = {}) {
  await processQueue(options);
  await pullAndMerge();
}

/**
 * Reads the pending sync queue count from IndexedDB.
 */
export async function getPendingCount() {
  return db.syncQueue.where('status').anyOf(['pending', 'failed']).count();
}

const LAST_SYNCED_KEY = 'cartina:lastSynced';

export function useOfflineSync() {
  const { showConflict } = useAppContext() || {};
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(() => localStorage.getItem(LAST_SYNCED_KEY));
  const [pendingCount, setPendingCount] = useState(0);
  const [syncError, setSyncError] = useState(null);

  // Keep pendingCount live by polling IndexedDB
  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const count = await getPendingCount();
      if (!cancelled) setPendingCount(count);
    }

    refresh();
    const interval = setInterval(refresh, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleOnline() { setIsOnline(true); }
    function handleOffline() { setIsOnline(false); }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncNow = useCallback(async (options = {}) => {
    const { suppressErrors = false } = options;
    if (isSyncing) return;
    setSyncError(null);
    setIsSyncing(true);
    try {
      await syncBidirectional({
        onConflict: async (entityName, localData, remoteData) => {
          return new Promise((resolve) => {
             showConflict(entityName, localData, remoteData, (choice) => {
                resolve(choice);
             });
          });
        }
      });
      const ts = new Date().toISOString();
      localStorage.setItem(LAST_SYNCED_KEY, ts);
      setLastSynced(ts);
      // Refresh pending count after sync
      const count = await getPendingCount();
      setPendingCount(count);
    } catch (error) {
      setSyncError(error.message || 'Sync failed');
      if (!suppressErrors) {
        throw error;
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, showConflict]);

  useEffect(() => {
    if (!isOnline || isSyncing || pendingCount === 0) {
      return;
    }

    void syncNow({ suppressErrors: true });
  }, [isOnline, isSyncing, pendingCount, syncNow]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        void syncNow({ suppressErrors: true });
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncNow]);

  return { isOnline, isSyncing, lastSynced, pendingCount, syncError, syncNow };
}
