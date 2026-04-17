import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import { db } from '../lib/db';

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

export async function processQueue() {
  if (inFlightQueueSync) {
    return inFlightQueueSync;
  }

  inFlightQueueSync = (async () => {
    const pendingItems = await db.syncQueue.where('status').equals('pending').toArray();

    for (const item of pendingItems) {
      try {
        if (item.entity === 'trips' && item.action === 'create') {
          const response = await apiClient.createTrip(item.payload);
          await reconcileCreatedTrip(item.payload, response.item);
        }

        if (item.entity === 'trips' && item.action === 'update') {
          await apiClient.updateTrip(item.payload);
        }

        if (item.entity === 'tripChecklist' && item.action === 'replace') {
          const response = await apiClient.replaceTripChecklist(item.payload);
          await reconcileReplacedChecklist(item.payload.trip_id, item.payload.items, response.items);
        }

        if (item.entity === 'inventoryItems' && item.action === 'create') {
          const response = await apiClient.createInventoryItem(item.payload);
          await reconcileCreatedInventoryItem(item.payload, response.item);
        }

        if (item.entity === 'inventoryItems' && item.action === 'update') {
          await apiClient.updateInventoryItem(item.payload);
        }

        if (item.entity === 'inventoryItems' && item.action === 'delete') {
          await apiClient.deleteInventoryItem(item.payload);
        }

        // Stores
        if (item.entity === 'stores' && item.action === 'create') {
          const response = await apiClient.createStore(item.payload);
          if (response.item?.id && String(response.item.id) !== String(item.payload.id)) {
             await db.transaction('rw', db.stores, db.trips, async () => {
               await db.stores.delete(item.payload.id);
               await db.stores.put(response.item);
               await db.trips.where('store_id').equals(item.payload.id).modify({ store_id: response.item.id });
             });
          }
        }
        if (item.entity === 'stores' && item.action === 'update') {
          await apiClient.updateStore(item.payload);
        }
        if (item.entity === 'stores' && item.action === 'delete') {
          await apiClient.deleteStore(item.payload);
        }

        // Categories
        if (item.entity === 'categories' && item.action === 'create') {
          const response = await apiClient.createCategory(item.payload);
          if (response.item?.id && String(response.item.id) !== String(item.payload.id)) {
            await db.transaction('rw', db.categories, db.inventoryItems, async () => {
              await db.categories.delete(item.payload.id);
              await db.categories.put(response.item);
              await db.inventoryItems.where('category_id').equals(item.payload.id).modify({ category_id: response.item.id });
            });
          }
        }
        if (item.entity === 'categories' && item.action === 'update') {
          await apiClient.updateCategory(item.payload);
        }
        if (item.entity === 'categories' && item.action === 'delete') {
          await apiClient.deleteCategory(item.payload);
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

  await db.transaction('rw', db.trips, db.inventoryItems, db.stores, db.categories, async () => {
    if (tripsRes?.items) {
      await db.trips.bulkPut(safeItems(tripsRes.items, pendingIds.trips));
    }
    if (inventoryRes?.items) {
      await db.inventoryItems.bulkPut(safeItems(inventoryRes.items, pendingIds.inventoryItems));
    }
    if (storesRes?.items) {
      await db.stores.bulkPut(safeItems(storesRes.items, pendingIds.stores));
    }
    if (categoriesRes?.items) {
      await db.categories.bulkPut(safeItems(categoriesRes.items, pendingIds.categories));
    }
  });
}

/**
 * Full bidirectional sync:
 *   1. Push all pending local changes to Google Sheets
 *   2. Pull canonical data from Google Sheets and merge locally
 */
export async function syncBidirectional() {
  await processQueue();
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

  // Track online/offline status only — no auto-sync
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

  const syncNow = useCallback(async () => {
    if (isSyncing) return;
    setSyncError(null);
    setIsSyncing(true);
    try {
      await syncBidirectional();
      const ts = new Date().toISOString();
      localStorage.setItem(LAST_SYNCED_KEY, ts);
      setLastSynced(ts);
      // Refresh pending count after sync
      const count = await getPendingCount();
      setPendingCount(count);
    } catch (error) {
      setSyncError(error.message || 'Sync failed');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  return { isOnline, isSyncing, lastSynced, pendingCount, syncError, syncNow };
}
