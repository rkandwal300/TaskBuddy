import React from 'react';
import { observer } from '@legendapp/state/react';
import Header from './components/shared/Header';
import TaskList from './components/shared/TaskList';
import { ApiDebugger } from './components/shared/ApiDebugger';
import { appState$ } from './state/tasks';
import { taskOperations } from './state/sync';

// Sync status indicator component
const SyncStatus = observer(() => {
  const isOnline = appState$.sync.isOnline.get();
  const pendingOps = appState$.sync.pendingOperations.get();
  const syncError = appState$.sync.syncError.get();
  const lastSync = appState$.sync.lastSync.get();
  const isLoading = appState$.ui.isLoading.get();

  const handleTestConnection = async () => {
    const connected = await taskOperations.testConnection();
    alert(connected ? '✅ API Connection Successful!' : '❌ API Connection Failed');
  };

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 p-2 border-b">
      {/* Connection status */}
      <div className="flex items-center gap-1">
        <div 
          className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
        />
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {/* Pending operations */}
      {pendingOps > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-orange-600">
            {pendingOps} pending
          </span>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center gap-1">
          <div className="animate-spin w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full" />
          <span>Syncing...</span>
        </div>
      )}

      {/* Sync error */}
      {syncError && (
        <div className="flex items-center gap-1 text-red-600">
          <span>⚠️ {syncError}</span>
          <button 
            onClick={() => taskOperations.retryFailed()}
            className="text-blue-600 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Last sync time */}
      {lastSync && !syncError && (
        <div className="text-gray-500 ml-auto">
          Last sync: {new Date(lastSync).toLocaleTimeString()}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 ml-auto">
        <button 
          onClick={handleTestConnection}
          className="px-2 py-1 text-green-600 hover:bg-green-50 rounded text-xs"
        >
          Test API
        </button>
        {isOnline && (
          <button 
            onClick={() => taskOperations.sync()}
            disabled={isLoading}
            className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
          >
            Sync
          </button>
        )}
      </div>
    </div>
  );
});

const App = observer(() => {
  return (
    <React.Fragment>
      <SyncStatus />
      <Header />
      <div className="max-w-4xl mx-auto p-4">
        <ApiDebugger />
      </div>
      <TaskList />
    </React.Fragment>
  );
});

export default App;
