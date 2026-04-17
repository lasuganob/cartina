import Dexie from 'dexie';

export const db = new Dexie('tinablesGroceryDb');

db.version(1).stores({
  trips: 'id, status, planned_for, created_at, completed_at, store_id',
  syncQueue: '++id, entity, action, status, createdAt',
  transactions: 'id, tripId, createdAt'
});

db.version(3).stores({
  trips: 'id, status, planned_for, created_at, completed_at, store_id',
  tripChecklist: 'id, trip_id, inventory_item_id, barcode, is_purchased, is_unplanned, sort_order, created_at',
  inventoryItems: 'id, category_id, barcode, created_at',
  stores: 'id, name',
  categories: 'id, name',
  syncQueue: '++id, entity, action, status, createdAt',
  transactions: 'id, tripId, createdAt'
});

db.version(4).stores({
  trips: 'id, status, planned_for, created_at, completed_at, store_id',
  tripChecklist: 'id, trip_id, inventory_item_id, barcode, is_purchased, is_unplanned, sort_order, created_at',
  inventoryItems: 'id, category_id, barcode, created_at',
  stores: 'id, name',
  categories: 'id, name',
  syncQueue: '++id, entity, action, status, createdAt',
  transactions: 'id, tripId, createdAt'
});

export async function queueMutation(entity, action, payload) {
  return db.syncQueue.add({
    entity,
    action,
    payload,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
}

export async function clearQueuedChecklistReplaces(tripId) {
  const queueItems = await db.syncQueue.toArray();
  const matchingIds = queueItems
    .filter(
      (item) =>
        item.entity === 'tripChecklist' &&
        item.action === 'replace' &&
        String(item.payload?.trip_id) === String(tripId)
    )
    .map((item) => item.id);

  if (matchingIds.length) {
    await db.syncQueue.bulkDelete(matchingIds);
  }
}

export function isMissingObjectStoreError(error) {
  const message = String(error?.message || error || '');
  return (
    error?.name === 'NotFoundError' ||
    message.includes("Failed to execute 'objectStore' on 'IDBTransaction'") ||
    message.includes('The specified object store was not found')
  );
}

export function getShoppingDraftKey(tripId) {
  return `trip-shopping-draft:${tripId}`;
}

export function getShoppingSessionKey(tripId) {
  return `trip-shopping-session:${tripId}`;
}

