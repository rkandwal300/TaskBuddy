import React from 'react';
import Header from './components/shared/Header';
import TaskList from './components/shared/TaskList'; 
import { useTasks } from './hooks/useTasks';

export default function App() {
  
  const { tasks, toggleTask, deleteTask } = useTasks();
 

  return (
    <React.Fragment>
      <Header  />
      <TaskList data={tasks} setCompleted={toggleTask} setDelete={deleteTask} />
    </React.Fragment>
  );
}
