import { observer } from '@legendapp/state/react';
import { computed, appState$ } from '../../state/tasks';
import { taskOperations } from '../../state/sync';
import Task from './Task';

const TaskList = observer(() => {
  const filter = appState$.ui.filter.get();
  const allTasks = computed.allTasks();
  
  // Filter tasks based on UI filter
  const tasksToShow = filter === 'pending' 
    ? computed.pendingTasks()
    : filter === 'completed'
    ? computed.completedTasks()
    : allTasks;

  const pendingTasks = computed.pendingTasks();
  const completedTasks = computed.completedTasks();

  return (
    <div className="flex flex-col flex-1 p-4 gap-4">
      {/* Filter controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => appState$.ui.filter.set('all')}
          className={`px-3 py-1 rounded ${
            filter === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All ({allTasks.length})
        </button>
        <button
          onClick={() => appState$.ui.filter.set('pending')}
          className={`px-3 py-1 rounded ${
            filter === 'pending' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pending ({pendingTasks.length})
        </button>
        <button
          onClick={() => appState$.ui.filter.set('completed')}
          className={`px-3 py-1 rounded ${
            filter === 'completed' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Completed ({completedTasks.length})
        </button>
      </div>

      {/* Tasks section based on filter */}
      {filter === 'all' && (
        <>
          <h2 className="text-lg font-semibold">Pending Tasks</h2>
          {pendingTasks.length === 0 ? (
            <p className="text-gray-500 italic">No pending tasks</p>
          ) : (
            pendingTasks.map((task) => (
              <Task
                key={task.id}
                task={task}
                onToggleComplete={() => taskOperations.toggleComplete(task.id)}
                onDelete={() => taskOperations.delete(task.id)}
                onUpdate={(updates) => taskOperations.update(task.id, updates)}
              />
            ))
          )}
          
          <h2 className="text-lg font-semibold">Completed Tasks</h2>
          {completedTasks.length === 0 ? (
            <p className="text-gray-500 italic">No completed tasks</p>
          ) : (
            completedTasks.map((task) => (
              <Task
                key={task.id}
                task={task}
                onToggleComplete={() => taskOperations.toggleComplete(task.id)}
                onDelete={() => taskOperations.delete(task.id)}
                onUpdate={(updates) => taskOperations.update(task.id, updates)}
              />
            ))
          )}
        </>
      )}

      {filter !== 'all' && (
        <>
          <h2 className="text-lg font-semibold">
            {filter === 'pending' ? 'Pending' : 'Completed'} Tasks
          </h2>
          {tasksToShow.length === 0 ? (
            <p className="text-gray-500 italic">
              No {filter} tasks
            </p>
          ) : (
            tasksToShow.map((task) => (
              <Task
                key={task.id}
                task={task}
                onToggleComplete={() => taskOperations.toggleComplete(task.id)}
                onDelete={() => taskOperations.delete(task.id)}
                onUpdate={(updates) => taskOperations.update(task.id, updates)}
              />
            ))
          )}
        </>
      )}
    </div>
  );
});

export default TaskList;
