import React from 'react';
import Header from './components/shared/Header';
import TaskList from './components/shared/TaskList';
import { category, priority, TZTaskSchema } from './lib/validation/task';

export default function App() {
  const [data, setData] = React.useState<TZTaskSchema[]>([
    {
      id: '1',
      name: 'Create a new task',
      category: category.other,
      priority: priority.LOW,
      completed: false,
    },
    {
      id: '2',
      name: 'Complete the task',
      category: category.work,
      priority: priority.HIGH,
      completed: false,
    },
    {
      id: '3',
      name: 'Delete the task',
      category: category.personal,
      priority: priority.MEDIUM,
      completed: false,
    },
  ]);
  React.useEffect(() => {
    const tasks = localStorage.getItem('tasks');
    if (tasks) {
      setData((prev) => {
        const localData = [...prev, ...JSON.parse(tasks)] as TZTaskSchema[];

        const uniqueIds = Array.from(new Set(localData.map((task) => task.id)));
        const uniqueTasks = uniqueIds.map(findTaskById(localData));
        return uniqueTasks;
      });
    }
  }, []);
  function findTaskById(tasks: TZTaskSchema[]) {
    return (id: string) => tasks.find((task) => task.id === id)!;
  }

  return (
    <React.Fragment>
      <Header setData={setData} />
      <TaskList data={data} setData={setData} />
    </React.Fragment>
  );
}
