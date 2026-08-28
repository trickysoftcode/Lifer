import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import db from '../db/db';

export const MEDIA_TYPES = [
  { value: 'book', label: 'Books', emoji: '📚' },
  { value: 'movie', label: 'Movies', emoji: '🎬' },
  { value: 'show', label: 'Shows', emoji: '📺' },
  { value: 'podcast', label: 'Podcasts', emoji: '🎙️' },
  { value: 'game', label: 'Games', emoji: '🎮' },
];

export const MEDIA_STATUS = {
  book: [
    { value: 'reading', label: 'Currently Reading' },
    { value: 'to-read', label: 'To Read' },
    { value: 'completed', label: 'Completed' },
    { value: 'dropped', label: 'Dropped' },
  ],
  movie: [
    { value: 'to-watch', label: 'To Watch' },
    { value: 'completed', label: 'Watched' },
  ],
  show: [
    { value: 'watching', label: 'Currently Watching' },
    { value: 'to-watch', label: 'To Watch' },
    { value: 'completed', label: 'Completed' },
    { value: 'dropped', label: 'Dropped' },
  ],
  podcast: [
    { value: 'listening', label: 'Listening' },
    { value: 'to-listen', label: 'To Listen' },
    { value: 'completed', label: 'Completed' },
  ],
  anime: [
    { value: 'watching', label: 'Currently Watching' },
    { value: 'to-watch', label: 'To Watch' },
    { value: 'completed', label: 'Completed' },
    { value: 'dropped', label: 'Dropped' },
  ],
  game: [
    { value: 'playing', label: 'Currently Playing' },
    { value: 'to-play', label: 'To Play' },
    { value: 'completed', label: 'Completed' },
    { value: 'dropped', label: 'Dropped' },
  ],
};

export function useMedia() {
  const allMedia = useLiveQuery(
    () => db.media.orderBy('updatedAt').reverse().toArray(),
    []
  ) || [];

  const getByType = (type) => allMedia.filter(m => m.mediaType === type);
  const getByStatus = (type, status) => allMedia.filter(m => m.mediaType === type && m.status === status);

  const addMedia = useCallback(async ({ title, mediaType, status, rating, notes, author, genre }) => {
    await db.media.add({
      title,
      mediaType,
      status: status || 'to-read',
      rating: rating || null,
      notes: notes || '',
      author: author || '',
      genre: genre || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const updateMedia = useCallback(async (id, data) => {
    await db.media.update(id, { ...data, updatedAt: new Date().toISOString() });
  }, []);

  const deleteMedia = useCallback(async (id) => {
    await db.media.delete(id);
  }, []);

  // Stats
  const stats = MEDIA_TYPES.reduce((acc, type) => {
    const items = getByType(type.value);
    const activeStatuses = ['reading', 'watching', 'listening', 'playing'];
    acc[type.value] = {
      total: items.length,
      active: items.filter(m => activeStatuses.includes(m.status)).length,
      completed: items.filter(m => m.status === 'completed').length,
    };
    return acc;
  }, {});

  return { allMedia, getByType, getByStatus, addMedia, updateMedia, deleteMedia, stats };
}
