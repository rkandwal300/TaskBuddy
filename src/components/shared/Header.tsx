import React from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import CreateTask from './CreateTask';

export default function Header() {
  const [open, setOpen] = React.useState(false);
  
  return (
    <div className="flex p-4 justify-between items-center border-b bg-white shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg font-medium">Task Buddy</span>
        <span className="text-sm text-gray-500 bg-blue-100 px-2 py-1 rounded-full">
          Offline-First
        </span>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Create Task
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0">
          <CreateTask setOpen={setOpen} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
