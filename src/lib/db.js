import Dexie from 'dexie';

export const db = new Dexie('tinablesGroceryDb');

db.version(1).stores({
  trips: 'id, status, planned_for, created_at, completed_at, store_id',
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
