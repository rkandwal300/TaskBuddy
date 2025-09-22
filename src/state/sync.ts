// src/state/sync.ts
import { appState$, TaskWithMeta, taskHelpers, computed } from './tasks';
import { persistenceManager, conflictResolution } from './persistence';
import { category, priority } from '../lib/validation/task';

// Operation queue for offline actions
interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  taskId: string;
  task: TaskWithMeta;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

class OfflineFirstManager {
  private operationQueue: OfflineOperation[] = [];
  private isProcessingQueue = false;
  private readonly maxRetries = 3;
  private readonly baseUrl = 'https://todolist-be-gv5c.onrender.com';  

  constructor() {
    this.setupNetworkListeners();
    // Don't call async methods in constructor
    setTimeout(() => this.loadOfflineQueue(), 0);
    // Load initial data from server if online
    setTimeout(() => this.initialDataSync(), 1000);
  }

  private setupNetworkListeners(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Network connection restored');
      appState$.sync.isOnline.set(true);
      appState$.sync.syncError.set(null);
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      console.log('Network connection lost');
      appState$.sync.isOnline.set(false);
    });

    // Update initial state
    appState$.sync.isOnline.set(navigator.onLine);
  }

  private async loadOfflineQueue(): Promise<void> {
    try {
      const stored = localStorage.getItem('taskbuddy-offline-queue');
      if (stored) {
        this.operationQueue = JSON.parse(stored);
        appState$.sync.pendingOperations.set(this.operationQueue.length);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  }

  private async saveOfflineQueue(): Promise<void> {
    try {
      localStorage.setItem('taskbuddy-offline-queue', JSON.stringify(this.operationQueue));
      appState$.sync.pendingOperations.set(this.operationQueue.length);
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  // Initial sync to load data from server
  private async initialDataSync(): Promise<void> {
    if (!appState$.sync.isOnline.get()) {
      console.log('Offline - skipping initial sync');
      return;
    }

    try {
      console.log('Loading initial data from server...');
      const response = await fetch(`${this.baseUrl}/tasks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const serverTasks = await response.json();
        console.log(`Loaded ${serverTasks.length} tasks from server`);

        // Convert server tasks to our format with metadata
        const byId: Record<string, TaskWithMeta> = {};
        const allIds: string[] = [];

        serverTasks.forEach((serverTask: {
          id: string;
          name: string;
          category: string;
          priority: string;
          completed: number | boolean;
          createdAt?: string;
          updatedAt?: string;
        }) => {
          const task: TaskWithMeta = {
            id: serverTask.id,
            name: serverTask.name,
            category: serverTask.category as category,
            priority: serverTask.priority as priority,
            completed: serverTask.completed === 1 || serverTask.completed === true, // Handle both number and boolean
            createdAt: serverTask.createdAt || new Date().toISOString(),
            _meta: {
              version: 1,
              lastModified: serverTask.updatedAt || serverTask.createdAt || new Date().toISOString(),
              isDirty: false,
              isDeleted: false,
              syncStatus: 'synced',
            },
          };
          byId[task.id] = task;
          allIds.push(task.id);
        });

        // Only update if we don't have local data or if server has more recent data
        const currentTasks = appState$.tasks.allIds.get();
        if (currentTasks.length === 0 || confirm('Load data from server? This will replace local changes.')) {
          appState$.tasks.byId.set(byId);
          appState$.tasks.allIds.set(allIds);
          await persistenceManager.bulkSaveTasks(Object.values(byId));
          appState$.sync.lastSync.set(new Date().toISOString());
        }
      } else {
        console.error('Failed to load initial data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error during initial sync:', error);
    }
  }

  // Add operation to offline queue
  private async queueOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queuedOperation: OfflineOperation = {
      ...operation,
      id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    this.operationQueue.push(queuedOperation);
    await this.saveOfflineQueue();

    // Process immediately if online
    if (appState$.sync.isOnline.get()) {
      this.processOfflineQueue();
    }
  }

  // Optimistic task creation
  async createTask(taskData: Omit<TaskWithMeta, 'id' | 'createdAt' | '_meta'>): Promise<TaskWithMeta> {
    const task = taskHelpers.createTask(taskData);

    // Optimistically add to state
    appState$.tasks.byId[task.id].set(task);
    appState$.tasks.allIds.push(task.id);

    // Queue for sync
    await this.queueOperation({
      type: 'create',
      taskId: task.id,
      task,
    });

    console.log('Task created optimistically:', task.name);
    return task;
  }

  // Optimistic task update
  async updateTask(taskId: string, updates: Partial<TaskWithMeta>): Promise<TaskWithMeta | null> {
    const currentTask = appState$.tasks.byId[taskId].get();
    if (!currentTask) {
      console.error('Task not found for update:', taskId);
      return null;
    }

    const updatedTask = taskHelpers.updateTask(currentTask, updates);

    // Optimistically update state
    appState$.tasks.byId[taskId].set(updatedTask);

    // Queue for sync
    await this.queueOperation({
      type: 'update',
      taskId,
      task: updatedTask,
    });

    console.log('Task updated optimistically:', updatedTask.name);
    return updatedTask;
  }

  // Optimistic task deletion
  async deleteTask(taskId: string): Promise<boolean> {
    const currentTask = appState$.tasks.byId[taskId].get();
    if (!currentTask) {
      console.error('Task not found for deletion:', taskId);
      return false;
    }

    const deletedTask = taskHelpers.deleteTask(currentTask);

    // Optimistically mark as deleted
    appState$.tasks.byId[taskId].set(deletedTask);

    // Queue for sync
    await this.queueOperation({
      type: 'delete',
      taskId,
      task: deletedTask,
    });

    console.log('Task deleted optimistically:', deletedTask.name);
    return true;
  }

  // Process offline queue when online
  async processOfflineQueue(): Promise<void> {
    if (this.isProcessingQueue || !appState$.sync.isOnline.get() || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    appState$.ui.isLoading.set(true);

    console.log(`Processing ${this.operationQueue.length} offline operations`);

    const processedOperations: string[] = [];
    const failedOperations: OfflineOperation[] = [];

    for (const operation of this.operationQueue) {
      try {
        const success = await this.syncOperation(operation);
        if (success) {
          processedOperations.push(operation.id);
          
          // Mark task as synced
          const syncedTask = taskHelpers.markSynced(operation.task);
          appState$.tasks.byId[operation.taskId].set(syncedTask);
        } else {
          operation.retryCount++;
          if (operation.retryCount < this.maxRetries) {
            failedOperations.push(operation);
          } else {
            console.error('Operation failed after max retries:', operation);
            // Mark task with sync error
            const errorTask = {
              ...operation.task,
              _meta: {
                ...operation.task._meta,
                syncStatus: 'error' as const,
              },
            };
            appState$.tasks.byId[operation.taskId].set(errorTask);
          }
        }
      } catch (error) {
        console.error('Error processing operation:', operation, error);
        operation.retryCount++;
        operation.lastError = error instanceof Error ? error.message : 'Unknown error';
        
        if (operation.retryCount < this.maxRetries) {
          failedOperations.push(operation);
        }
      }
    }

    // Update queue with failed operations
    this.operationQueue = failedOperations;
    await this.saveOfflineQueue();

    // Update sync status
    if (processedOperations.length > 0) {
      appState$.sync.lastSync.set(new Date().toISOString());
      await persistenceManager.updateLastSync();
    }

    if (failedOperations.length > 0) {
      appState$.sync.syncError.set(`${failedOperations.length} operations failed to sync`);
    } else {
      appState$.sync.syncError.set(null);
    }

    appState$.ui.isLoading.set(false);
    this.isProcessingQueue = false;

    console.log(`Sync completed. ${processedOperations.length} synced, ${failedOperations.length} failed`);
  }

  // Sync single operation with server
  private async syncOperation(operation: OfflineOperation): Promise<boolean> {
    try {
      const response = await this.makeApiCall(operation);
      
      if (response.ok) {
        if (operation.type === 'create' || operation.type === 'update') {
          // For create/update, backend returns { id }
          const result = await response.json();
          console.log(`${operation.type} operation successful:`, result);
        }
        // For delete, no body is returned (204)
        
        return true;
      } else if (response.status === 409) {
        // Conflict - handle server version
        console.warn('Sync conflict detected for:', operation.taskId);
        // For now, we'll consider this a failed sync and retry later
        return false;
      } else if (response.status === 404 && operation.type === 'delete') {
        // Task already deleted on server - consider this success
        console.log('Task already deleted on server:', operation.taskId);
        return true;
      } else {
        console.error('Sync failed:', response.status, response.statusText);
        if (response.status >= 400 && response.status < 500) {
          // Client error - probably malformed data, don't retry
          console.error('Client error, will not retry:', await response.text());
          return true; // Mark as "successful" to remove from queue
        }
        return false;
      }
    } catch (error) {
      console.error('Network error during sync:', error);
      return false;
    }
  }

  private async makeApiCall(operation: OfflineOperation): Promise<Response> {
    const basePath = `${this.baseUrl}/tasks`;
    const url = operation.type === 'create' ? basePath : `${basePath}/${operation.taskId}`;
    
    console.log(`🔄 Making ${operation.type.toUpperCase()} request to:`, url);
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Prepare data for backend - backend expects boolean for completed
    const taskData = {
      name: operation.task.name,
      priority: operation.task.priority,
      category: operation.task.category,
      completed: operation.task.completed, // Backend expects boolean, not number
    };

    console.log('📤 Request data:', taskData);

    let response: Response;

    switch (operation.type) {
      case 'create':
        response = await fetch(url, {
          ...config,
          method: 'POST',
          body: JSON.stringify(taskData),
        });
        break;
      
      case 'update':
        response = await fetch(url, {
          ...config,
          method: 'PUT',
          body: JSON.stringify(taskData),
        });
        break;
      
      case 'delete':
        response = await fetch(url, {
          ...config,
          method: 'DELETE',
        });
        break;
      
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }

    console.log(`📥 ${operation.type.toUpperCase()} response:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers),
    });

    return response;
  }

  // Force sync all tasks
  async forceSyncAll(): Promise<void> {
    if (!appState$.sync.isOnline.get()) {
      throw new Error('Cannot sync while offline');
    }

    appState$.ui.isLoading.set(true);

    try {
      // Get all pending tasks
      const pendingTasks = computed.pendingSyncTasks();
      
      // Add all pending tasks to queue
      for (const task of pendingTasks) {
        await this.queueOperation({
          type: task._meta.operation || 'update',
          taskId: task.id,
          task,
        });
      }

      // Process queue
      await this.processOfflineQueue();
    } finally {
      appState$.ui.isLoading.set(false);
    }
  }

  // Get queue status for UI
  getQueueStatus() {
    return {
      pending: this.operationQueue.length,
      isProcessing: this.isProcessingQueue,
      isOnline: appState$.sync.isOnline.get(),
      lastSync: appState$.sync.lastSync.get(),
      syncError: appState$.sync.syncError.get(),
    };
  }

  // Manual retry of failed operations
  async retryFailedOperations(): Promise<void> {
    const failedOps = this.operationQueue.filter(op => op.retryCount > 0);
    
    // Reset retry count for manual retry
    failedOps.forEach(op => {
      op.retryCount = 0;
      op.lastError = undefined;
    });

    await this.saveOfflineQueue();
    await this.processOfflineQueue();
  }

  // Test API connection with detailed debugging
  async testApiConnection(): Promise<boolean> {
    console.log('🧪 Testing API connection...');
    console.log('🌐 Base URL:', this.baseUrl);
    
    try {
      console.log('📤 Making GET request to:', `${this.baseUrl}/tasks`);
      
      const response = await fetch(`${this.baseUrl}/tasks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);
      console.log('📥 Response headers:', Object.fromEntries(response.headers));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API connection successful');
        console.log('📊 Data received:', data);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ API connection failed');
        console.error('🔍 Error response:', errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ API connection test failed with network error:');
      console.error('🔍 Error details:', error);
      console.error('🔍 Error type:', typeof error);
      console.error('🔍 Error message:', error instanceof Error ? error.message : 'Unknown error');
      
      // Check if it's a CORS error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🚨 Possible CORS issue or network connectivity problem');
      }
      
      return false;
    }
  }
}

// Create singleton instance
export const offlineManager = new OfflineFirstManager();

// Public API for task operations
export const taskOperations = {
  create: (task: Omit<TaskWithMeta, 'id' | 'createdAt' | '_meta'>) => 
    offlineManager.createTask(task),
  
  update: (taskId: string, updates: Partial<TaskWithMeta>) => 
    offlineManager.updateTask(taskId, updates),
  
  delete: (taskId: string) => 
    offlineManager.deleteTask(taskId),
  
  toggleComplete: async (taskId: string) => {
    const task = appState$.tasks.byId[taskId].get();
    if (task) {
      return offlineManager.updateTask(taskId, { completed: !task.completed });
    }
  },
  
  sync: () => offlineManager.processOfflineQueue(),
  
  forceSync: () => offlineManager.forceSyncAll(),
  
  retryFailed: () => offlineManager.retryFailedOperations(),
  
  getStatus: () => offlineManager.getQueueStatus(),

  testConnection: () => offlineManager.testApiConnection(),
};

// Auto-resolve conflicts on app start
setTimeout(async () => {
  if (appState$.sync.isOnline.get()) {
    const resolved = await conflictResolution.autoResolveLastWriter();
    if (resolved > 0) {
      console.log(`Auto-resolved ${resolved} conflicts using last-writer-wins strategy`);
    }
  }
}, 1000);
