// src/state/persistence.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { appState$, TaskWithMeta } from './tasks';

// Enhanced database schema with metadata tracking
interface TaskBuddyDB extends DBSchema {
  tasks: {
    key: string;
    value: TaskWithMeta;
  };
  metadata: {
    key: string;
    value: {
      id: string;
      lastSync: string;
      version: string;
      deviceId: string;
    };
  };
  conflicts: {
    key: string;
    value: {
      id: string;
      local: TaskWithMeta;
      remote: TaskWithMeta;
      timestamp: string;
      resolved: boolean;
    };
  };
}

class PersistenceManager {
  private db: IDBPDatabase<TaskBuddyDB> | null = null;
  private readonly deviceId: string;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('taskbuddy-device-id');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('taskbuddy-device-id', deviceId);
    }
    return deviceId;
  }

  async initialize(): Promise<void> {
    this.db = await openDB<TaskBuddyDB>('TaskBuddyDB', 3, {
      upgrade(db, oldVersion, newVersion) {
        console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);

        // Tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }

        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'id' });
        }

        // Conflicts store for resolution tracking
        if (!db.objectStoreNames.contains('conflicts')) {
          db.createObjectStore('conflicts', { keyPath: 'id' });
        }
      },
    });

    // Initialize metadata
    await this.initializeMetadata();
  }

  private async initializeMetadata(): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction('metadata', 'readwrite');
    const existing = await tx.store.get('app-metadata');
    
    if (!existing) {
      await tx.store.put({
        id: 'app-metadata',
        lastSync: new Date().toISOString(),
        version: '1.0.0',
        deviceId: this.deviceId,
      });
    }
    await tx.done;
  }

  // Save task with conflict detection
  async saveTask(task: TaskWithMeta): Promise<{ success: boolean; conflict?: TaskWithMeta }> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction('tasks', 'readwrite');
    const existing = await tx.store.get(task.id);

    // Check for conflicts (same task modified by different source)
    if (existing && existing._meta.version >= task._meta.version && existing._meta.lastModified > task._meta.lastModified) {
      // Conflict detected - store in conflicts table
      await this.storeConflict(task.id, task, existing);
      return { success: false, conflict: existing };
    }

    await tx.store.put(task);
    await tx.done;
    return { success: true };
  }

  private async storeConflict(taskId: string, local: TaskWithMeta, remote: TaskWithMeta): Promise<void> {
    if (!this.db) return;

    const conflictId = `conflict-${taskId}-${Date.now()}`;
    const tx = this.db.transaction('conflicts', 'readwrite');
    await tx.store.put({
      id: conflictId,
      local,
      remote,
      timestamp: new Date().toISOString(),
      resolved: false,
    });
    await tx.done;
  }

  // Load all tasks from IndexedDB
  async loadTasks(): Promise<TaskWithMeta[]> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction('tasks', 'readonly');
    const tasks = await tx.store.getAll();
    return tasks.filter(task => !task._meta.isDeleted);
  }

  // Get tasks that need sync
  async getPendingSyncTasks(): Promise<TaskWithMeta[]> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction('tasks', 'readonly');
    const allTasks = await tx.store.getAll();
    return allTasks.filter(task => task._meta.isDirty && !task._meta.isDeleted);
  }

  // Bulk operations for sync
  async bulkSaveTasks(tasks: TaskWithMeta[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction('tasks', 'readwrite');
    await Promise.all(tasks.map(task => tx.store.put(task)));
    await tx.done;
  }

  // Get unresolved conflicts
  async getConflicts(): Promise<TaskBuddyDB['conflicts']['value'][]> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction('conflicts', 'readonly');
    const conflicts = await tx.store.getAll();
    return conflicts.filter(conflict => !conflict.resolved);
  }

  // Mark conflict as resolved
  async resolveConflict(conflictId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction('conflicts', 'readwrite');
    const conflict = await tx.store.get(conflictId);
    if (conflict) {
      conflict.resolved = true;
      await tx.store.put(conflict);
    }
    await tx.done;
  }

  // Update last sync timestamp
  async updateLastSync(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction('metadata', 'readwrite');
    const metadata = await tx.store.get('app-metadata');
    if (metadata) {
      metadata.lastSync = new Date().toISOString();
      await tx.store.put(metadata);
    }
    await tx.done;
  }

  // Cleanup old data
  async cleanup(): Promise<void> {
    if (!this.db) return;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Remove old resolved conflicts
    const conflictsTx = this.db.transaction('conflicts', 'readwrite');
    const oldConflicts = await conflictsTx.store.getAll();
    const toDelete = oldConflicts.filter(c => c.resolved && c.timestamp < thirtyDaysAgo);
    await Promise.all(toDelete.map(c => conflictsTx.store.delete(c.id)));
    await conflictsTx.done;

    // Remove soft-deleted tasks older than 30 days
    const tasksTx = this.db.transaction('tasks', 'readwrite');
    const allTasks = await tasksTx.store.getAll();
    const oldDeleted = allTasks.filter(t => t._meta.isDeleted && t._meta.lastModified < thirtyDaysAgo);
    await Promise.all(oldDeleted.map(t => tasksTx.store.delete(t.id)));
    await tasksTx.done;
  }
}

// Create singleton instance
export const persistenceManager = new PersistenceManager();

// Enhanced persistence configuration for Legend State
export const configurePersistence = async () => {
  await persistenceManager.initialize();

  // Load existing data from IndexedDB
  try {
    const savedTasks = await persistenceManager.loadTasks();
    if (savedTasks.length > 0) {
      const byId: Record<string, TaskWithMeta> = {};
      const allIds: string[] = [];
      
      savedTasks.forEach(task => {
        byId[task.id] = task;
        allIds.push(task.id);
      });
      
      appState$.tasks.byId.set(byId);
      appState$.tasks.allIds.set(allIds);
    }
  } catch (error) {
    console.error('Error loading tasks from IndexedDB:', error);
  }

  // Auto-save on state changes with debouncing
  let saveTimeout: NodeJS.Timeout;
  appState$.tasks.byId.onChange(async () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      try {
        const tasks = Object.values(appState$.tasks.byId.get());
        const changedTasks = tasks.filter(task => task._meta.isDirty);
        
        if (changedTasks.length > 0) {
          console.log(`Saving ${changedTasks.length} changed tasks to IndexedDB`);
          await persistenceManager.bulkSaveTasks(changedTasks);
        }
      } catch (error) {
        console.error('Error saving tasks to IndexedDB:', error);
      }
    }, 500); // 500ms debounce
  });

  // Periodic cleanup
  setInterval(async () => {
    await persistenceManager.cleanup();
  }, 24 * 60 * 60 * 1000); // Daily cleanup

  console.log('Enhanced persistence layer initialized');
};

// Conflict resolution helpers
export const conflictResolution = {
  // Auto-resolve using "last writer wins" strategy
  autoResolveLastWriter: async (): Promise<number> => {
    const conflicts = await persistenceManager.getConflicts();
    let resolvedCount = 0;

    for (const conflict of conflicts) {
      const latest = conflict.local._meta.lastModified > conflict.remote._meta.lastModified 
        ? conflict.local 
        : conflict.remote;
      
      // Save the latest version
      await persistenceManager.saveTask(latest);
      await persistenceManager.resolveConflict(conflict.id);
      
      // Update app state
      appState$.tasks.byId[latest.id].set(latest);
      resolvedCount++;
    }

    return resolvedCount;
  },

  // Manual conflict resolution
  resolveConflict: async (conflictId: string, chosenTask: TaskWithMeta): Promise<void> => {
    await persistenceManager.saveTask(chosenTask);
    await persistenceManager.resolveConflict(conflictId);
    appState$.tasks.byId[chosenTask.id].set(chosenTask);
  },

  // Get pending conflicts for UI
  getPendingConflicts: () => persistenceManager.getConflicts(),
};
