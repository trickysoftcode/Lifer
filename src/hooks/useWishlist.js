import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import db from '../db/db';

export function useWishlist() {
  const items = useLiveQuery(
    () => db.wishlistItems.orderBy('createdAt').reverse().toArray(),
    []
  ) || [];

  const addItem = useCallback(async (data) => {
    return await db.wishlistItems.add({
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }, []);

  const updateItem = useCallback(async (id, data) => {
    return await db.wishlistItems.update(id, data);
  }, []);

  const deleteItem = useCallback(async (id) => {
    return await db.wishlistItems.delete(id);
  }, []);

  return {
    items,
    addItem,
    updateItem,
    deleteItem
  };
}
