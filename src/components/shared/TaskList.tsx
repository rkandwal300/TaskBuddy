import Task from './Task';
import { store$ } from '../../lib/store/store';
import { use$ } from '@legendapp/state/react';


export default function TaskList() {
  const tasksList = use$(store$.taskList);
  const pendingTasks = tasksList.filter((task) => !task.completed);
  const completedTasks = tasksList.filter((task) => task.completed);
  return (
    <div className=" flex flex-col flex-1 p-4 gap-4">
      <h2 className="text-lg font-semibold">Pending Tasks</h2>
      {pendingTasks.map((task) => (
        <Task
          key={task.id}
          data={task}
        />
      ))}
      <h2 className="text-lg font-semibold">Completed Tasks</h2>
      {completedTasks.map((task) => (
        <Task
          key={task.id}
          data={task}
        />
      ))}
    </div>
  );
}
