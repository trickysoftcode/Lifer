import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import db from '../db/db';

const PROJECT_COLORS = [
  '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#6366f1',
];

const PROJECT_ICONS = ['📁', '🚀', '💡', '🎯', '⚡', '🔬', '🎨', '📊', '🛠️', '📱'];

export function useProjects() {
  const projects = useLiveQuery(
    () => db.projects.orderBy('createdAt').reverse().toArray(),
    []
  ) || [];

  const addProject = useCallback(async ({ title, description }) => {
    const colorIdx = Math.floor(Math.random() * PROJECT_COLORS.length);
    const iconIdx = Math.floor(Math.random() * PROJECT_ICONS.length);
    const id = await db.projects.add({
      title,
      description: description || '',
      color: PROJECT_COLORS[colorIdx],
      icon: PROJECT_ICONS[iconIdx],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create a default "Overview" page
    await db.projectPages.add({
      projectId: id,
      title: 'Overview',
      content: JSON.stringify([
        { type: 'heading', props: { level: 2 }, content: [{ type: 'text', text: title }] },
        { type: 'paragraph', content: [{ type: 'text', text: description || 'Start writing here...' }] },
      ]),
      parentId: null,
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return id;
  }, []);

  const updateProject = useCallback(async (id, data) => {
    await db.projects.update(id, { ...data, updatedAt: new Date().toISOString() });
  }, []);

  const deleteProject = useCallback(async (id) => {
    await db.transaction('rw', db.projects, db.projectPages, async () => {
      await db.projectPages.where('projectId').equals(id).delete();
      await db.projects.delete(id);
    });
  }, []);

  return { projects, addProject, updateProject, deleteProject, PROJECT_COLORS, PROJECT_ICONS };
}

export function useProjectPages(projectId) {
  const numericId = Number(projectId);
  const pages = useLiveQuery(
    () => projectId ? db.projectPages.where('projectId').equals(numericId).sortBy('order') : [],
    [numericId]
  ) || [];

  const addPage = useCallback(async (title, parentId = null) => {
    const maxOrder = pages.length > 0 ? Math.max(...pages.map(p => p.order || 0)) : 0;
    return await db.projectPages.add({
      projectId: numericId,
      title,
      content: '',
      parentId,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }, [numericId, pages]);

  const updatePage = useCallback(async (id, data) => {
    await db.projectPages.update(id, { ...data, updatedAt: new Date().toISOString() });
  }, []);

  const deletePage = useCallback(async (id) => {
    await db.projectPages.delete(id);
  }, []);

  return { pages, addPage, updatePage, deletePage };
}
