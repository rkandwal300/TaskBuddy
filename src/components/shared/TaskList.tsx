import { TZTaskSchema } from '../../lib/validation/task';
import Task from './Task';

type Props = Readonly<{
  data: TZTaskSchema[];
  setData: (data: TZTaskSchema[]) => void;
}>;
export default function TaskList({ data, setData }: Props) {
  function handleToggleTask(task: TZTaskSchema) {
    const updatedTasks = data.map((item) => {
      if (item.id === task.id) {
        return task;
      }
      return item;
    });
    setData(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  }
  function handleDeleteTask(task: TZTaskSchema) {
    const updatedTasks = data.filter((item) => item.id !== task.id);
    setData(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  }

  const pendingTasks = data.filter((task) => !task.completed);
  const completedTasks = data.filter((task) => task.completed);
  return (
    <div className=" flex flex-col flex-1 p-4 gap-4">
      <h2 className="text-lg font-semibold">Pending Tasks</h2>
      {pendingTasks.map((task) => (
        <Task
          key={task.id}
          setCompleted={handleToggleTask}
          setDelete={handleDeleteTask}
          setData={setData}
          data={task}
        />
      ))}
      <h2 className="text-lg font-semibold">Completed Tasks</h2>
      {completedTasks.map((task) => (
        <Task
          key={task.id}
          setCompleted={handleToggleTask}
          setDelete={handleDeleteTask}
          setData={setData}
          data={task}
        />
      ))}
    </div>
  );
}
