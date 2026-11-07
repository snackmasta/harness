import { HarnessProject } from '../types/harness';

const STORAGE_KEY_CURRENT = 'harness_craft_current_project';
const STORAGE_KEY_RECENTS = 'harness_craft_recent_projects';

export interface RecentProjectItem {
  id: string;
  name: string;
  wireCount: number;
  updatedAt: string;
  projectJson: string;
}

/**
 * Save current project to localStorage for crash / refresh persistence
 */
export function saveCurrentProjectToStorage(project: HarnessProject) {
  try {
    const json = JSON.stringify(project);
    localStorage.setItem(STORAGE_KEY_CURRENT, json);
    addToRecentProjects(project);
  } catch (err) {
    console.warn('Failed to save project to localStorage (may exceed quota if image is large).', err);
  }
}

/**
 * Load persisted project on app startup if available
 */
export function loadCurrentProjectFromStorage(): HarnessProject | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.wires && parsed.referenceLine) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load project from localStorage.', err);
  }
  return null;
}

/**
 * Add or update project in recent history list (max 5)
 */
export function addToRecentProjects(project: HarnessProject) {
  try {
    const recents = getRecentProjects();
    const json = JSON.stringify(project);
    const existingIndex = recents.findIndex((r) => r.name === project.name);

    const item: RecentProjectItem = {
      id: `proj_${Date.now()}`,
      name: project.name,
      wireCount: project.wires.length,
      updatedAt: new Date().toISOString(),
      projectJson: json,
    };

    let updated = [item, ...recents.filter((_, idx) => idx !== existingIndex)];
    if (updated.length > 5) {
      updated = updated.slice(0, 5);
    }
    localStorage.setItem(STORAGE_KEY_RECENTS, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to update recent projects in localStorage.', err);
  }
}

/**
 * Get recent projects list
 */
export function getRecentProjects(): RecentProjectItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to read recent projects.', err);
  }
  return [];
}

