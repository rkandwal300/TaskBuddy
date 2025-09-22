// src/state/tasks.ts
import { observable } from "@legendapp/state";
import { category, priority, TZTaskSchema } from "../lib/validation/task";

// Enhanced state with metadata for offline operations
export interface TaskMetadata {
  version: number;
  lastModified: string;
  isDirty: boolean; // Has pending changes
  isDeleted: boolean; // Soft delete
  syncStatus: "synced" | "pending" | "error";
  operation?: "create" | "update" | "delete";
}

export interface TaskWithMeta extends TZTaskSchema {
  _meta: TaskMetadata;
}

export interface AppState {
  tasks: {
    byId: Record<string, TaskWithMeta>;
    allIds: string[];
  };
  sync: {
    isOnline: boolean;
    lastSync: string | null;
    pendingOperations: number;
    syncError: string | null;
  };
  ui: {
    isLoading: boolean;
    filter: "all" | "pending" | "completed";
  };
}

// Initialize state with enhanced structure
export const appState$ = observable<AppState>({
  tasks: {
    byId: {},
    allIds: []
  },
  sync: {
    isOnline: navigator.onLine,
    lastSync: null,
    pendingOperations: 0,
    syncError: null,
  },
  ui: {
    isLoading: false,
    filter: "all",
  },
});

// Helper functions for task operations
export const taskHelpers = {
  // Create a new task with metadata
  createTask: (taskData: Omit<TZTaskSchema, "id" | "createdAt">): TaskWithMeta => {
    const now = new Date().toISOString();
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    return {
      id,
      createdAt: now,
      ...taskData,
      _meta: {
        version: 1,
        lastModified: now,
        isDirty: true,
        isDeleted: false,
        syncStatus: "pending",
        operation: "create",
      },
    };
  },

  // Update existing task
  updateTask: (task: TaskWithMeta, updates: Partial<TZTaskSchema>): TaskWithMeta => {
    const now = new Date().toISOString();
    return {
      ...task,
      ...updates,
      _meta: {
        ...task._meta,
        version: task._meta.version + 1,
        lastModified: now,
        isDirty: true,
        syncStatus: "pending",
        operation: "update",
      },
    };
  },

  // Soft delete task
  deleteTask: (task: TaskWithMeta): TaskWithMeta => {
    const now = new Date().toISOString();
    return {
      ...task,
      _meta: {
        ...task._meta,
        version: task._meta.version + 1,
        lastModified: now,
        isDirty: true,
        isDeleted: true,
        syncStatus: "pending",
        operation: "delete",
      },
    };
  },

  // Mark task as synced
  markSynced: (task: TaskWithMeta): TaskWithMeta => ({
    ...task,
    _meta: {
      ...task._meta,
      isDirty: false,
      syncStatus: "synced",
      operation: undefined,
    },
  }),
};

// Computed observables for easier data access
export const computed = {
  // All non-deleted tasks
  allTasks: () => {
    const byId = appState$.tasks.byId.get();
    const allIds = appState$.tasks.allIds.get();
    return allIds
      .map(id => byId[id])
      .filter(task => task && !task._meta.isDeleted);
  },

  // Pending tasks
  pendingTasks: () => {
    return computed.allTasks().filter(task => !task.completed);
  },

  // Completed tasks
  completedTasks: () => {
    return computed.allTasks().filter(task => task.completed);
  },

  // Tasks with pending sync
  pendingSyncTasks: () => {
    return computed.allTasks().filter(task => task._meta.isDirty);
  },
};

// Initialize with sample data
const initializeSampleData = () => {
  const sampleTasks = [
    {
      name: "Setup Legend State",
      category: category.work,
      priority: priority.HIGH,
      completed: false,
    },
    {
      name: "Implement offline sync",
      category: category.work,
      priority: priority.MEDIUM,
      completed: false,
    },
    {
      name: "Test offline functionality",
      category: category.other,
      priority: priority.LOW,
      completed: false,
    },
  ];

  sampleTasks.forEach(taskData => {
    const task = taskHelpers.createTask(taskData);
    // Mark as synced since these are initial data
    task._meta.isDirty = false;
    task._meta.syncStatus = "synced";
    task._meta.operation = undefined;
    
    appState$.tasks.byId[task.id].set(task);
    appState$.tasks.allIds.push(task.id);
  });
};

// Initialize only if no data exists
if (appState$.tasks.allIds.get().length === 0) {
  initializeSampleData();
}

// Legacy compatibility - will be replaced
export const tasks$ = {
  list: {
    get: () => computed.allTasks(),
    set: (tasks: TZTaskSchema[]) => {
      // Convert legacy format to new format
      const byId: Record<string, TaskWithMeta> = {};
      const allIds: string[] = [];
      
      tasks.forEach(task => {
        const taskWithMeta: TaskWithMeta = {
          ...task,
          _meta: {
            version: 1,
            lastModified: task.createdAt || new Date().toISOString(),
            isDirty: false,
            isDeleted: false,
            syncStatus: "synced",
          },
        };
        byId[task.id] = taskWithMeta;
        allIds.push(task.id);
      });
      
      appState$.tasks.byId.set(byId);
      appState$.tasks.allIds.set(allIds);
    },
    observe: (callback: () => void) => {
      return appState$.tasks.byId.onChange(callback);
    }
  },
};
