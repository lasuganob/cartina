import { useEffect, useState } from 'react';
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

export async function processQueueIfOnline() {
  if (!navigator.onLine) {
    return;
  }

  return processQueue();
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    function syncAndUpdateStatus(nextStatus) {
      setIsOnline(nextStatus);
      if (nextStatus) {
        processQueue();
      }
    }

    function handleOnline() {
      syncAndUpdateStatus(true);
    }

    function handleOffline() {
      syncAndUpdateStatus(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.onLine) {
      processQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, syncNow: processQueue };
}
