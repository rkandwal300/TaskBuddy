// src/components/shared/ApiDebugger.tsx
import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { taskOperations } from '../../state/sync';
import { computed, appState$ } from '../../state/tasks';
import { observer } from '@legendapp/state/react';

export const ApiDebugger = observer(() => {
  const [testing, setTesting] = useState(false);
  const [lastTest, setLastTest] = useState<{ success: boolean; timestamp: string } | null>(null);

  const queueStatus = taskOperations.getStatus();

  const testConnection = async () => {
    setTesting(true);
    console.log('🧪 Starting API connection test...');
    
    try {
      const isConnected = await taskOperations.testConnection();
      setLastTest({
        success: isConnected,
        timestamp: new Date().toLocaleTimeString(),
      });
      
      if (isConnected) {
        console.log('✅ API test completed successfully');
      } else {
        console.error('❌ API test failed');
      }
    } catch (error) {
      console.error('🚨 API test threw an error:', error);
      setLastTest({
        success: false,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setTesting(false);
    }
  };

  const testCreateTask = async () => {
    console.log('🧪 Testing task creation...');
    try {
      const testTask = await taskOperations.create({
        name: `Test Task ${new Date().toLocaleTimeString()}`,
        category: 'work' as const,
        priority: 'medium' as const,
        completed: false,
      });
      console.log('✅ Test task created:', testTask);
    } catch (error) {
      console.error('❌ Test task creation failed:', error);
    }
  };

  const forceSync = async () => {
    console.log('🔄 Forcing sync...');
    try {
      await taskOperations.sync();
      console.log('✅ Sync completed');
    } catch (error) {
      console.error('❌ Sync failed:', error);
    }
  };

  // Get current task counts
  const allTasks = computed.allTasks();
  const pendingSync = computed.pendingSyncTasks();
  const completedTasks = computed.completedTasks();
  const totalTasks = appState$.tasks.allIds.get().length;

  return (
    <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
      <h3 className="font-semibold text-lg">API Debug Panel</h3>
      
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <span>Connection:</span>
        <Badge variant={queueStatus.isOnline ? 'default' : 'destructive'}>
          {queueStatus.isOnline ? 'Online' : 'Offline'}
        </Badge>
      </div>

      {/* Queue Status */}
      <div className="flex items-center gap-2">
        <span>Pending Operations:</span>
        <Badge variant={queueStatus.pending > 0 ? 'secondary' : 'outline'}>
          {queueStatus.pending}
        </Badge>
      </div>

      {/* Sync Status */}
      {queueStatus.lastSync && (
        <div className="text-sm text-gray-600">
          Last sync: {new Date(queueStatus.lastSync).toLocaleString()}
        </div>
      )}

      {/* Sync Error */}
      {queueStatus.syncError && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          Error: {queueStatus.syncError}
        </div>
      )}

      {/* Test Results */}
      {lastTest && (
        <div className={`text-sm p-2 rounded ${
          lastTest.success ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
        }`}>
          API Test: {lastTest.success ? 'SUCCESS' : 'FAILED'} at {lastTest.timestamp}
        </div>
      )}

      {/* Test Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          onClick={testConnection} 
          disabled={testing}
          variant="outline"
          size="sm"
        >
          {testing ? 'Testing...' : 'Test API Connection'}
        </Button>
        
        <Button 
          onClick={testCreateTask}
          variant="outline"
          size="sm"
        >
          Test Create Task
        </Button>
        
        <Button 
          onClick={forceSync}
          disabled={queueStatus.isProcessing}
          variant="outline"
          size="sm"
        >
          Force Sync
        </Button>
        
        <Button 
          onClick={taskOperations.retryFailed}
          disabled={queueStatus.pending === 0}
          variant="outline"
          size="sm"
        >
          Retry Failed
        </Button>
      </div>

      {/* Task Counts */}
      <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
        <div>Total Tasks: {totalTasks}</div>
        <div>Pending Sync: {pendingSync.length}</div>
        <div>Completed: {completedTasks.length}</div>
        <div>Active: {allTasks.length - completedTasks.length}</div>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        Check browser console for detailed logs
      </div>
    </div>
  );
});