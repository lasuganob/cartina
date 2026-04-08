import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { db } from '../lib/db';

async function processQueue() {
  const pendingItems = await db.syncQueue.where('status').equals('pending').toArray();

  for (const item of pendingItems) {
    try {
      if (item.entity === 'trips' && item.action === 'create') {
        await apiClient.createTrip(item.payload);
      }

      await db.syncQueue.update(item.id, { status: 'synced' });
    } catch (error) {
      await db.syncQueue.update(item.id, { status: 'failed', error: error.message });
    }
  }
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
