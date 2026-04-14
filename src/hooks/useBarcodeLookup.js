import { useCallback } from 'react';
import { db } from '../lib/db';

/**
 * Hook to provide barcode lookup functionality against the local inventory.
 * @returns {{ lookup: (barcode: string) => Promise<{name: string, price: number, category: array} | null> }}
 */
export function useBarcodeLookup() {
  const lookup = useCallback(async (barcode) => {
    if (!barcode) return null;

    try {
      const item = await db.inventoryItems.where('barcode').equals(barcode).first();
      
      if (item) {
        const category = await db.categories.where('id').equals(item.category_id).first();
        return {
          name: item.name || '',
          price: item.usual_price || 0,
          category: category || {},
        };
      }
    } catch (error) {
      console.error('Error searching local barcode data:', error);
    }
    return null;
  }, []);

  return { lookup };
}
